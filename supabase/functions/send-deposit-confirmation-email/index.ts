import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { GROK_BOT_AGENTMAIL } from "../_shared/grok-email-routing.ts";
import {
  createDepositConfirmationEmailHtml,
  createGrokDealEmailHtml,
  createInternalDealEmailHtml,
  customerDepositEmailSubject,
  hbwDepositEmailSubject,
} from "../_shared/deposit-email-templates.ts";
import { readPersistedDepositPolicy } from "../_shared/deposit-policy.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";
import { authenticatedBrowserCors, forbiddenOriginResponse } from "../_shared/origin-check.ts";
import {
  depositRecordIsPaid,
  formatDealAddressForEmail,
  resolveDealAddress,
  resolveDepositMailContact,
} from "../_shared/deposit-identity.ts";
import { boundSavedQuoteIdFromDeposit } from "../_shared/deposit-deal-record.ts";
import {
  assertDeliveryOutboxReady,
  assertNoCallerDocumentPath,
  assertResendApiKeyConfigured,
  audiencesNeedingDelivery,
  DEPOSIT_EMAIL_CLAIM_LEASE_SECONDS,
  DepositEmailOutboxError,
  deliveriesIndicateFailure,
  deriveDepositMailAttachmentKey,
  generateDepositReference,
  reportableDeliveryStatus,
  resendFailureCode,
  resendIdempotencyKey,
  sanitizeDeliveryError,
  seedDepositEmailDeliveryRows,
  sendResendEmailWithIdempotency,
  stableDepositTimestamp,
  type DepositEmailAudience,
  type DepositEmailStatus,
} from "../_shared/deposit-email-deliveries.ts";
import { resolveDepositAudienceRecipients } from "../_shared/deposit-staging-guard.ts";
import {
  assertCanonicalPaidQuoteDocument,
  QuoteDocumentUnavailableError,
} from "../_shared/quote-document-policy.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
const resend = new Resend(resendApiKey);

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const jsonHeaders = { "Content-Type": "application/json" };

const ADMIN_EMAILS = ["jayharris97@gmail.com", "harrisboatworks@hotmail.com"];

