import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import { isAllowedOrigin, forbiddenOriginResponse } from "../_shared/origin-check.ts";
import {
  fetchQuotePdfAttachment,
  encodeBase64,
  QuotePdfRejected,
} from "../_shared/quote-pdf-attachment.ts";
import {
  verifyResendResult,
  EmailSendFailed,
  deriveIdempotencyKey,
  sha256Hex,
  normalizeRecipient,
  claimQuoteEmailDelivery,
  completeQuoteEmailDelivery,
} from "../_shared/quote-email-delivery.ts";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const leadDataSchema = z.object({
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().max(255).optional(),
  customerPhone: z.string().max(20).optional(),
  contactMethod: z.string().max(50).optional(),
  leadScore: z.number().min(0).max(100).optional(),
  quoteId: z.string().uuid().optional(),
}).optional();

const quoteEmailSchema = z.object({
  customerEmail: z.string().trim().email("Invalid email").max(255),
  customerName: z.string().trim().min(1).max(100),
  quoteNumber: z.string().max(50),
  motorModel: z.string().max(200),
  totalPrice: z.number().min(0).max(2000000),
  pdfUrl: z.string().url().max(2000).optional(),
  emailType: z.enum(['quote_delivery', 'follow_up', 'reminder', 'admin_quote_notification']),
  leadData: leadDataSchema,
  idempotencyKey: z.string().trim().min(8).max(200).optional(),
});

type QuoteEmailRequest = z.infer<typeof quoteEmailSchema>;

import { buildEmail, buildAdminEmail, detailsCard, esc } from "../_shared/email-layout.ts";

// Replace template variables with actual data
function replaceTemplateVariables(template: string, data: QuoteEmailRequest): string {
  return template
    .replace(/{{customerName}}/g, data.customerName)
    .replace(/{{quoteNumber}}/g, data.quoteNumber)
    .replace(/{{motorModel}}/g, data.motorModel)
    .replace(/{{totalPrice}}/g, data.totalPrice.toLocaleString());
}

function generateQuoteDeliveryEmail(data: QuoteEmailRequest): string {
  const rows = [
    { label: "Quote #", value: esc(data.quoteNumber) },
    { label: "Motor", value: esc(data.motorModel) },
    { label: "Total", value: `$${data.totalPrice.toLocaleString()} CAD` },
  ];
  const body = `
    <p style="margin:0 0 14px 0;">Hi ${esc(data.customerName)},</p>
    <p style="margin:0 0 14px 0;">Thanks for your interest. Here is the quote we prepared for you.</p>
    ${detailsCard(rows)}
    ${data.pdfUrl ? `<p style="margin:18px 0 0 0;color:#6b7280;font-size:14px;">A PDF copy of your full quote is attached.</p>` : ""}
    <h2 style="margin:28px 0 12px 0;font-size:16px;font-weight:700;color:#1f2430;">What is next</h2>
    <ul style="margin:0;padding-left:20px;color:#1f2430;">
      <li style="margin:0 0 8px 0;">Review the details at your own pace.</li>
      <li style="margin:0 0 8px 0;">Reply with any questions about rigging, install, or financing.</li>
      <li style="margin:0 0 8px 0;">When you are ready, we can lock in the price and schedule pickup at our Gores Landing shop.</li>
    </ul>
    <p style="margin:22px 0 0 0;">This quote is valid for 30 days.</p>
    <p style="margin:16px 0 0 0;">Reply to this email or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
  `;
  return buildEmail({
    preheader: `Your Mercury ${data.motorModel} quote, ref ${data.quoteNumber}`,
    heading: `Your Mercury ${esc(data.motorModel)} quote`,
    bodyHtml: body,
    ctaText: data.pdfUrl ? "Open quote PDF" : undefined,
    ctaUrl: data.pdfUrl,
    footerNote: "Pickup is in person at our Gores Landing shop. Please bring valid photo ID.",
  });
}

function generateFollowUpEmail(data: QuoteEmailRequest): string {
  const rows = [
    { label: "Quote #", value: esc(data.quoteNumber) },
    { label: "Motor", value: esc(data.motorModel) },
    { label: "Total", value: `$${data.totalPrice.toLocaleString()} CAD` },
  ];
  const body = `
    <p style="margin:0 0 14px 0;">Hi ${esc(data.customerName)},</p>
    <p style="margin:0 0 14px 0;">Following up on the quote we sent you. Wanted to make sure it landed and answer any questions.</p>
    ${detailsCard(rows)}
    <p style="margin:18px 0 14px 0;">Happy to walk through:</p>
    <ul style="margin:0;padding-left:20px;color:#1f2430;">
      <li style="margin:0 0 6px 0;">Financing and monthly payment options</li>
      <li style="margin:0 0 6px 0;">Install timing and rigging fit</li>
      <li style="margin:0 0 6px 0;">Current promotions and warranty</li>
    </ul>
    <p style="margin:22px 0 0 0;">No rush. Reply when it suits you, or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
  `;
  return buildEmail({
    preheader: `Following up on your Mercury ${data.motorModel} quote`,
    heading: "Following up on your quote",
    bodyHtml: body,
    ctaText: data.pdfUrl ? "Open quote PDF" : undefined,
    ctaUrl: data.pdfUrl,
  });
}

