import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { buildEmail, buildAdminEmail, detailsCard, esc } from "../_shared/email-layout.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const responseHeaders = { "Content-Type": "application/json" };

interface DepositConfirmationRequest {
  stripeSessionId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: Record<string, unknown>;
  depositAmount: string;
  paymentId?: string;
  motorInfo?: { model?: string; hp?: number; year?: number };
  sendAdminNotification?: boolean;
  adminOnly?: boolean;
  pricingData?: any;
  quoteUrl?: string;
}

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

function generateReferenceNumber(paymentId?: string): string {
  if (paymentId) return `HBW-${paymentId.slice(-8).toUpperCase()}`;
  return `HBW-${Date.now().toString(36).toUpperCase()}`;
}

function getMotorLabel(motorInfo?: { model?: string; hp?: number; year?: number }): string {
  if (!motorInfo?.model) return "";
  return motorInfo.model;
}

function createDepositConfirmationEmail(
  customerName: string,
  depositAmount: string,
  referenceNumber: string,
  motorLabel: string,
  paymentId: string,
  quoteUrl?: string,
): string {
  const dateStr = new Date().toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric", timeZone: "America/Toronto",
  });

  const rows: Array<{ label: string; value: string }> = [];
  if (motorLabel) rows.push({ label: "Motor", value: esc(motorLabel) });
  rows.push({ label: "Deposit", value: `$${esc(depositAmount)} CAD` });
  rows.push({ label: "Reference", value: esc(referenceNumber) });
  if (paymentId && paymentId !== "TEMPLATE-PREVIEW") {
    rows.push({ label: "Payment ID", value: `<span style="font-family:monospace;font-size:12px;font-weight:500;">${esc(paymentId)}</span>` });
  }
  rows.push({ label: "Date", value: esc(dateStr) });

  const motorPhrase = motorLabel ? ` for your ${esc(motorLabel)}` : "";
  const reservationPolicy = Number(depositAmount) === 100
    ? `<div style="margin:18px 0 0 0;padding:14px 16px;border:1px solid #d7dee8;background:#f7f4ee;border-radius:6px;color:#1f2430;font-size:14px;line-height:1.55;"><strong>Your $100 reservation terms:</strong> The deposit is fully refundable until HBW confirms the exact motor, price, availability and ETA, and you approve the order in writing. After written approval, it becomes non-refundable and is credited to your final invoice.</div>`
    : "";

  const body = `
    <p style="margin:0 0 14px 0;">Hi ${esc(customerName)},</p>
    <p style="margin:0 0 14px 0;">We received your reservation deposit${motorPhrase}. Harris Boat Works will confirm availability and ETA with you before any motor is ordered.</p>
    ${detailsCard(rows)}
    ${reservationPolicy}
    <h2 style="margin:28px 0 12px 0;font-size:16px;font-weight:700;color:#1f2430;">What happens next</h2>
    <ol style="margin:0;padding-left:20px;color:#1f2430;">
      <li style="margin:0 0 8px 0;">We call you within one business day to confirm the exact motor, availability, ETA, and any fit questions.</li>
      <li style="margin:0 0 8px 0;">After those details are confirmed, we arrange the next step with you.</li>
      <li style="margin:0 0 8px 0;">Pickup is at our shop in Gores Landing. Please come in person and bring valid government-issued photo ID.</li>
    </ol>
    <p style="margin:22px 0 0 0;">Questions? Reply to this email or call us at <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
    <p style="margin:16px 0 0 0;">Thanks for choosing Harris Boat Works.</p>
  `;

  return buildEmail({
    preheader: `Reservation deposit received. HBW will confirm ${motorLabel || "the motor"} and ETA.`,
    heading: "Your reservation deposit is confirmed",
    bodyHtml: body,
    ctaText: quoteUrl ? "View your quote" : undefined,
    ctaUrl: quoteUrl,
    footerNote: "Pickup is in person at our Gores Landing shop. Please bring valid photo ID.",
  });
}

