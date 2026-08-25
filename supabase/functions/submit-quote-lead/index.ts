// Submit-quote-lead: service-role insert into customer_quotes for the final
// step of the quote builder. Lets ANONYMOUS visitors (not just logged-in
// users) submit a quote so the team can follow up.
//
// Phase 2: Turnstile-gated, submit-bound customer confirmation from the
// inserted row. No caller PDF/document, no customer SMS.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3.22.4";
import { checkRateLimit, rateLimitedResponse, getClientIdentifier } from "../_shared/rate-limit.ts";
import { forbiddenOriginResponse, isAllowedOrigin } from "../_shared/origin-check.ts";
import { resolveAllowedBrowserOrigin } from "../_shared/browser-origin.ts";
import { MISSING_TURNSTILE, verifyTurnstileToken } from "../_shared/turnstile.ts";
import {
  createSupabaseConsultationDocumentWriter,
  consultationPdfBase64,
  markConsultationDocumentJobEmailed,
  mintConsultationDocument,
} from "../_shared/consultation-document-mint.ts";
import { consultationSubmitDeliverySnapshot } from "../_shared/consultation-document-policy.ts";
import {
  assertNoCallerDocumentDelivery,
  buildConsultationQuoteMintedEmail,
  buildConsultationRequestReceivedEmail,
  consultationSubmitCustomerDestinations,
} from "../_shared/consultation-submit-delivery.ts";

const baseCorsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-session-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const HBW_ADMIN_QUOTE_INBOX = "info@harrisboatworks.ca";
const HBW_ADMIN_SMS = "+19053766208";
const CUSTOMER_QUOTE_SENDER = "Harris Boat Works - Mercury Marine <noreply@mercuryrepower.ca>";

const payloadSchema = z.object({
  anonymous_session_id: z.string().min(8).max(128).nullable().optional(),
  customer_name: z.string().trim().min(1).max(150),
  customer_email: z.string().trim().email().max(255),
  customer_phone: z.string().trim().min(7).max(32),
  contact_method: z.string().trim().max(32).optional(),
  notes: z.string().max(2000).optional().nullable(),
  motor_model: z.string().max(200).optional().nullable(),
  base_price: z.number().min(0).max(10_000_000),
  final_price: z.number().min(0).max(10_000_000),
  deposit_amount: z.number().min(0).max(10_000_000).default(0),
  loan_amount: z.number().min(0).max(10_000_000).default(0),
  monthly_payment: z.number().min(0).max(1_000_000).default(0),
  term_months: z.number().int().min(0).max(360).default(60),
  total_cost: z.number().min(0).max(10_000_000),
  tradein_value_pre_penalty: z.number().nullable().optional(),
  tradein_value_final: z.number().nullable().optional(),
  penalty_applied: z.boolean().optional().default(false),
  penalty_factor: z.number().nullable().optional(),
  penalty_reason: z.string().max(120).nullable().optional(),
  turnstileToken: z.string().min(20).max(2048),
  website: z.string().max(500).optional().nullable(),
});

