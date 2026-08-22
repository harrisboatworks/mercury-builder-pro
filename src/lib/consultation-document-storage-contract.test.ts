import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('private consultation document storage contract', () => {
  it('keeps all three consultation flows on the canonical server key', () => {
    const consultation = read('src/components/quote-builder/ScheduleConsultation.tsx');
    const client = read('src/lib/consultation-document-client.ts');
    const api = read('supabase/functions/consultation-document-api/index.ts');
    const policy = read('supabase/functions/_shared/consultation-document-policy.ts');

    expect(consultation).toContain("flow: 'submit'");
    expect(consultation).toContain("flow: 'send_email'");
    expect(consultation).toContain("flow: 'send_sms'");
    expect(consultation).toContain('uploadConsultationDocument');
    expect(consultation).toContain('customerQuoteId: quoteId');
    expect(client).toContain("form.append('meta'");
    expect(client).toContain("form.append('pdf'");
    expect(client).toContain("'consultation-document-api'");
    expect(client).toContain('data?.success !== true');
    expect(client).toContain("typeof data?.documentId !== 'string'");
    expect(client).toContain("action: 'redeem'");
    expect(api).toContain("canonicalConsultationDocumentPath(documentId)");
    expect(api).toContain("CONSULTATION_DOCUMENTS_BUCKET");
    expect(api).toContain("{ success: true, documentId }");
    expect(policy).toContain('consultation/${parseConsultationDocumentId(documentId)}/quote.pdf');
    expect(api).not.toMatch(/jsonResponse\(req,\s*\{[^}]*token/s);
    expect(api).not.toMatch(/jsonResponse\(req,\s*\{[^}]*storage_key/s);
    expect(api).not.toMatch(/jsonResponse\(req,\s*\{[^}]*documentAccessUrl/s);
  });

  it('keeps browser responses and consultation logs free of tokens, storage paths, and signed URLs', () => {
    const consultation = read('src/components/quote-builder/ScheduleConsultation.tsx');
    const client = read('src/lib/consultation-document-client.ts');
    const page = read('src/pages/quote/QuoteConsultationDocumentPage.tsx');
    const api = read('supabase/functions/consultation-document-api/index.ts');
    const sms = read('supabase/functions/send-sms/index.ts');

    expect(consultation).not.toContain('getPublicUrl');
    expect(consultation).not.toContain(".from('spec-sheets')");
    expect(consultation).not.toContain('documentAccessUrl');
    expect(consultation).not.toContain('signedUrl');
    expect(consultation).not.toContain('publicUrl');
    expect(client).not.toContain('console.log');
    expect(page).not.toContain('console.log');
    expect(page).toContain('captureConsultationFragmentToken');
    expect(page).toContain("redeemConsultationDocument(token)");
    expect(api).toContain("console.error(\"consultation-document-api failed\", error instanceof Error ? error.name : \"unknown\")");
    expect(api).not.toContain('console.log');
    expect(sms).toContain('assertTokenSafeSmsLog');
    expect(sms).toContain('message: logMessage');
    expect(sms).not.toContain("console.log('SMS request:', smsData)");
    expect(consultation.match(/invoke\('send-sms'/g)?.length ?? 0).toBe(2);

    const sendByText = consultation.slice(consultation.indexOf('const handleSendByText'));
    expect(sendByText).toContain("flow: 'send_sms'");
    expect(sendByText).not.toContain("invoke('send-sms'");
    expect(sendByText).not.toContain('publicUrl');
  });

  it('redeems fragment tokens by POST only and fail-closes rate-limit outages', () => {
    const page = read('src/pages/quote/QuoteConsultationDocumentPage.tsx');
    const access = read('src/lib/consultation-document-access.ts');
    const api = read('supabase/functions/consultation-document-api/index.ts');
    const rateLimit = read('supabase/functions/_shared/rate-limit.ts');
    const app = read('src/App.tsx');

    expect(app).toContain('path="/quote/document"');
    expect(access).toContain('replaceState');
    expect(access).toContain('location.hash');
    expect(page).toContain('window.location.replace(signedUrl)');
    expect(api).toContain('parseConsultationRedeemRequest');
    expect(api).toContain('failClosed: true');
    expect(api).toContain('consultation_document_redeem_ip');
    expect(api).toContain('consultation_document_redeem_token');
    expect(api).toContain('if (req.method !== "POST")');
    expect(rateLimit).toContain('failClosed?: boolean');
    expect(rateLimit).toContain('return failClosed ? false : true');
    expect(rateLimit).toContain('if (!client) return !failClosed');
  });

  it('keeps historical public spec-sheets links untouched', () => {
    const consultationMigration = read(
      'supabase/migrations/20260822234500_create_consultation_documents.sql',
    );
    const quotesMigration = read(
      'supabase/migrations/20260822184600_enforce_quote_document_authority.sql',
    );
    const originalBucket = read(
      'supabase/migrations/20250909154459_f0566196-40d4-4864-b520-fdfd51b14abe.sql',
    );

    expect(existsSync(
      'supabase/migrations/20260822184500_make_customer_quote_documents_private.sql',
    )).toBe(false);
    expect(originalBucket).toContain("VALUES ('spec-sheets', 'spec-sheets', true)");
    expect(consultationMigration).toContain("id, name, public, file_size_limit, allowed_mime_types");
    expect(consultationMigration).toContain("'consultation-documents'");
    expect(consultationMigration).toContain('public = false');
    expect(consultationMigration).not.toContain('spec-sheets');
    expect(consultationMigration).not.toMatch(/DELETE\s+FROM\s+storage\.objects/i);
    expect(quotesMigration).not.toContain('spec-sheets');
    expect(consultationMigration).toContain('{{documentAccessUrl}}');
    expect(consultationMigration).toContain('A PDF copy of your full quote is attached to this email.');
  });

  it('fails closed in the mailer when the private attachment is unavailable or the CTA is unresolved', () => {
    const mailer = read('supabase/functions/send-quote-email/index.ts');
    expect(mailer).toContain('assertConsultationDocumentId(emailData.documentId)');
    expect(mailer).toContain('rejectConsultationCallerPdfUrl(emailData.pdfUrl)');
    expect(mailer).toContain('assertResolvedConsultationTemplate');
    expect(mailer).toContain('CONSULTATION_DOCUMENTS_BUCKET');
    expect(mailer).toContain('canonicalConsultationDocumentPath(documentId)');
    expect(mailer).toContain('Consultation document unavailable');
    expect(mailer).not.toContain("console.log('Fetching PDF from:', emailData.pdfUrl)");
  });
});