function generateAdminNotificationEmail(data: QuoteEmailRequest): string {
  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
      <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Customer</td><td style="padding:6px 0;color:#1f2430;font-weight:600;">${esc(data.leadData?.customerName || "Not provided")}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;"><a href="mailto:${esc(data.leadData?.customerEmail || "")}" style="color:#0f2a43;">${esc(data.leadData?.customerEmail || "Not provided")}</a></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Phone</td><td style="padding:6px 0;"><a href="tel:${esc(data.leadData?.customerPhone || "")}" style="color:#0f2a43;">${esc(data.leadData?.customerPhone || "Not provided")}</a></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Contact pref</td><td style="padding:6px 0;color:#1f2430;">${esc(data.leadData?.contactMethod || "email")}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Lead score</td><td style="padding:6px 0;color:#1f2430;">${data.leadData?.leadScore ?? 0}/100</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Quote #</td><td style="padding:6px 0;color:#1f2430;font-weight:600;">${esc(data.quoteNumber)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Motor</td><td style="padding:6px 0;color:#1f2430;font-weight:600;">${esc(data.motorModel)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Total</td><td style="padding:6px 0;color:#1f2430;font-weight:700;">$${data.totalPrice?.toLocaleString()} CAD</td></tr>
    </table>
    <p style="margin:12px 0 0 0;font-size:13px;">Open in admin: <a href="https://mercuryrepower.ca/admin/quotes/${esc(data.leadData?.quoteId || "")}" style="color:#0f2a43;">view quote</a>${data.pdfUrl ? ` &nbsp;|&nbsp; <a href="${esc(data.pdfUrl)}" style="color:#0f2a43;">PDF</a>` : ""}</p>
    <p style="margin:8px 0 0 0;font-size:12px;color:#6b7280;">Contact within 24 hours via preferred channel.</p>
  `;
  return buildAdminEmail({
    preheader: `${data.leadData?.customerName || "Lead"} - ${data.motorModel} - $${data.totalPrice?.toLocaleString()}`,
    heading: `${esc(data.leadData?.customerName || "Lead")} - ${esc(data.motorModel)} - $${data.totalPrice?.toLocaleString()}`,
    bodyHtml: body,
    tag: "Quote",
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Block requests from non-allowed origins (anti brand-abuse / phishing)
  if (!isAllowedOrigin(req)) {
    console.log('[send-quote-email] Forbidden origin:', req.headers.get('origin'), req.headers.get('referer'));
    return forbiddenOriginResponse(corsHeaders);
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawData = await req.json();
    
    // Validate input data
    const validationResult = quoteEmailSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.errors);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email data',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const emailData = validationResult.data;

    const ipAllowed = await checkRateLimit(req, {
      action: 'send_quote_email_ip',
      maxAttempts: 30,
      windowMinutes: 60,
    });
    if (!ipAllowed) return rateLimitedResponse(corsHeaders, 300);

    const recipientAllowed = await checkRateLimit(req, {
      identifier: emailData.customerEmail.toLowerCase(),
      action: 'send_quote_email_recipient',
      maxAttempts: 8,
      windowMinutes: 60,
    });
    if (!recipientAllowed) return rateLimitedResponse(corsHeaders, 300);
    
    console.log('Sending email:', emailData.emailType, 'to:', emailData.customerEmail);

    // Try to get template from database first
    let subject: string;
    let htmlContent: string;
    
    try {
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('subject, html_content')
        .eq('type', emailData.emailType)
        .eq('is_active', true)
        .single();

      if (template && !templateError) {
        // Use database template
        subject = replaceTemplateVariables(template.subject, emailData);
        htmlContent = replaceTemplateVariables(template.html_content, emailData);
        console.log('Using database template for:', emailData.emailType);
      } else {
        throw new Error('Template not found, using fallback');
      }
    } catch (templateError) {
      console.log('No database template found, using fallback for:', emailData.emailType);
      
      // Fallback to hardcoded templates
      switch (emailData.emailType) {
        case 'quote_delivery':
          subject = `Your Mercury ${emailData.motorModel} quote, ref ${emailData.quoteNumber} | Harris Boat Works`;
          htmlContent = generateQuoteDeliveryEmail(emailData);
          break;
        case 'follow_up':
        case 'reminder':
          subject = `Following up on your Mercury ${emailData.motorModel} quote, ref ${emailData.quoteNumber}`;
          htmlContent = generateFollowUpEmail(emailData);
          break;
        case 'admin_quote_notification':
          subject = `[QUOTE] ${emailData.leadData?.customerName || "Lead"} - ${emailData.motorModel} - $${emailData.totalPrice?.toLocaleString()}`;
          htmlContent = generateAdminNotificationEmail(emailData);
          break;
        default:
          subject = `Your Mercury Motor Quote #${emailData.quoteNumber} from Harris Boat Works`;
          htmlContent = generateQuoteDeliveryEmail(emailData);
      }
    }

    // Prepare email options
    const emailOptions: {
      from: string;
      to: string[];
      replyTo: string;
      subject: string;
      html: string;
      attachments?: Array<{ filename: string; content: string }>;
    } = {
      from: 'Harris Boat Works - Mercury Marine <noreply@mercuryrepower.ca>',
      to: [emailData.customerEmail],
      replyTo: 'info@harrisboatworks.ca',
      subject: subject,
      html: htmlContent,
    };

    // Attach the quote PDF only when it is a genuine, generated PDF artifact.
    // Anything else (notably an HTML page mislabelled .pdf) is refused and the
    // email goes out without an attachment rather than with a broken one.
    let attachmentStatus = 'none';
    if (emailData.pdfUrl) {
      try {
        const pdf = await fetchQuotePdfAttachment(emailData.pdfUrl);
        emailOptions.attachments = [{
          filename: `Quote-${emailData.quoteNumber}.pdf`,
          content: encodeBase64(pdf.bytes),
        }];
        attachmentStatus = `attached:${pdf.byteLength}`;
        console.log('PDF attachment validated, size:', pdf.byteLength, 'bytes');
      } catch (pdfError) {
        attachmentStatus = pdfError instanceof QuotePdfRejected
          ? `rejected:${pdfError.reason}`
          : 'rejected:fetch-error';
        console.error('PDF attachment refused:', attachmentStatus);
        // Deliberate: deliver the quote email without the attachment.
      }
    }

    // Claim the send before dispatching so a retry cannot duplicate a customer
    // email. Callers may pass a stable idempotencyKey; otherwise one is derived.
    const recipientHash = await sha256Hex(normalizeRecipient(emailData.customerEmail));
    const idempotencyKey = await deriveIdempotencyKey({
      suppliedKey: emailData.idempotencyKey,
      emailType: emailData.emailType,
      quoteNumber: emailData.quoteNumber,
      quoteId: emailData.leadData?.quoteId,
      recipient: emailData.customerEmail,
    });

    const claim = await claimQuoteEmailDelivery(supabase, {
      idempotencyKey,
      emailType: emailData.emailType,
      quoteNumber: emailData.quoteNumber,
      quoteId: emailData.leadData?.quoteId,
      recipientHash,
      initiator: emailData.emailType === 'admin_quote_notification' ? 'admin' : 'customer',
    });

    if (claim.status === 'duplicate') {
      console.log('Duplicate suppressed for delivery', claim.deliveryId);
      return new Response(
        JSON.stringify({
          success: true,
          duplicate: true,
          messageId: claim.messageId,
          emailType: emailData.emailType,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (claim.status === 'in_flight') {
      return new Response(
        JSON.stringify({ success: false, error: 'A send for this quote is already in progress' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send, then verify. Resend resolves with {data,error} rather than throwing,
    // so an unchecked result previously reported success on a rejected send.
    let verified;
    try {
      const emailResponse = await resend.emails.send(emailOptions);
      verified = verifyResendResult(emailResponse);
    } catch (sendError) {
      const detail = sendError instanceof EmailSendFailed
        ? sendError.detail
        : sendError instanceof Error ? sendError.message : 'unknown send error';
      console.error('Quote email send failed:', detail);
      await completeQuoteEmailDelivery(supabase, {
        deliveryId: claim.deliveryId,
        status: 'failed',
        errorDetail: detail,
        attachmentStatus,
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Email delivery failed', detail }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email accepted by provider, id:', verified.messageId);

    // Durable audit for BOTH customer- and admin-initiated sends. Written only
    // after a verified send, into an append-only table that anonymous callers
    // cannot address or mutate.
    await completeQuoteEmailDelivery(supabase, {
      deliveryId: claim.deliveryId,
      status: 'sent',
      messageId: verified.messageId,
      attachmentStatus,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: verified.messageId,
        attachmentStatus,
        emailType: emailData.emailType 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-quote-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