function logStep(step: string, data?: Record<string, unknown>) {
  console.log(`[DEPOSIT-EMAIL] ${step}`, data ? JSON.stringify(data) : "");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

function isAuthorizedInternalRequest(req: Request): boolean {
  if (!supabaseServiceKey) return false;
  const authorization = req.headers.get("authorization") || "";
  return constantTimeEqual(authorization, `Bearer ${supabaseServiceKey}`);
}

function stagingMailerEnv() {
  return {
    DEPOSIT_STAGING_MODE: Deno.env.get("DEPOSIT_STAGING_MODE"),
    DEPOSIT_STAGING_CUSTOMER_EMAIL: Deno.env.get("DEPOSIT_STAGING_CUSTOMER_EMAIL"),
    DEPOSIT_STAGING_HBW_EMAIL: Deno.env.get("DEPOSIT_STAGING_HBW_EMAIL"),
    DEPOSIT_STAGING_GROK_EMAIL: Deno.env.get("DEPOSIT_STAGING_GROK_EMAIL"),
    SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
  };
}

function generateReferenceNumber(paymentId?: string, savedQuoteId = ""): string {
  return generateDepositReference({
    paymentIntentId: paymentId,
    savedQuoteId: savedQuoteId || "00000000-0000-4000-8000-000000000000",
  });
}

function getMotorLabel(motorInfo?: { model?: string; hp?: number; year?: number }): string {
  if (!motorInfo?.model) return "";
  return motorInfo.model;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

async function authorizeMailer(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<Response | { ok: true; actor: "service_role" | "admin" }> {
  if (isAuthorizedInternalRequest(req)) {
    return { ok: true, actor: "service_role" };
  }
  const admin = await requireAdmin(req, corsHeaders);
  if (admin instanceof Response) return admin;
  return { ok: true, actor: "admin" };
}

serve(async (req) => {
  const cors = authenticatedBrowserCors(req);
  const responseHeaders = { ...jsonHeaders, ...cors.headers };

  if (cors.forbiddenOrigin) {
    return forbiddenOriginResponse(responseHeaders);
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...responseHeaders, Allow: "POST, OPTIONS" } });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...responseHeaders, Allow: "POST, OPTIONS" },
    });
  }

  const auth = await authorizeMailer(req, responseHeaders);
  if (auth instanceof Response) {
    logStep("Rejected unauthorized request");
    return auth;
  }

  try {
    const requestBody = await req.json() as Record<string, unknown>;
    assertNoCallerDocumentPath(requestBody);

    const stripeSessionId = typeof requestBody.stripeSessionId === "string"
      ? requestBody.stripeSessionId
      : "";
    const savedQuoteDealId = typeof requestBody.savedQuoteId === "string"
      ? requestBody.savedQuoteId
      : "";

    if (stripeSessionId && !/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(stripeSessionId)) {
      throw new Error("Invalid Stripe session ID");
    }

    const adminOnly = requestBody.adminOnly === true;
    const sendAdminNotification = requestBody.sendAdminNotification === true;
    if (!stripeSessionId && !savedQuoteDealId) {
      if (!adminOnly || !sendAdminNotification) {
        throw new Error("A bound Stripe session is required");
      }
      const customerName = typeof requestBody.customerName === "string" ? requestBody.customerName : "";
      const depositAmount = String(requestBody.depositAmount || "");
      const paymentId = typeof requestBody.paymentId === "string" ? requestBody.paymentId : "";
      const motorInfo = requestBody.motorInfo && typeof requestBody.motorInfo === "object"
        ? requestBody.motorInfo as { model?: string; hp?: number; year?: number }
        : undefined;
      if (!customerName || !depositAmount) {
        throw new Error("Incomplete payment notification data");
      }
      const adminHtml = createInternalDealEmailHtml({
        customerName,
        customerEmail: "",
        customerPhone: typeof requestBody.customerPhone === "string" ? requestBody.customerPhone : "",
        customerAddress: "",
        depositAmount,
        quoteTotal: null,
        remainingBalance: null,
        referenceNumber: generateReferenceNumber(paymentId),
        paymentId,
        sessionId: "",
        savedQuoteId: "",
        customerQuoteId: "",
        motorLabel: getMotorLabel(motorInfo),
        paidAt: "1970-01-01T00:00:00.000Z",
        policy: null,
        appUrl: Deno.env.get("APP_URL") || "https://mercuryrepower.ca",
      });
      const adminRecipients = resolveDepositAudienceRecipients({
        customerEmail: "",
        adminEmails: ADMIN_EMAILS,
        grokEmail: GROK_BOT_AGENTMAIL,
        env: stagingMailerEnv(),
      });
      const adminResponse = await resend.emails.send({
        from: "Harris Boat Works System <deposits@mercuryrepower.ca>",
        to: adminRecipients.hbw,
        subject: hbwDepositEmailSubject(customerName, getMotorLabel(motorInfo), depositAmount),
        html: adminHtml,
      });
      if (adminResponse.error) {
        throw new Error("Unable to send deposit confirmation");
      }
      return new Response(JSON.stringify({ success: true, referenceNumber: generateReferenceNumber(paymentId) }), {
        status: 200,
        headers: responseHeaders,
      });
    }

    let depositQuery = supabase
      .from("customer_quotes")
      .select("*")
      .eq("lead_source", "deposit");
    depositQuery = stripeSessionId
      ? depositQuery.eq("stripe_checkout_session_id", stripeSessionId)
      : depositQuery.eq("saved_quote_id", savedQuoteDealId);

    let { data: depositRecord, error: depositError } = (stripeSessionId || savedQuoteDealId)
      ? await depositQuery.maybeSingle()
      : { data: null, error: null };
    if ((depositError || !depositRecord) && stripeSessionId) {
      const legacy = await supabase
        .from("customer_quotes")
        .select("*")
        .eq("lead_source", "deposit")
        .contains("quote_data", { stripe_session_id: stripeSessionId })
        .maybeSingle();
      depositRecord = legacy.data;
      depositError = legacy.error;
    }
    if ((depositError || !depositRecord) && savedQuoteDealId) {
      const legacyByQuote = await supabase
        .from("customer_quotes")
        .select("*")
        .eq("lead_source", "deposit")
        .contains("quote_data", { saved_quote_id: savedQuoteDealId })
        .maybeSingle();
      depositRecord = legacyByQuote.data;
      depositError = legacyByQuote.error;
    }

    const quoteData = depositRecord?.quote_data as Record<string, unknown> | null;
    const savedQuoteId = depositRecord ? boundSavedQuoteIdFromDeposit(depositRecord) : "";
    if (depositError || !depositRecord || !savedQuoteId) {
      throw new Error("Paid deposit record not found");
    }

    const { data: savedQuote, error: savedQuoteError } = await supabase
      .from("saved_quotes")
      .select("id, email, expires_at, is_soft_lead, deposit_status, deposit_paid_at, created_at, quote_pdf_path, quote_pdf_sha256, quote_state, customer_full_name, customer_phone, customer_address_line1, customer_address_line2, customer_city, customer_region, customer_postal_code, customer_country")
      .eq("id", savedQuoteId)
      .maybeSingle();
    if (
      savedQuoteError
      || !savedQuote
      || !depositRecordIsPaid({
        savedQuoteDepositStatus: savedQuote.deposit_status,
        customerQuotePaymentStatus: depositRecord.payment_status,
        quoteDataPaymentStatus: quoteData?.payment_status,
      })
    ) {
      throw new Error("Paid deposit record not found");
    }

    const contact = resolveDepositMailContact({
      savedQuote,
      customerQuote: depositRecord,
    });
    if (!contact) {
      throw new Error("Paid deposit contact is incomplete");
    }
    const resolvedAddress = resolveDealAddress({
      savedQuote,
      customerQuote: depositRecord,
    });
    const canonicalPath = deriveDepositMailAttachmentKey(savedQuote.id);
    const { data: quoteDocument, error: quoteDocumentError } = await supabase
      .storage
      .from("quotes")
      .download(canonicalPath);

    const attachmentBytes = quoteDocument
      ? new Uint8Array(await quoteDocument.arrayBuffer())
      : null;
    try {
      const verified = await assertCanonicalPaidQuoteDocument({
        row: savedQuote,
        savedQuoteId: savedQuote.id,
        object: quoteDocumentError || !attachmentBytes
          ? null
          : {
              bytes: attachmentBytes,
              contentType: quoteDocument?.type || "application/pdf",
            },
      });
      if (verified.path !== canonicalPath || !attachmentBytes) {
        throw new QuoteDocumentUnavailableError();
      }
    } catch {
      throw new Error("Canonical reservation document is unavailable");
    }

    const attachment = {
      filename: `HBW-reservation-${savedQuote.id.slice(0, 8)}.pdf`,
      content: bytesToBase64(attachmentBytes),
    };

    const { error: seedError } = await supabase
      .from("deposit_email_deliveries")
      .upsert(
        seedDepositEmailDeliveryRows({
          customerQuoteId: depositRecord.id,
          savedQuoteId: savedQuote.id,
        }),
        { onConflict: "customer_quote_id,audience", ignoreDuplicates: true },
      );
    if (seedError) {
      throw new DepositEmailOutboxError();
    }

    const { data: deliveryRows, error: deliveryReadError } = await supabase
      .from("deposit_email_deliveries")
      .select("audience, status, attempt_count, provider_id, claim_token, claim_expires_at")
      .eq("customer_quote_id", depositRecord.id);
    if (deliveryReadError) {
      throw new DepositEmailOutboxError();
    }
    assertDeliveryOutboxReady(deliveryRows);

    const pendingAudiences = audiencesNeedingDelivery(deliveryRows);
    const customerName = contact.fullName;
    const customerEmail = contact.email;
    const customerPhone = contact.phone;
    const customerAddress = formatDealAddressForEmail(resolvedAddress);
    const depositAmount = String(depositRecord.deposit_amount ?? quoteData?.deposit_amount ?? "");
    const paymentId = typeof depositRecord.stripe_payment_intent_id === "string"
      ? depositRecord.stripe_payment_intent_id
      : typeof quoteData?.stripe_payment_intent === "string"
        ? quoteData.stripe_payment_intent
        : "";
    const sessionId = depositRecord.stripe_checkout_session_id
      || (typeof quoteData?.stripe_session_id === "string" ? quoteData.stripe_session_id : stripeSessionId);
    const motorInfo = quoteData?.motor_info && typeof quoteData.motor_info === "object"
      ? quoteData.motor_info as { model?: string; hp?: number; year?: number }
      : undefined;
    const paidAt = stableDepositTimestamp([
      depositRecord.payment_paid_at,
      savedQuote.deposit_paid_at,
      depositRecord.created_at,
      savedQuote.created_at,
    ]);
    const referenceNumber = generateDepositReference({
      paymentIntentId: paymentId,
      savedQuoteId: savedQuote.id,
    });
    const motorLabel = getMotorLabel(motorInfo);
    const pdfAttachment = [attachment];

    logStep("Processing deposit emails", {
      savedQuoteId: savedQuote.id,
      customerQuoteId: depositRecord.id,
      audiences: pendingAudiences,
      actor: auth.actor,
    });

    const results: Record<DepositEmailAudience, DepositEmailStatus> = {
      customer: (deliveryRows.find((row) => row.audience === "customer")?.status || "pending") as DepositEmailStatus,
      hbw: (deliveryRows.find((row) => row.audience === "hbw")?.status || "pending") as DepositEmailStatus,
      grok_bot: (deliveryRows.find((row) => row.audience === "grok_bot")?.status || "pending") as DepositEmailStatus,
    };

    const markFailed = async (audience: DepositEmailAudience, claimToken: string, error: unknown) => {
      const { error: failError } = await supabase.rpc("fail_deposit_email_delivery", {
        p_customer_quote_id: depositRecord.id,
        p_audience: audience,
        p_claim_token: claimToken,
        p_last_error: sanitizeDeliveryError(error),
      });
      results[audience] = "failed";
      if (failError) {
        logStep("Audience fail persist failed", { audience, savedQuoteId: savedQuote.id });
      }
    };

    const sendAudience = async (
      audience: DepositEmailAudience,
      payload: Parameters<typeof sendResendEmailWithIdempotency>[0]["payload"],
    ) => {
      const claimToken = crypto.randomUUID();
      const { data: claimed, error: claimError } = await supabase.rpc("claim_deposit_email_delivery", {
        p_customer_quote_id: depositRecord.id,
        p_audience: audience,
        p_claim_token: claimToken,
        p_lease_seconds: DEPOSIT_EMAIL_CLAIM_LEASE_SECONDS,
      });
      if (claimError) {
        results[audience] = "failed";
        logStep("Audience claim failed", { audience, savedQuoteId: savedQuote.id });
        return;
      }
      if (!claimed) {
        const current = deliveryRows.find((row) => row.audience === audience);
        results[audience] = current?.status === "sent" ? "sent" : (current?.status || "pending");
        return;
      }

      try {
        if (!assertResendApiKeyConfigured(resendApiKey)) {
          await markFailed(audience, claimToken, new Error("resend_api_key_missing"));
          logStep("Audience email failed", { audience, savedQuoteId: savedQuote.id, reason: "resend_api_key_missing" });
          return;
        }

        const provider = await sendResendEmailWithIdempotency({
          apiKey: resendApiKey,
          idempotencyKey: resendIdempotencyKey(depositRecord.id, audience),
          payload,
        });
        if (provider.kind !== "sent") {
          await markFailed(audience, claimToken, new Error(resendFailureCode(provider)));
          logStep("Audience email failed", { audience, savedQuoteId: savedQuote.id, reason: provider.kind });
          return;
        }

        const { data: completed, error: completeError } = await supabase.rpc("complete_deposit_email_delivery", {
          p_customer_quote_id: depositRecord.id,
          p_audience: audience,
          p_claim_token: claimToken,
          p_provider_id: provider.id,
        });
        const status = reportableDeliveryStatus({ completed, persistError: completeError });
        if (status !== "sent") {
          await markFailed(audience, claimToken, new Error("completion_failed"));
          results[audience] = "failed";
          logStep("Audience completion failed", { audience, savedQuoteId: savedQuote.id });
          return;
        }
        results[audience] = "sent";
        logStep("Audience email sent", { audience, providerId: provider.id, savedQuoteId: savedQuote.id });
      } catch (providerError) {
        await markFailed(audience, claimToken, providerError);
        logStep("Audience email failed", { audience, savedQuoteId: savedQuote.id, reason: "provider_exception" });
      }
    };

    const audienceRecipients = resolveDepositAudienceRecipients({
      customerEmail,
      adminEmails: ADMIN_EMAILS,
      grokEmail: GROK_BOT_AGENTMAIL,
      env: stagingMailerEnv(),
    });

    const depositPolicy = readPersistedDepositPolicy(quoteData);
    const quoteTotal = depositRecord.final_price ?? depositRecord.total_cost ?? null;
    const appUrl = Deno.env.get("APP_URL") || "https://mercuryrepower.ca";
    const customerHtml = createDepositConfirmationEmailHtml({
      customerName,
      depositAmount,
      referenceNumber,
      motorLabel,
      paidAt,
      policy: depositPolicy,
    });
    const internalInput = {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      depositAmount,
      quoteTotal,
      remainingBalance: null,
      referenceNumber,
      paymentId: paymentId || "",
      sessionId,
      savedQuoteId: savedQuote.id,
      customerQuoteId: depositRecord.id,
      motorLabel,
      paidAt,
      policy: depositPolicy,
      appUrl,
    };
    const internalHtml = createInternalDealEmailHtml(internalInput);
    const grokHtml = createGrokDealEmailHtml(internalInput);
    const internalSubject = hbwDepositEmailSubject(customerName, motorLabel, depositAmount);

    if (pendingAudiences.includes("customer") && audienceRecipients.customer[0]) {
      await sendAudience("customer", {
        from: "Harris Boat Works <deposits@mercuryrepower.ca>",
        reply_to: audienceRecipients.replyTo,
        to: audienceRecipients.customer,
        subject: customerDepositEmailSubject(motorLabel),
        html: customerHtml,
        attachments: pdfAttachment,
      });
    }

    if (pendingAudiences.includes("hbw")) {
      await sendAudience("hbw", {
        from: "Harris Boat Works System <deposits@mercuryrepower.ca>",
        to: audienceRecipients.hbw,
        subject: internalSubject,
        html: internalHtml,
        attachments: pdfAttachment,
      });
    }

    if (pendingAudiences.includes("grok_bot")) {
      await sendAudience("grok_bot", {
        from: "Harris Boat Works System <deposits@mercuryrepower.ca>",
        to: audienceRecipients.grok_bot,
        subject: internalSubject,
        html: grokHtml,
        attachments: pdfAttachment,
      });
    }

    return new Response(JSON.stringify({
      success: !deliveriesIndicateFailure(results),
      referenceNumber,
      savedQuoteId: savedQuote.id,
      deliveries: results,
    }), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    if (error instanceof DepositEmailOutboxError) {
      logStep("ERROR", { error: "delivery_outbox_unavailable" });
      return new Response(JSON.stringify({
        success: false,
        reason: "delivery_outbox_unavailable",
        deliveries: { customer: "pending", hbw: "pending", grok_bot: "pending" },
      }), {
        status: 200,
        headers: responseHeaders,
      });
    }
    logStep("ERROR", { error: error instanceof Error ? error.name : "delivery_error" });
    const message = error instanceof Error && (
      error.message === "Paid deposit record not found"
      || error.message === "A bound Stripe session is required"
      || error.message === "Invalid Stripe session ID"
      || error.message === "Caller document paths are not accepted"
      || error.message === "Public document URLs are not accepted"
      || error.message === "Canonical reservation document is unavailable"
      || error.message === "Paid deposit contact is incomplete"
    ) ? error.message : "Unable to send deposit confirmation";
    return new Response(JSON.stringify({ error: message }), {
      status: message === "Unable to send deposit confirmation" ? 500 : 400,
      headers: responseHeaders,
    });
  }
});
