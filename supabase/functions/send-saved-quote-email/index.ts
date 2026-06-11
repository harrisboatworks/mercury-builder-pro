import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";
import { buildEmail, detailsCard, esc } from "../_shared/email-layout.ts";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import { isAllowedOrigin, forbiddenOriginResponse } from "../_shared/origin-check.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SavedQuoteEmailRequest {
  customerEmail: string;
  customerName: string;
  quoteId: string;
  savedQuoteId?: string;
  resumeToken?: string;
  motorModel: string;
  finalPrice: number;
  quoteData?: any;
  includeAccountInfo?: boolean;
  expiresAt?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!isAllowedOrigin(req)) {
    return forbiddenOriginResponse(corsHeaders);
  }

  try {
    const {
      customerEmail, customerName, quoteId, savedQuoteId,
      motorModel, finalPrice, includeAccountInfo = false, expiresAt,
    }: SavedQuoteEmailRequest = await req.json();

    const ipAllowed = await checkRateLimit(req, {
      action: "send_saved_quote_email_ip", maxAttempts: 30, windowMinutes: 60,
    });
    if (!ipAllowed) return rateLimitedResponse(corsHeaders, 300);

    const recipientAllowed = await checkRateLimit(req, {
      identifier: String(customerEmail || "unknown").toLowerCase(),
      action: "send_saved_quote_email_recipient", maxAttempts: 8, windowMinutes: 60,
    });
    if (!recipientAllowed) return rateLimitedResponse(corsHeaders, 300);

    const siteUrl = Deno.env.get("SITE_URL") || "https://mercuryrepower.ca";
    const quoteLink = savedQuoteId
      ? `${siteUrl}/quote/saved/${savedQuoteId}`
      : `${siteUrl}/quote/saved/${quoteId}`;

    const formattedPrice = new Intl.NumberFormat("en-CA", {
      style: "currency", currency: "CAD", minimumFractionDigits: 2,
    }).format(finalPrice);

    const refNumber = (savedQuoteId || quoteId || "").slice(0, 8).toUpperCase();

    const expiresLine = expiresAt
      ? `<p style="margin:16px 0 0 0;font-size:13px;color:#6b7280;">This saved quote expires ${esc(new Date(expiresAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }))}.</p>`
      : `<p style="margin:16px 0 0 0;font-size:13px;color:#6b7280;">Your saved quote stays available for 30 days.</p>`;

    const accountLine = includeAccountInfo
      ? `<p style="margin:18px 0 0 0;font-size:14px;">We also created a quick-access account for you. Check your inbox for a separate sign-in link to manage all your quotes.</p>`
      : "";

    const rows = [
      { label: "Reference", value: esc(refNumber) },
      { label: "Motor", value: esc(motorModel) },
      { label: "Total", value: `${formattedPrice} CAD` },
    ];

    const body = `
      <p style="margin:0 0 14px 0;">Hi ${esc(customerName)},</p>
      <p style="margin:0 0 14px 0;">We saved your Mercury motor quote so you can pick it back up whenever you are ready.</p>
      ${detailsCard(rows)}
      ${accountLine}
      ${expiresLine}
      <p style="margin:22px 0 0 0;">Questions? Reply to this email or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
    `;

    const html = buildEmail({
      preheader: `Your saved Mercury ${motorModel} quote is ready to resume.`,
      heading: "Your saved quote is ready",
      bodyHtml: body,
      ctaText: "Open your saved quote",
      ctaUrl: quoteLink,
      footerNote: "Pickup is in person at our Gores Landing shop.",
    });

    const emailResponse = await resend.emails.send({
      from: "Harris Boat Works <quotes@mercuryrepower.ca>",
      replyTo: "info@harrisboatworks.ca",
      to: [customerEmail],
      subject: `Your Mercury ${motorModel} quote is saved | Harris Boat Works`,
      html,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-saved-quote-email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