function newSessionId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return `anon_${Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function newQuoteNumber(): string {
  const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return `HBW-${String(value).padStart(6, "0")}`;
}

function jsonHeaders(origin: string | null): Record<string, string> {
  return {
    ...baseCorsHeaders,
    "Access-Control-Allow-Origin": origin || "https://www.mercuryrepower.ca",
    "Content-Type": "application/json",
  };
}

serve(async (req) => {
  const origin = resolveAllowedBrowserOrigin(req.headers.get("origin"));
  const corsHeaders = jsonHeaders(origin);

  if (req.method === "OPTIONS") {
    if (!origin) return forbiddenOriginResponse(corsHeaders);
    return new Response(null, { headers: corsHeaders });
  }

  if (!isAllowedOrigin(req)) {
    return forbiddenOriginResponse(corsHeaders);
  }

  try {
    const raw = await req.json();
    if (raw && typeof raw === "object") {
      assertNoCallerDocumentDelivery(raw as Record<string, unknown>);
    }

    const parsed = payloadSchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: corsHeaders },
      );
    }

    const p = parsed.data;

    if (p.website && p.website.trim().length > 0) {
      return new Response(
        JSON.stringify({ success: true, quoteId: null, anonymousSessionId: null, quoteNumber: null }),
        { headers: corsHeaders },
      );
    }

    await verifyTurnstileToken({
      token: p.turnstileToken,
      remoteip: getClientIdentifier(req),
      secret: Deno.env.get("TURNSTILE_SECRET_KEY"),
    });

    const ipOk = await checkRateLimit(req, {
      action: "submit_quote_lead_ip",
      maxAttempts: 5,
      windowMinutes: 60,
      failClosed: true,
    });
    if (!ipOk) return rateLimitedResponse(corsHeaders, 60 * 60);

    const emailOk = await checkRateLimit(req, {
      identifier: `email:${p.customer_email.toLowerCase()}`,
      action: "submit_quote_lead_email",
      maxAttempts: 5,
      windowMinutes: 60,
      failClosed: true,
    });
    if (!emailOk) return rateLimitedResponse(corsHeaders, 60 * 60);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
    if (!supabaseUrl || !serviceKey || !resendKey) {
      return new Response(JSON.stringify({ success: false, error: "Unexpected error" }), {
        status: 500,
        headers: corsHeaders,
      });
    }
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data: userData } = await supabase.auth.getUser(authHeader.slice(7));
      userId = userData.user?.id ?? null;
    }

    const sessionId = userId ? null : (p.anonymous_session_id || newSessionId());
    const quoteNumber = newQuoteNumber();
    const motorModel = p.motor_model?.trim() || "Mercury Motor";

    const insertRow = {
      user_id: userId,
      anonymous_session_id: sessionId,
      base_price: p.base_price,
      final_price: Math.round(p.final_price),
      deposit_amount: p.deposit_amount,
      loan_amount: p.loan_amount,
      monthly_payment: p.monthly_payment,
      term_months: p.term_months,
      total_cost: p.total_cost,
      customer_name: p.customer_name,
      customer_email: p.customer_email,
      customer_phone: p.customer_phone,
      lead_status: "scheduled",
      lead_source: "consultation",
      lead_score: 75,
      tradein_value_pre_penalty: p.tradein_value_pre_penalty ?? null,
      tradein_value_final: p.tradein_value_final ?? null,
      penalty_applied: Boolean(p.penalty_applied),
      penalty_factor: p.penalty_factor ?? null,
      penalty_reason: p.penalty_reason ?? null,
      discount_amount: 0,
      notes: p.notes && p.notes.trim().length
        ? `[${p.contact_method || "email"}] ${p.notes.trim()} | Motor: ${motorModel} | Ref: ${quoteNumber}`
        : `Motor: ${motorModel} | Ref: ${quoteNumber}`,
    };

    const { data, error } = await supabase
      .from("customer_quotes")
      .insert(insertRow as Record<string, unknown>)
      .select("id, customer_email, customer_name, customer_phone, final_price")
      .single();

    if (error || !data?.id || !data.customer_email) {
      console.error("[submit-quote-lead] insert error", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to submit quote" }),
        { status: 500, headers: corsHeaders },
      );
    }

    const destinations = consultationSubmitCustomerDestinations(String(data.customer_email));
    const persistedName = String(data.customer_name || p.customer_name);
    const persistedTotal = Number(data.final_price);
    const writer = createSupabaseConsultationDocumentWriter(supabase);
    let minted: Awaited<ReturnType<typeof mintConsultationDocument>> | null = null;
    try {
      minted = await mintConsultationDocument({
        quoteId: String(data.id),
        quoteNumber,
        snapshot: consultationSubmitDeliverySnapshot({
          customerName: persistedName,
          customerEmail: data.customer_email,
          customerPhone: data.customer_phone,
          motorModel,
          totalPrice: persistedTotal,
        }),
        writer,
      });
    } catch (mintError) {
      console.error("[submit-quote-lead] document mint failed", mintError instanceof Error ? mintError.name : "unknown");
    }

    const resend = new Resend(resendKey);
    if (minted) {
      try {
        await resend.emails.send({
          from: CUSTOMER_QUOTE_SENDER,
          to: destinations.to,
          reply_to: HBW_ADMIN_QUOTE_INBOX,
          subject: `Your Mercury ${motorModel} quote, ref ${quoteNumber} | Harris Boat Works`,
          html: buildConsultationQuoteMintedEmail({
            customerName: persistedName,
            quoteNumber,
            motorModel,
            totalPrice: persistedTotal,
            documentAccessUrl: minted.documentAccessUrl,
          }),
          attachments: [{
            filename: `Quote-${quoteNumber}.pdf`,
            content: consultationPdfBase64(minted.pdfBytes),
          }],
        });
        await markConsultationDocumentJobEmailed(writer, minted.jobId);
      } catch (emailError) {
        console.error("[submit-quote-lead] customer email failed", emailError instanceof Error ? emailError.name : "unknown");
      }
    } else {
      await resend.emails.send({
        from: CUSTOMER_QUOTE_SENDER,
        to: destinations.to,
        reply_to: HBW_ADMIN_QUOTE_INBOX,
        subject: `We received your Mercury quote request (${quoteNumber})`,
        html: buildConsultationRequestReceivedEmail({
          customerName: persistedName,
          quoteNumber,
          motorModel,
          totalPrice: persistedTotal,
        }),
      });
    }

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-quote-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerEmail: HBW_ADMIN_QUOTE_INBOX,
          customerName: "Harris Boat Works Admin",
          quoteNumber,
          motorModel,
          totalPrice: Number(data.final_price),
          emailType: "admin_quote_notification",
          leadData: {
            customerName: p.customer_name,
            customerEmail: String(data.customer_email),
            customerPhone: p.customer_phone,
            contactMethod: p.contact_method,
            leadScore: 75,
            quoteId: data.id,
          },
        }),
      });
    } catch (adminError) {
      console.error("[submit-quote-lead] admin email failed", adminError instanceof Error ? adminError.name : "unknown");
    }

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: HBW_ADMIN_SMS,
          message: `NEW QUOTE SUBMITTED\n\nCustomer: ${p.customer_name}\nMotor: ${motorModel}\nQuote: $${Number(data.final_price).toLocaleString()}\nRef: ${quoteNumber}\n\n- Harris Boat Works`,
          messageType: "hot_lead",
          auditMessage: `Admin hot-lead SMS for quote ${quoteNumber}`,
        }),
      });
    } catch (adminSmsError) {
      console.error("[submit-quote-lead] admin SMS failed", adminSmsError instanceof Error ? adminSmsError.name : "unknown");
    }

    return new Response(
      JSON.stringify({
        success: true,
        quoteId: data.id,
        anonymousSessionId: sessionId,
        quoteNumber,
      }),
      { headers: corsHeaders },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    if (message === MISSING_TURNSTILE || message === "Caller-controlled documents are not allowed") {
      return new Response(JSON.stringify({ success: false, error: message }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    console.error("[submit-quote-lead] unexpected error", err instanceof Error ? err.name : "unknown");
    return new Response(JSON.stringify({ success: false, error: "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
