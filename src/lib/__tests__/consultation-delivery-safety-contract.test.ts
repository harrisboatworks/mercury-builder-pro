import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  CONSULTATION_UPLOAD_UNAVAILABLE_ERROR,
  CONSULTATION_UPLOAD_UNAVAILABLE_STATUS,
  consultationMultipartUploadRejection,
} from '../../../supabase/functions/_shared/consultation-document-policy.ts';

const read = (path: string) => readFileSync(path, 'utf8');

describe('consultation delivery safety phase 1', () => {
  it('keeps no consultation upload call reachable from ScheduleConsultation', () => {
    const consultation = read('src/components/quote-builder/ScheduleConsultation.tsx');
    const client = read('src/lib/consultation-document-client.ts');

    expect(consultation).not.toContain('consultation-document-client');
    expect(consultation).not.toContain('uploadConsultationDocument');
    expect(consultation).not.toContain('consultation-document-api');
    expect(consultation).not.toContain("form.append('pdf'");
    expect(consultation).not.toContain('generatePDFBlob');
    expect(consultation).not.toContain("flow: 'submit'");
    expect(consultation).not.toContain("flow: 'send_email'");
    expect(consultation).not.toContain("flow: 'send_sms'");
    expect(consultation).not.toContain('handleSendByEmail');
    expect(consultation).not.toContain('handleSendByText');
    expect(consultation).not.toContain('isSendingEmail');
    expect(consultation).not.toContain('isSendingText');
    expect(consultation).not.toContain('Email Me a Copy');
    expect(consultation).not.toContain('Text Me a Copy');
    expect(consultation).toContain('onClick={generatePDF}');
    expect(consultation).toContain('downloadPDF');
    expect(client).not.toContain('uploadConsultationDocument');
    expect(client).not.toContain('FormData');
  });

  it('removes automated customer SMS while keeping the contact-method selector and admin alerts', () => {
    const consultation = read('src/components/quote-builder/ScheduleConsultation.tsx');

    expect(consultation).toContain('Preferred Contact Method');
    expect(consultation).toContain('<SelectItem value="email">Email</SelectItem>');
    expect(consultation).toContain('<SelectItem value="phone">Phone Call</SelectItem>');
    expect(consultation).toContain('<SelectItem value="text">Text Message</SelectItem>');
    expect(consultation).toContain('not an automated SMS');
    expect(consultation).not.toContain("contactMethod === 'text'");
    expect(consultation).not.toContain("messageType: 'quote_confirmation'");
    expect(consultation).not.toContain('Thank you for requesting a Mercury motor quote');
    expect(consultation.match(/invoke\('send-sms'/g)?.length ?? 0).toBe(1);
    expect(consultation).toContain("to: '+19053766208'");
    expect(consultation).toContain("messageType: 'hot_lead'");
    expect(consultation).toContain("emailType: 'admin_quote_notification'");
    expect(consultation).toContain("customerEmail: 'info@harrisboatworks.ca'");
    expect(consultation).toContain('submit-quote-lead');
    expect(consultation).toContain('triggerHotLeadWebhooks');
    expect(consultation).toContain('triggerHotLeadSMS');
  });

  it('rejects multipart consultation uploads before persistence or provider calls', () => {
    const api = read('supabase/functions/consultation-document-api/index.ts');
    const rejection = consultationMultipartUploadRejection('multipart/form-data; boundary=----Consultation');

    expect(rejection).toEqual({
      status: CONSULTATION_UPLOAD_UNAVAILABLE_STATUS,
      body: { error: CONSULTATION_UPLOAD_UNAVAILABLE_ERROR },
    });
    expect(rejection?.status).toBe(403);

    const rejectAt = api.indexOf('consultationMultipartUploadRejection(req.headers.get("content-type"))');
    const envAt = api.indexOf('Deno.env.get("SUPABASE_URL")');
    const clientAt = api.indexOf('createClient(supabaseUrl, serviceRoleKey');
    const redeemAt = api.indexOf('const { token } = parseConsultationRedeemRequest(body);');
    expect(rejectAt).toBeGreaterThan(-1);
    expect(envAt).toBeGreaterThan(rejectAt);
    expect(clientAt).toBeGreaterThan(envAt);
    expect(redeemAt).toBeGreaterThan(clientAt);

    expect(api).toContain('if (uploadClosed)');
    expect(api).toContain('return jsonResponse(req, uploadClosed.body, uploadClosed.status)');
    expect(api).not.toContain('parseConsultationMultipart');
    expect(api).not.toContain('persistConsultationDocument');
    expect(api).not.toContain('deliverConsultationDocument');
    expect(api).not.toContain('createConsultationAccessToken');
    expect(api).not.toContain('.from("consultation_documents").insert');
    expect(api).not.toContain('.upload(storageKey, pdfBytes');
    expect(api).not.toContain('send-sms');
    expect(api).not.toContain('send-quote-email');
    expect(api).not.toContain('{ success: true, documentId }');
  });

  it('keeps JSON token redemption available for previously issued documents', () => {
    const api = read('supabase/functions/consultation-document-api/index.ts');
    const client = read('src/lib/consultation-document-client.ts');
    const page = read('src/pages/quote/QuoteConsultationDocumentPage.tsx');

    expect(api).toContain('parseConsultationRedeemRequest');
    expect(api).toContain('authorizeConsultationRedemption');
    expect(api).toContain('createSignedUrl');
    expect(api).toContain('consultation_document_redeem_ip');
    expect(api).toContain('consultation_document_redeem_token');
    expect(api).toContain('failClosed: true');
    expect(client).toContain("action: 'redeem'");
    expect(client).toContain("'consultation-document-api'");
    expect(page).toContain('redeemConsultationDocument(token)');
    expect(page).toContain('window.location.replace(signedUrl)');
  });
});
