import { describe, expect, it } from 'vitest';
import {
  isAuthorizedAdminAttachment,
  matchesAdminAttachmentQuote,
  matchesConsultationAttachmentQuote,
} from '../../../supabase/functions/_shared/consultation-admin-attachment.ts';
import { buildQuoteEmailDestinations } from '../../../supabase/functions/_shared/consultation-quote-email.ts';

describe('internal submitted quote PDF binding', () => {
  const request = { internal: true, emailType: 'admin_quote_notification', quoteId: 'quote-a' };
  it('allows a server-owned attachment only on the internal staff notification', () => {
    expect(isAuthorizedAdminAttachment(request)).toBe(true);
    for (const change of [
      { internal: false }, { emailType: 'quote_delivery' }, { quoteId: undefined },
      { documentId: 'customer-delivery-document' }, { pdfUrl: 'https://example.com/injected.pdf' },
    ]) expect(isAuthorizedAdminAttachment({ ...request, ...change })).toBe(false);
  });
  it('refuses an otherwise valid PDF belonging to a different quote or reference', () => {
    const document = { customer_quote_id: 'quote-a', quote_number: 'HBW-123456' };
    expect(matchesAdminAttachmentQuote(document, 'quote-a', 'HBW-123456')).toBe(true);
    expect(matchesConsultationAttachmentQuote(document, 'quote-a', 'HBW-123456')).toBe(true);
    expect(matchesAdminAttachmentQuote(document, 'quote-b', 'HBW-123456')).toBe(false);
    expect(matchesAdminAttachmentQuote(document, 'quote-a', 'HBW-654321')).toBe(false);
    expect(matchesAdminAttachmentQuote({ ...document, customer_quote_id: null }, undefined, 'HBW-123456')).toBe(false);
    expect(matchesConsultationAttachmentQuote(document, undefined, 'HBW-123456')).toBe(false);
  });
  it('keeps staff notification destinations when a bound admin PDF is attached', () => {
    expect(isAuthorizedAdminAttachment({
      ...request,
      documentId: undefined,
      pdfUrl: undefined,
    })).toBe(true);
    expect(buildQuoteEmailDestinations({
      isConsultationPath: false,
      isAdminNotification: true,
      customerEmail: 'customer@example.com',
      adminRecipients: ['grokbot@mercuryrepower.ca', 'info@harrisboatworks.ca'],
      auditBccRecipient: 'grokbot@mercuryrepower.ca',
    })).toEqual({ to: ['grokbot@mercuryrepower.ca', 'info@harrisboatworks.ca'] });
  });
});
