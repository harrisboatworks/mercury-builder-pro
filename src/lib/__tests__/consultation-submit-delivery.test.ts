import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CONSULTATION_ATTACHMENT_STATEMENT } from '../../../supabase/functions/_shared/consultation-quote-email.ts';
import {
  CONSULTATION_REQUEST_RECEIVED_STATEMENT,
  assertNoCallerDocumentDelivery,
  buildConsultationQuoteMintedEmail,
  buildConsultationRequestReceivedEmail,
  consultationSubmitCustomerDestinations,
} from '../../../supabase/functions/_shared/consultation-submit-delivery.ts';

const read = (path: string) => readFileSync(path, 'utf8');

describe('submit-bound consultation customer email', () => {
  it('rejects caller document fields and emails only the server-owned recipient', () => {
    expect(() => assertNoCallerDocumentDelivery({ documentId: '11111111-1111-4111-8111-111111111111' }))
      .toThrow('Caller-controlled documents are not allowed');
    expect(() => assertNoCallerDocumentDelivery({ pdfUrl: 'https://example.com/quote.pdf' }))
      .toThrow('Caller-controlled documents are not allowed');
    expect(() => assertNoCallerDocumentDelivery({ customer_email: 'owner@example.com' })).not.toThrow();
    expect(consultationSubmitCustomerDestinations('owner@example.com')).toEqual({
      to: ['owner@example.com'],
    });
  });

  it('emails a minted private quote with a durable fragment link and no public storage URL', () => {
    const documentAccessUrl = `https://www.mercuryrepower.ca/quote/document#cd_${'ab'.repeat(32)}`;
    const html = buildConsultationQuoteMintedEmail({
      customerName: 'Jay <script>',
      quoteNumber: 'HBW-123456',
      motorModel: '115 ELPT',
      totalPrice: 14999,
      documentAccessUrl,
    });
    expect(html).toContain(CONSULTATION_ATTACHMENT_STATEMENT);
    expect(html).toContain(documentAccessUrl);
    expect(html).toContain('HBW-123456');
    expect(html).toContain('$14,999 CAD');
    expect(html).toContain('Jay &lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('spec-sheets');
    expect(html).not.toContain('getPublicUrl');
    expect(html).not.toContain('/storage/v1/object/sign');
    expect(html).not.toContain('/storage/v1/object/public/');
    expect(() => buildConsultationQuoteMintedEmail({
      customerName: 'Jay',
      quoteNumber: 'HBW-123456',
      motorModel: '115 ELPT',
      totalPrice: 14999,
      documentAccessUrl: 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/spec-sheets/quote.pdf',
    })).toThrow();
  });

  it('confirms receipt without an attachment, bearer link, or public storage URL', () => {
    const html = buildConsultationRequestReceivedEmail({
      customerName: 'Jay <script>',
      quoteNumber: 'HBW-123456',
      motorModel: '115 ELPT',
      totalPrice: 14999,
    });
    expect(html).toContain(CONSULTATION_REQUEST_RECEIVED_STATEMENT);
    expect(html).toContain('HBW-123456');
    expect(html).toContain('$14,999 CAD');
    expect(html).toContain('Jay &lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('attachments');
    expect(html).not.toContain('/quote/document#cd_');
    expect(html).not.toContain('spec-sheets');
    expect(html).not.toContain('getPublicUrl');
    expect(html).not.toContain('A PDF copy of your full quote is attached');
  });

  it('verifies Turnstile before insert and emails the persisted customer_email', () => {
    const submit = read('supabase/functions/submit-quote-lead/index.ts');
    const schedule = read('src/components/quote-builder/ScheduleConsultation.tsx');

    const turnstileAt = submit.indexOf('verifyTurnstileToken');
    const insertAt = submit.indexOf('.from("customer_quotes")');
    const mintAt = submit.indexOf('await mintConsultationDocument');
    const sendAt = submit.indexOf('resend.emails.send');
    expect(turnstileAt).toBeGreaterThan(-1);
    expect(insertAt).toBeGreaterThan(turnstileAt);
    expect(mintAt).toBeGreaterThan(insertAt);
    expect(sendAt).toBeGreaterThan(mintAt);
    expect(submit).toContain('consultationSubmitCustomerDestinations(String(data.customer_email))');
    expect(submit).toContain('consultationSubmitDeliverySnapshot');
    expect(submit).toContain('consultationSnapshotFromAuthoritativeQuote');
    expect(submit).toContain('.from("saved_quotes")');
    expect(submit).toContain('buildConsultationQuoteMintedEmail');
    expect(submit).toContain('markConsultationDocumentJobEmailed');
    expect(submit).toContain('failClosed: true');
    expect(submit).not.toContain('user_id: p.user_id');
    expect(submit).toContain('supabase.auth.getUser');
    expect(submit).toContain('success: true,\n        quoteId: data.id,\n        anonymousSessionId: sessionId,\n        quoteNumber,');
    expect(submit).not.toContain('documentId:');
    expect(submit).not.toContain("invoke('consultation-document-api'");

    expect(schedule).toContain("invoke('submit-quote-lead'");
    expect(schedule).toContain('turnstileToken');
    expect(schedule).not.toContain("invoke('send-quote-email'");
    expect(schedule).not.toContain("invoke('send-sms'");
  });
});
