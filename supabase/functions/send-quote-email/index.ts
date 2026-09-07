import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import { isAllowedOrigin, forbiddenOriginResponse } from "../_shared/origin-check.ts";
import { GROK_BOT_AGENTMAIL } from "../_shared/grok-email-routing.ts";
import {
  CONSULTATION_DOCUMENTS_BUCKET,
  ConsultationDocumentRequestError,
  ConsultationDocumentUnavailableError,
  assertConsultationStoredDocument,
  canonicalConsultationDocumentPath,
  constantTimeEqual,
  sha256Hex as sha256Bytes,
  validateQuotePdf,
} from "../_shared/consultation-document-policy.ts";
import {
  CONSULTATION_ATTACHMENT_STATEMENT,
  CONSULTATION_CTA_LABEL,
  assertConsultationAccessUrl,
  assertConsultationDocumentId,
  assertResolvedConsultationTemplate,
  buildQuoteEmailDestinations,
  rejectConsultationCallerPdfUrl,
  replaceConsultationTemplateVariables,
} from "../_shared/consultation-quote-email.ts";
import {
  encodeBase64,
  fetchQuotePdfAttachment,
  QuotePdfRejected,
  resolveQuotePdfUrl,
} from "../_shared/quote-pdf-attachment.ts";
import {
  claimQuoteEmailDelivery,
  completeQuoteEmailDelivery,
  deriveIdempotencyKey,
  EmailSendFailed,
  normalizeRecipient,
  sha256Hex,
  verifyResendResult,
} from "../_shared/quote-email-delivery.ts";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const HBW_ADMIN_QUOTE_INBOX = 'info@harrisboatworks.ca';
const GROK_BOT_QUOTE_SENDER = 'Grok Bot - Mercury Repower <grokbot@mercuryrepower.ca>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

function isAuthorizedInternalRequest(req: Request): boolean {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const internalSecret = Deno.env.get('EDGE_INTERNAL_SECRET') || Deno.env.get('CRON_SECRET');
  const authorization = req.headers.get('authorization') || '';
  const suppliedSecret = req.headers.get('x-internal-secret') || '';
  if (internalSecret && suppliedSecret && suppliedSecret === internalSecret) return true;
  return Boolean(serviceRoleKey && authorization === `Bearer ${serviceRoleKey}`);
}

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
  documentId: z.string().uuid().optional(),
  documentAccessUrl: z.string().url().max(2000).optional(),
  emailType: z.enum(['quote_delivery', 'follow_up', 'reminder', 'admin_quote_notification']),
  leadData: leadDataSchema,
  idempotencyKey: z.string().trim().min(8).max(200).optional(),
});

type QuoteEmailRequest = z.infer<typeof quoteEmailSchema>;

import { buildEmail, buildAdminEmail, detailsCard, esc } from "../_shared/email-layout.ts";

/**
 * Substitute into an active database-managed template.
 *
 * These values are request-controlled on a public (verify_jwt = false)
 * function and were previously injected raw into template HTML, so a crafted
 * customerName/quoteNumber/motorModel could inject markup into a real customer
 * email. buildEmail escapes its own preheader/heading, but the DB template body
 * never passed through it. Every substitution is escaped here.
 */
function replaceTemplateVariables(template: string, data: QuoteEmailRequest): string {
  const values: Record<string, string> = {
    customerName: data.customerName,
    quoteNumber: data.quoteNumber,
    motorModel: data.motorModel,
    totalPrice: data.totalPrice.toLocaleString(),
  };
  return template.replace(
    /{{(customerName|quoteNumber|motorModel|totalPrice)}}/g,
    (_match, key: string) => esc(values[key] ?? ""),
  );
}

