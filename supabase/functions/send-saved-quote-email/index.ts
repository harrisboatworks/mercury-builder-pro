import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { corsHeaders } from "../_shared/cors.ts";
import { buildEmail, detailsCard, esc } from "../_shared/email-layout.ts";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import { isAllowedOrigin, forbiddenOriginResponse } from "../_shared/origin-check.ts";
import { sanitizeEmailSubject } from "../send-quote-email/template-policy.ts";
import {
  authorizeSavedQuoteEmail,
  InvalidSavedQuoteEmailRequestError,
  isAuthorizedServiceRequest,
  SavedQuoteEmailUnavailableError,
} from "./quote-policy.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "POST", ...corsHeaders },
    });
  }

  const internalRequest = isAuthorizedServiceRequest(req, supabaseServiceKey);
  if (!internalRequest && !isAllowedOrigin(req)) {
    return forbiddenOriginResponse(corsHeaders);
  }

  try {
    const ipAllowed = await checkRateLimit(req, {
      action: "send_saved_quote_email_ip", maxAttempts: 30, windowMinutes: 60,
    });
    if (!ipAllowed) return rateLimitedResponse(corsHeaders, 300);

    const requestBody: unknown = await req.json();
    const resolved = await authorizeSavedQuoteEmail(
      requestBody,
      async (savedQuoteId, resumeToken) => {
        const { data, error } = await supabase
          .from("saved_quotes")
          .select("id,email,resume_token,quote_state,expires_at,is_soft_lead")
          .eq("id", savedQuoteId)
          .eq("resume_token", resumeToken)
          .maybeSingle();

        if (error) throw new Error("Saved quote lookup failed");
        return data;
      },
    );

    const recipientAllowed = await checkRateLimit(req, {
      identifier: resolved.recipient.toLowerCase(),
      action: "send_saved_quote_email_recipient", maxAttempts: 8, windowMinutes: 60,
    });
    if (!recipientAllowed) return rateLimitedResponse(corsHeaders, 300);

    const formattedPrice = new Intl.NumberFormat("en-CA", {
      style: "currency", currency: "CAD", minimumFractionDigits: 2,
    }).format(resolved.finalPrice);
    const formattedExpiry = new Date(resolved.expiresAt).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Toronto",
    });

    const rows = [
      { label: "Reference", value: esc(resolved.referenceNumber) },
      { label: "Motor", value: esc(resolved.motorModel) },
      { label: resolved.priceLabel, value: `${esc(formattedPrice)} CAD` },
    ];

    const body = `
      <p style="margin:0 0 14px 0;">Hi ${esc(resolved.customerName)},</p>
      <p style="margin:0 0 14px 0;">We saved your Mercury motor quote so you can pick it back up whenever you are ready.</p>
      ${detailsCard(rows)}
      <p style="margin:16px 0 0 0;font-size:13px;color:#6b7280;">This saved quote expires ${esc(formattedExpiry)}.</p>
      <p style="margin:22px 0 0 0;">Questions? Reply to this email or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
    `;

    const html = buildEmail({
      preheader: `Your saved Mercury ${resolved.motorModel} quote is ready to resume.`,
      heading: "Your saved quote is ready",
      bodyHtml: body,
      ctaText: "Open your saved quote",
      ctaUrl: resolved.quoteLink,
      footerNote: "Pickup is in person at our Gores Landing shop.",
    });

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Harris Boat Works <quotes@mercuryrepower.ca>",
      replyTo: "info@harrisboatworks.ca",
      to: [resolved.recipient],
      subject: sanitizeEmailSubject(
        `Your Mercury ${resolved.motorModel} quote is saved | Harris Boat Works`,
      ),
      html,
    });

    if (emailError || !emailData?.id) {
      throw new Error("Saved quote email delivery failed");
    }

    return jsonResponse({ success: true, messageId: emailData.id }, 200);
  } catch (error: unknown) {
    if (error instanceof InvalidSavedQuoteEmailRequestError) {
      return jsonResponse({ error: "Invalid request" }, 400);
    }
    if (error instanceof SavedQuoteEmailUnavailableError) {
      return jsonResponse({ error: "Saved quote unavailable" }, 404);
    }

    console.error("send-saved-quote-email error:", error instanceof Error ? error.message : "Unknown error");
    return jsonResponse({ error: "Unable to send saved quote email" }, 500);
  }
};

serve(handler);
