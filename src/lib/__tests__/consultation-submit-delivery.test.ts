import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CONSULTATION_ATTACHMENT_STATEMENT } from '../../../supabase/functions/_shared/consultation-quote-email.ts';
import {
  CONSULTATION_REQUEST_RECEIVED_STATEMENT,
  ConsultationDeliveryError,
  assertNoCallerDocumentDelivery,
  assertResendAccepted,
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
    const snapshotAt = submit.indexOf('parseConsultationCallerQuoteSnapshot');
    const insertAt = submit.indexOf('.from("customer_quotes")');
    const mintAt = submit.indexOf('await mintConsultationDocument');
    const sendAt = submit.indexOf('resend.emails.send');
    expect(turnstileAt).toBeGreaterThan(-1);
    expect(snapshotAt).toBeGreaterThan(turnstileAt);
    expect(insertAt).toBeGreaterThan(snapshotAt);
    expect(mintAt).toBeGreaterThan(insertAt);
    expect(sendAt).toBeGreaterThan(mintAt);
    expect(submit).toContain('consultationSubmitCustomerDestinations(String(data.customer_email))');
    expect(submit).toContain('consultationSubmitDeliverySnapshot');
    expect(submit).toContain('consultationSnapshotFromAuthoritativeQuote');
    expect(submit).toContain('.from("saved_quotes")');
    expect(submit).toContain('buildConsultationQuoteMintedEmail');
    expect(submit).toContain('markConsultationDocumentJobEmailed');
    expect(submit).toContain('assertResendAccepted');
    expect(submit).toContain('markConsultationDocumentJobDeliveryFailed');
    expect(submit.indexOf('assertResendAccepted(mintedSend)')).toBeGreaterThan(submit.indexOf('resend.emails.send'));
    expect(submit.indexOf('await markConsultationDocumentJobEmailed')).toBeGreaterThan(submit.indexOf('assertResendAccepted(mintedSend)'));
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
    expect(schedule).toContain('quote_snapshot: pdfSnapshot');
    expect(schedule).toContain('if (!pdfSnapshot)');
    expect(submit).toContain('let hasAuthoritativeQuoteSnapshot = false');
    expect(submit).toContain('.select("quote_data")');
    const completeSnapshotGate = submit.indexOf('if (canMintConsultationDocumentFromPersistedQuote(');
    expect(completeSnapshotGate).toBeGreaterThan(-1);
    expect(submit.indexOf('minted = await mintConsultationDocument')).toBeGreaterThan(completeSnapshotGate);
    expect(submit).toContain('never mint a\n    // partial PDF');
  });

  it('treats a Resend { error } or missing id as delivery failure before any emailed mark', () => {
    expect(assertResendAccepted({ data: { id: 're_123' }, error: null })).toEqual({ id: 're_123' });
    expect(() => assertResendAccepted({
      data: { id: 're_ignored' },
      error: { name: 'validation_error', message: 'invalid to' },
    })).toThrow(ConsultationDeliveryError);
    expect(() => assertResendAccepted({ data: { id: null }, error: null })).toThrow(ConsultationDeliveryError);
    expect(() => assertResendAccepted({ data: null, error: null })).toThrow(ConsultationDeliveryError);
    expect(() => assertResendAccepted(undefined)).toThrow(ConsultationDeliveryError);
  });
});
