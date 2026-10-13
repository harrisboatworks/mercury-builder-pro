import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { isQuoteSnapshotExpired } from '../../../supabase/functions/_shared/quote-snapshot-expiry.ts';

describe('new quote action expiry', () => {
  it('keeps the last Ontario millisecond valid and expires at midnight', () => {
    const quote = { validUntil: '2026-10-31T03:59:59.999Z' };
    expect(isQuoteSnapshotExpired(quote, new Date('2026-10-31T03:59:59.999Z'))).toBe(false);
    expect(isQuoteSnapshotExpired(quote, new Date('2026-10-31T04:00:00Z'))).toBe(true);
  });
  it('preserves legacy date-only validity through Ontario end of day', () => {
    expect(isQuoteSnapshotExpired({validUntil:'2026-10-30'},new Date('2026-10-31T03:00:00Z'))).toBe(false);
  });
  it('caps a later quote validity at the promotion end date', () => {
    expect(isQuoteSnapshotExpired({validUntil:'2026-11-15',promotion:{endDate:'2026-10-30'}},new Date('2026-10-31T04:00:00Z'))).toBe(true);
  });
  it('respects a shorter non-promotion quote validity', () => {
    expect(isQuoteSnapshotExpired({validUntil:'2026-10-15',promotion:{endDate:'2026-10-30'}},new Date('2026-10-16T04:00:00Z'))).toBe(true);
  });
  it('rejects malformed dates and preserves the existing deadline-free legacy path', () => {
    expect(isQuoteSnapshotExpired({validUntil:'bad'})).toBe(true);
    expect(isQuoteSnapshotExpired({})).toBe(false);
  });
  it('enforces the parsed snapshot deadline before any lead insert or document/email delivery', () => {
    const source = readFileSync('supabase/functions/submit-quote-lead/index.ts','utf8');
    const guard=source.indexOf('if (isQuoteSnapshotExpired(quoteDetails))');
    expect(guard).toBeGreaterThan(source.indexOf('...parseConsultationCallerQuoteSnapshot('));
    expect(guard).toBeLessThan(source.indexOf('.from("customer_quotes")'));
    expect(guard).toBeLessThan(source.indexOf('await mintConsultationDocument'));
    expect(guard).toBeLessThan(source.indexOf('resend.emails.send'));
  });
});