function createAdminNotificationEmail(
  customerName: string, customerEmail: string, customerPhone: string,
  depositAmount: string, referenceNumber: string, paymentId: string,
  motorInfo?: { model?: string; hp?: number; year?: number },
): string {
  const now = new Date().toLocaleString("en-CA", { timeZone: "America/Toronto" });
  const motorLine = getMotorLabel(motorInfo) || "Not specified";
  const appUrl = Deno.env.get("APP_URL") || "https://mercuryrepower.ca";

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;">
      <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Customer</td><td style="padding:6px 0;color:#1f2430;font-weight:600;">${esc(customerName)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;"><a href="mailto:${esc(customerEmail)}" style="color:#0f2a43;">${esc(customerEmail || "Not provided")}</a></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Phone</td><td style="padding:6px 0;">${customerPhone ? `<a href="tel:${esc(customerPhone)}" style="color:#0f2a43;">${esc(customerPhone)}</a>` : "Not provided"}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Motor</td><td style="padding:6px 0;color:#1f2430;font-weight:600;">${esc(motorLine)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Deposit</td><td style="padding:6px 0;color:#1f2430;font-weight:700;">$${esc(depositAmount)} CAD</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Reference</td><td style="padding:6px 0;color:#1f2430;">${esc(referenceNumber)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Stripe</td><td style="padding:6px 0;font-family:monospace;font-size:12px;color:#1f2430;">${esc(paymentId || "N/A")}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Time</td><td style="padding:6px 0;color:#1f2430;">${esc(now)} ET</td></tr>
    </table>
    <p style="margin:14px 0 0 0;font-size:13px;color:#1f2430;">Action: contact customer within 24 hours to confirm rigging and schedule pickup or install.</p>
    <p style="margin:10px 0 0 0;font-size:12px;color:#6b7280;">Open in admin: <a href="${appUrl}/admin/quotes" style="color:#0f2a43;">${appUrl}/admin/quotes</a></p>
  `;

  return buildAdminEmail({
    preheader: `${customerName} - ${motorLine} - $${depositAmount}`,
    heading: `${customerName} - ${motorLine} - $${depositAmount}`,
    bodyHtml: body,
    tag: "Deposit",
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { Allow: "POST, OPTIONS" } });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...responseHeaders, Allow: "POST, OPTIONS" },
    });
  }

  if (!isAuthorizedInternalRequest(req)) {
    logStep("Rejected unauthorized request");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: responseHeaders,
    });
  }

  try {
    const requestBody: DepositConfirmationRequest = await req.json();
    let {
      customerEmail, customerName, customerPhone, depositAmount,
      paymentId, motorInfo, sendAdminNotification, adminOnly, quoteUrl,
    } = requestBody;
    let savedQuoteId = "";
    let requiresSavedQuoteBinding = false;

    if (requestBody.stripeSessionId) {
      if (!/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(requestBody.stripeSessionId)) {
        throw new Error("Invalid Stripe session ID");
      }

      const { data: depositRecord, error: depositError } = await supabase
        .from("customer_quotes")
        .select("customer_name, customer_email, customer_phone, deposit_amount, quote_data")
        .eq("lead_source", "deposit")
        .contains("quote_data", { stripe_session_id: requestBody.stripeSessionId })
        .maybeSingle();

      const quoteData = depositRecord?.quote_data as Record<string, unknown> | null;
      if (depositError || !depositRecord || quoteData?.payment_status !== "paid") {
        throw new Error("Paid deposit record not found");
      }

      customerEmail = depositRecord.customer_email || "";
      customerName = depositRecord.customer_name || "Customer";
      customerPhone = depositRecord.customer_phone || "";
      depositAmount = String(depositRecord.deposit_amount ?? quoteData.deposit_amount ?? "");
      paymentId = typeof quoteData.stripe_payment_intent === "string"
        ? quoteData.stripe_payment_intent
        : "";
      motorInfo = quoteData.motor_info && typeof quoteData.motor_info === "object"
        ? quoteData.motor_info as DepositConfirmationRequest["motorInfo"]
        : undefined;
      savedQuoteId = typeof quoteData.saved_quote_id === "string"
        ? quoteData.saved_quote_id
        : "";
      requiresSavedQuoteBinding = quoteData.deposit_mode === "motor_reservation";
      if (requiresSavedQuoteBinding && !savedQuoteId) {
        throw new Error("Bound saved quote ID is required");
      }
      quoteUrl = undefined;
      sendAdminNotification = true;
      adminOnly = !customerEmail;
    } else {
      // The only legacy call is an internal, admin-only full-quote alert. It
      // may not send customer mail or read a caller-supplied storage path.
      if (
        !adminOnly
        || !sendAdminNotification
        || "quotePdfPath" in requestBody
        || "quote_pdf_path" in requestBody
      ) {
        throw new Error("A bound Stripe session is required");
      }
    }

    if (!customerName || !depositAmount) {
      throw new Error("Incomplete payment notification data");
    }

    logStep("Processing deposit emails", { customerEmail, customerName, depositAmount, paymentId });

    const referenceNumber = generateReferenceNumber(paymentId);
    const motorLabel = getMotorLabel(motorInfo);

    if (!adminOnly && customerEmail) {
      const emailHtml = createDepositConfirmationEmail(
        customerName, depositAmount, referenceNumber, motorLabel,
        paymentId || "", quoteUrl,
      );
      const customerSubject = motorLabel
        ? `Reservation deposit received: ${motorLabel} | Harris Boat Works`
        : `Reservation deposit received | Harris Boat Works`;

      const emailResponse = await resend.emails.send({
        from: "Harris Boat Works <deposits@mercuryrepower.ca>",
        reply_to: "info@harrisboatworks.ca",
        to: [customerEmail],
        subject: customerSubject,
        html: emailHtml,
        bcc: ["info@harrisboatworks.ca"],
      });
      if (emailResponse.error) {
        throw new Error(`Customer confirmation email failed: ${emailResponse.error.message}`);
      }
      logStep("Customer email sent", { id: emailResponse?.data?.id });
    }

    if (sendAdminNotification || adminOnly) {
      const adminHtml = createAdminNotificationEmail(
        customerName, customerEmail || "", customerPhone || "",
        depositAmount, referenceNumber, paymentId || "", motorInfo,
      );
      const adminSubject = `[DEPOSIT] ${customerName} - ${motorLabel || "motor"} - $${depositAmount}`;

      const adminResponse = await resend.emails.send({
        from: "Harris Boat Works System <deposits@mercuryrepower.ca>",
        to: ADMIN_EMAILS,
        subject: adminSubject,
        html: adminHtml,
      });
      if (adminResponse.error) {
        throw new Error(`Admin deposit email failed: ${adminResponse.error.message}`);
      }
      logStep("Admin notification sent", { id: adminResponse?.data?.id });
    }

    return new Response(JSON.stringify({ success: true, referenceNumber }), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    logStep("ERROR", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: responseHeaders,
    });
  }
});