/** Strip CRLF so a DB-managed subject cannot inject mail headers. */
function sanitizeEmailSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, " ").trim();
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateConsultationQuoteDeliveryEmail(
  data: QuoteEmailRequest,
  documentAccessUrl: string,
): string {
  const rows = [
    { label: "Quote #", value: esc(data.quoteNumber) },
    { label: "Motor", value: esc(data.motorModel) },
    { label: "Total", value: `$${data.totalPrice.toLocaleString()} CAD` },
  ];
  const body = `
    <p style="margin:0 0 14px 0;">Hi ${esc(data.customerName)},</p>
    <p style="margin:0 0 14px 0;">Thanks for your interest. Here is the quote we prepared for you.</p>
    ${detailsCard(rows)}
    <p style="margin:18px 0 0 0;color:#6b7280;font-size:14px;">${CONSULTATION_ATTACHMENT_STATEMENT}</p>
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
    ctaText: CONSULTATION_CTA_LABEL,
    ctaUrl: documentAccessUrl,
    footerNote: "Pickup is in person at our Gores Landing shop. Please bring valid photo ID.",
  });
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

  const internalRequest = isAuthorizedInternalRequest(req);

  // Block browser requests from non-allowed origins. Server-owned consultation
  // delivery uses the internal secret / service-role bearer instead.
  if (!internalRequest && !isAllowedOrigin(req)) {
    console.log('[send-quote-email] Forbidden origin');
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
      return jsonResponse(400, {
        success: false,
        error: 'Invalid email data',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }

    const emailData = validationResult.data;
    const isConsultationPath = Boolean(emailData.documentId);

    if (isConsultationPath) {
      if (!internalRequest) {
        return jsonResponse(403, { success: false, error: 'Forbidden' });
      }
      try {
        rejectConsultationCallerPdfUrl(emailData.pdfUrl);
        assertConsultationDocumentId(emailData.documentId);
        assertConsultationAccessUrl(emailData.documentAccessUrl);
      } catch (consultationError) {
        return jsonResponse(400, {
          success: false,
          error: consultationError instanceof Error ? consultationError.message : 'Invalid consultation email',
        });
      }
    }

    const ipAllowed = await checkRateLimit(req, {
      action: 'send_quote_email_ip',
      maxAttempts: 30,
      windowMinutes: 60,
      failClosed: isConsultationPath,
    });
    if (!ipAllowed) return rateLimitedResponse(corsHeaders, 300);

    const recipientAllowed = await checkRateLimit(req, {
      identifier: emailData.customerEmail.toLowerCase(),
      action: 'send_quote_email_recipient',
      maxAttempts: 8,
      windowMinutes: 60,
      failClosed: isConsultationPath,
    });
    if (!recipientAllowed) return rateLimitedResponse(corsHeaders, 300);

    const isAdminNotification = emailData.emailType === 'admin_quote_notification';
    const destinations = buildQuoteEmailDestinations({
      isConsultationPath,
      isAdminNotification,
      customerEmail: emailData.customerEmail,
      adminRecipients: [GROK_BOT_AGENTMAIL, HBW_ADMIN_QUOTE_INBOX],
      auditBccRecipient: GROK_BOT_AGENTMAIL,
    });

    console.log('Sending email:', emailData.emailType);

    // Fetch the active DB template ONCE. Fetching is safe here; RENDERING waits
    // until a caller pdfUrl has been validated or stripped so a rejected URL
    // cannot appear in the composed HTML.
    let dbTemplate: { subject: string; html_content: string } | null = null;
    try {
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('subject, html_content')
        .eq('type', emailData.emailType)
        .eq('is_active', true)
        .single();
      if (template && !templateError) {
        dbTemplate = template;
      }
    } catch (_templateError) {
      console.log('No database template found, using fallback for:', emailData.emailType);
    }

    let attachmentStatus = 'none';
    let callerPdfBytes: Uint8Array | null = null;
    let effectiveEmailData: QuoteEmailRequest = emailData;

    if (!isConsultationPath && emailData.pdfUrl) {
      const resolved = resolveQuotePdfUrl(emailData.pdfUrl);
      if (!resolved.url) {
        console.log('[send-quote-email] pdf url rejected', resolved.reason);
        return jsonResponse(400, {
          success: false,
          error: 'Invalid PDF URL',
          reason: resolved.reason,
        });
      }
      try {
        const attachment = await fetchQuotePdfAttachment(resolved.url.toString());
        callerPdfBytes = attachment.bytes;
        attachmentStatus = `attached:${attachment.byteLength}`;
      } catch (attachmentError) {
        attachmentStatus = attachmentError instanceof QuotePdfRejected
          ? `rejected:${attachmentError.reason}`
          : 'rejected:fetch-error';
        console.log('[send-quote-email] pdf attachment refused', attachmentStatus);
        callerPdfBytes = null;
        effectiveEmailData = { ...emailData, pdfUrl: undefined };
      }
    }

    let subject: string;
    let htmlContent: string;

    try {
      if (dbTemplate) {
        if (isConsultationPath) {
          const documentAccessUrl = assertConsultationAccessUrl(effectiveEmailData.documentAccessUrl);
          subject = sanitizeEmailSubject(replaceConsultationTemplateVariables(dbTemplate.subject, {
            customerName: effectiveEmailData.customerName,
            quoteNumber: effectiveEmailData.quoteNumber,
            motorModel: effectiveEmailData.motorModel,
            totalPrice: effectiveEmailData.totalPrice,
            documentAccessUrl,
          }, { html: false }));
          htmlContent = replaceConsultationTemplateVariables(dbTemplate.html_content, {
            customerName: effectiveEmailData.customerName,
            quoteNumber: effectiveEmailData.quoteNumber,
            motorModel: effectiveEmailData.motorModel,
            totalPrice: effectiveEmailData.totalPrice,
            documentAccessUrl,
          });
          assertResolvedConsultationTemplate(htmlContent, documentAccessUrl);
        } else if (dbTemplate.html_content.includes('{{documentAccessUrl}}')) {
          throw new Error('Template not found, using fallback');
        } else {
          subject = sanitizeEmailSubject(replaceTemplateVariables(dbTemplate.subject, effectiveEmailData));
          htmlContent = replaceTemplateVariables(dbTemplate.html_content, effectiveEmailData);
        }
      } else {
        throw new Error('Template not found, using fallback');
      }
    } catch (templateError) {
      if (isConsultationPath) {
        if (templateError instanceof ConsultationDocumentRequestError) {
          return jsonResponse(400, { success: false, error: templateError.message });
        }
        const documentAccessUrl = assertConsultationAccessUrl(effectiveEmailData.documentAccessUrl);
        subject = sanitizeEmailSubject(`Your Mercury ${effectiveEmailData.motorModel} quote, ref ${effectiveEmailData.quoteNumber} | Harris Boat Works`);
        htmlContent = generateConsultationQuoteDeliveryEmail(effectiveEmailData, documentAccessUrl);
        assertResolvedConsultationTemplate(htmlContent, documentAccessUrl);
      } else {
        console.log('No database template found, using fallback for:', effectiveEmailData.emailType);
        switch (effectiveEmailData.emailType) {
          case 'quote_delivery':
            subject = sanitizeEmailSubject(`Your Mercury ${effectiveEmailData.motorModel} quote, ref ${effectiveEmailData.quoteNumber} | Harris Boat Works`);
            htmlContent = generateQuoteDeliveryEmail(effectiveEmailData);
            break;
          case 'follow_up':
          case 'reminder':
            subject = sanitizeEmailSubject(`Following up on your Mercury ${effectiveEmailData.motorModel} quote, ref ${effectiveEmailData.quoteNumber}`);
            htmlContent = generateFollowUpEmail(effectiveEmailData);
            break;
          case 'admin_quote_notification':
            subject = sanitizeEmailSubject(`[QUOTE] ${effectiveEmailData.leadData?.customerName || "Lead"} - ${effectiveEmailData.motorModel} - $${effectiveEmailData.totalPrice?.toLocaleString()}`);
            htmlContent = generateAdminNotificationEmail(effectiveEmailData);
            break;
          default:
            subject = sanitizeEmailSubject(`Your Mercury Motor Quote #${effectiveEmailData.quoteNumber} from Harris Boat Works`);
            htmlContent = generateQuoteDeliveryEmail(effectiveEmailData);
        }
      }
    }

    // Keep customer delivery branded as HBW. Internal quote alerts go to the
    // dedicated Grok Bot inbox, where AgentMail wakes the bot for triage.
    const emailOptions: {
      from: string;
      to: string[];
      replyTo: string;
      bcc?: string[];
      subject: string;
      html: string;
      attachments?: Array<{ filename: string; content: string }>;
      headers?: Record<string, string>;
    } = {
      from: isAdminNotification
        ? GROK_BOT_QUOTE_SENDER
        : 'Harris Boat Works - Mercury Marine <noreply@mercuryrepower.ca>',
      to: destinations.to,
      replyTo: 'info@harrisboatworks.ca',
      subject: subject,
      html: htmlContent,
    };
    if (destinations.bcc) {
      emailOptions.bcc = destinations.bcc;
    }

    if (isConsultationPath) {
      const documentId = assertConsultationDocumentId(effectiveEmailData.documentId);
      const { data: documentRow, error: documentError } = await supabase
        .from("consultation_documents")
        .select("id, storage_key, sha256, byte_size, content_type, quote_number")
        .eq("id", documentId)
        .maybeSingle();
      if (documentError || !documentRow) {
        return jsonResponse(404, { success: false, error: "Consultation document unavailable" });
      }
      let binding: { path: string; sha256: string };
      try {
        binding = assertConsultationStoredDocument({
          documentId,
          storageKey: documentRow.storage_key,
          sha256: documentRow.sha256,
          byteSize: documentRow.byte_size,
          contentType: documentRow.content_type,
        });
      } catch {
        return jsonResponse(404, { success: false, error: "Consultation document unavailable" });
      }
      const { data: object, error: downloadError } = await supabase.storage
        .from(CONSULTATION_DOCUMENTS_BUCKET)
        .download(binding.path);
      if (downloadError || !object) {
        return jsonResponse(404, { success: false, error: "Consultation document unavailable" });
      }
      const pdfBytes = new Uint8Array(await object.arrayBuffer());
      try {
        validateQuotePdf(pdfBytes, object.type || documentRow.content_type || "application/pdf");
        const digest = await sha256Bytes(pdfBytes);
        if (
          pdfBytes.byteLength !== documentRow.byte_size
          || !constantTimeEqual(digest, binding.sha256)
          || binding.path !== canonicalConsultationDocumentPath(documentId)
        ) {
          throw new ConsultationDocumentUnavailableError();
        }
      } catch {
        return jsonResponse(404, { success: false, error: "Consultation document unavailable" });
      }
      attachmentStatus = `attached:${pdfBytes.byteLength}`;
      emailOptions.attachments = [{
        filename: `Quote-${effectiveEmailData.quoteNumber}.pdf`,
        content: encodeBase64(pdfBytes),
      }];
    } else if (callerPdfBytes) {
      emailOptions.attachments = [{
        filename: `Quote-${effectiveEmailData.quoteNumber}.pdf`,
        content: encodeBase64(callerPdfBytes),
      }];
    }

    const idempotencyKey = await deriveIdempotencyKey({
      suppliedKey: effectiveEmailData.idempotencyKey,
      emailType: effectiveEmailData.emailType,
      quoteNumber: effectiveEmailData.quoteNumber,
      quoteId: effectiveEmailData.leadData?.quoteId,
      recipient: effectiveEmailData.customerEmail,
    });
    const recipientHash = await sha256Hex(normalizeRecipient(effectiveEmailData.customerEmail));
    emailOptions.headers = { 'Idempotency-Key': idempotencyKey };

    let claim;
    try {
      claim = await claimQuoteEmailDelivery(supabase, {
        idempotencyKey,
        emailType: effectiveEmailData.emailType,
        quoteNumber: effectiveEmailData.quoteNumber,
        quoteId: effectiveEmailData.leadData?.quoteId,
        recipientHash,
        initiator: isAdminNotification ? 'admin' : 'customer',
      });
    } catch (claimError) {
      const detail = claimError instanceof Error ? claimError.message : 'claim failed';
      console.log('[send-quote-email] delivery claim failed', detail);
      return jsonResponse(503, { success: false, error: 'Delivery guard unavailable', detail });
    }

    if (claim.status === 'duplicate') {
      console.log('[send-quote-email] duplicate suppressed', claim.deliveryId);
      return jsonResponse(200, {
        success: true,
        duplicate: true,
        messageId: claim.messageId,
        emailType: effectiveEmailData.emailType,
        attachmentStatus,
      });
    }

    if (claim.status === 'in_flight') {
      return jsonResponse(409, { success: false, error: 'A send for this quote is already in progress' });
    }

    if (claim.status === 'mismatch') {
      console.log('[send-quote-email] idempotency key mismatch', claim.deliveryId);
      return jsonResponse(409, { success: false, error: 'Idempotency key does not match this message' });
    }

    let messageId: string;
    try {
      const emailResponse = await resend.emails.send(emailOptions);
      messageId = verifyResendResult(emailResponse).messageId;
    } catch (sendError) {
      const detail = sendError instanceof EmailSendFailed
        ? sendError.detail
        : sendError instanceof Error
        ? sendError.message
        : 'unknown send error';
      console.log('[send-quote-email] send failed', detail);
      await completeQuoteEmailDelivery(supabase, {
        deliveryId: claim.deliveryId,
        status: 'failed',
        errorDetail: detail,
        attachmentStatus,
      });
      return jsonResponse(502, { success: false, error: 'Email delivery failed', detail });
    }

    const audited = await completeQuoteEmailDelivery(supabase, {
      deliveryId: claim.deliveryId,
      status: 'sent',
      messageId,
      attachmentStatus,
    });

    return jsonResponse(200, {
      success: true,
      messageId,
      emailType: effectiveEmailData.emailType,
      attachmentStatus,
      ...(audited ? {} : { auditWarning: 'delivery-audit-write-failed' }),
    });

  } catch (error) {
    console.error('Error in send-quote-email function:', error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
  }
});
