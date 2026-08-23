import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  adminDealPacketPath,
  canRetryDepositDeliveries,
  canonicalDocumentLabel,
  dealPacketSavedQuoteId,
  dedupeAdminDealPacketRows,
  deliveryRowDisplayStatus,
  isAuthoritativeDepositPaid,
  legacyJsonPaymentStatusLabel,
  operationalCustomerQuoteId,
  resolveAdminDealPacketId,
  shouldOfferCanonicalDocumentDownload,
  summarizeDeliveryRetry,
  summarizeStripeRecovery,
} from '@/lib/admin-deal-packet';

const SAVED_ID = '11111111-1111-4111-8111-111111111111';
const DEAL_ID = '22222222-2222-4222-8222-222222222222';

describe('admin deal packet', () => {
  it('uses saved_quotes.id as the exact admin deep link and deduplicates joined deposits', () => {
    expect(adminDealPacketPath(SAVED_ID)).toBe(`/admin/quotes/${SAVED_ID}`);
    expect(resolveAdminDealPacketId({
      id: DEAL_ID,
      saved_quote_id: SAVED_ID,
      lead_source: 'deposit',
      _source: 'customer_quotes',
    })).toBe(SAVED_ID);

    const rows = dedupeAdminDealPacketRows([
      { id: DEAL_ID, saved_quote_id: SAVED_ID, lead_source: 'deposit', _source: 'customer_quotes' },
      { id: '33333333-3333-4333-8333-333333333333', lead_source: 'website', _source: 'customer_quotes' },
    ], [
      { id: SAVED_ID, _source: 'saved_quotes' },
    ]);

    expect(rows.map((row) => row.id)).toEqual([
      SAVED_ID,
      '33333333-3333-4333-8333-333333333333',
    ]);
  });

  it('does not present a regenerated PDF as the canonical bound document', () => {
    expect(shouldOfferCanonicalDocumentDownload({
      quotePdfPath: `saved-quotes/${SAVED_ID}/quote.pdf`,
      quotePdfSha256: 'a'.repeat(64),
      savedQuoteId: SAVED_ID,
    })).toBe(true);
    expect(canonicalDocumentLabel(true).button).toContain('canonical');
    expect(canonicalDocumentLabel(false).fallback).toContain('not the canonical');
  });

  it('exposes the joined admin sections and retry control', () => {
    const list = readFileSync('src/pages/AdminQuotes.tsx', 'utf8');
    const detail = readFileSync('src/pages/AdminQuoteDetail.tsx', 'utf8');
    expect(list).toContain('dedupeAdminDealPacketRows');
    expect(list).toContain('navigate(`/admin/quotes/${r._deal_packet_id || r.id}`)');
    expect(list).not.toContain('r.payment_status || r.quote_data?.payment_status');
    expect(detail).toContain('data-section="customer-identity"');
    expect(detail).toContain('data-section="motor-configuration"');
    expect(detail).toContain('data-section="payment-status"');
    expect(detail).toContain('data-section="boat-trade-financing"');
    expect(detail).toContain('data-section="canonical-document"');
    expect(detail).toContain('data-section="email-deliveries"');
    expect(detail).toContain('Retry failed/missing deliveries');
    expect(detail).toContain("invoke('quote-document-api'");
    expect(detail).toContain("invoke('send-deposit-confirmation-email'");
    expect(detail).toContain('.eq(\'saved_quote_id\', id)');
  });

  it('selects the joined customer-quote ID for writes and the saved-quote ID for deal operations', () => {
    const joined = {
      id: SAVED_ID,
      saved_quote_id: SAVED_ID,
      _source: 'saved_quotes' as const,
      _joined_customer_quote_id: DEAL_ID,
    };
    const customerOnly = {
      id: DEAL_ID,
      saved_quote_id: null,
      _source: 'customer_quotes' as const,
    };
    const savedOnly = {
      id: SAVED_ID,
      saved_quote_id: SAVED_ID,
      _source: 'saved_quotes' as const,
    };

    expect(operationalCustomerQuoteId(joined)).toBe(DEAL_ID);
    expect(dealPacketSavedQuoteId(joined)).toBe(SAVED_ID);
    expect(operationalCustomerQuoteId(customerOnly)).toBe(DEAL_ID);
    expect(dealPacketSavedQuoteId(customerOnly)).toBeNull();
    expect(operationalCustomerQuoteId(savedOnly)).toBeNull();
    expect(dealPacketSavedQuoteId(savedOnly)).toBe(SAVED_ID);

    const detail = readFileSync('src/pages/AdminQuoteDetail.tsx', 'utf8');
    expect(detail).toContain('operationalCustomerQuoteId');
    expect(detail).toContain('dealPacketSavedQuoteId');
    expect(detail).toContain(".select('id')");
    expect(detail).toContain('.maybeSingle()');
    expect(detail).not.toContain(".eq('id', q.id)");
    expect(detail).toContain("action: 'recover_stripe_billing'");
    expect(detail).toContain('summarizeDeliveryRetry');
    expect(detail).toContain('summarizeStripeRecovery');
    expect(detail).toContain('isAuthoritativeDepositPaid');
    expect(detail).toContain('legacyJsonPaymentStatusLabel');
    expect(detail).toContain('Could not load this deal packet');
    expect(detail).not.toContain("cq?.quote_data?.payment_status === 'paid'");
    expect(detail).not.toContain('cq.payment_status || cq.quote_data?.payment_status');
    expect(detail).toContain('Use Email deliveries to retry missing or failed sends');
    expect(detail).toContain('tracked three-audience confirmation');
    expect(detail).not.toContain("from('saved_quotes').update({ quote_data: updatedQuoteData })");
  });

  it('does not offer retry while a delivery lease is in progress', () => {
    const now = Date.parse('2026-08-23T12:00:00.000Z');
    const inProgress = [{
      audience: 'customer',
      status: 'sending',
      claim_expires_at: '2026-08-23T12:05:00.000Z',
    }];
    expect(deliveryRowDisplayStatus(inProgress[0], now)).toBe('sending (in progress)');
    expect(canRetryDepositDeliveries({
      rows: inProgress,
      paymentPaid: true,
      now,
    })).toBe(false);
    expect(canRetryDepositDeliveries({
      rows: [],
      paymentPaid: true,
      now,
    })).toBe(true);
    expect(summarizeDeliveryRetry([], now)).toContain('missing / not yet sent');
  });

  it('does not treat customer-editable JSON as Stripe payment proof', () => {
    expect(isAuthoritativeDepositPaid({
      customerQuotePaymentStatus: null,
      savedQuoteDepositStatus: 'pending',
    })).toBe(false);
    expect(isAuthoritativeDepositPaid({
      customerQuotePaymentStatus: 'paid',
      savedQuoteDepositStatus: 'pending',
    })).toBe(true);
    expect(legacyJsonPaymentStatusLabel('paid')).toContain('not Stripe payment proof');
    expect(summarizeStripeRecovery({
      customerQuoteFields: ['payment_status', 'stripe_billing_address'],
      savedQuoteFields: ['deposit_status'],
      paymentStatus: 'paid',
      savedQuoteDepositStatus: 'paid',
    })).toContain('Recovered/promoted');
  });
});
