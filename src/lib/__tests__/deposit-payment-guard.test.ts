import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  INVALID_DEPOSIT_SAVED_QUOTE,
  assertDepositRequestHasSavedQuoteId,
  createPaymentMayInvokeStripe,
  isDepositPaymentRequest,
} from '../../../supabase/functions/_shared/deposit-payment-guard.ts';

const QUOTE_ID = '11111111-1111-4111-8111-111111111111';

function wouldInvokeStripe(body: Parameters<typeof createPaymentMayInvokeStripe>[0]): boolean {
  const stripe = { invoked: false };
  if (!createPaymentMayInvokeStripe(body)) {
    return stripe.invoked;
  }
  stripe.invoked = true;
  return stripe.invoked;
}

describe('deposit create-payment savedQuoteId guard', () => {
  it('fails closed and does not invoke Stripe when savedQuoteId is absent', () => {
    const missingBodies = [
      { paymentType: 'deposit' },
      { paymentType: 'deposit', depositAmount: '500' },
      { depositAmount: '200' },
      { paymentType: 'deposit', savedQuoteId: '' },
      { paymentType: 'deposit', savedQuoteId: 'not-a-uuid' },
      { paymentType: 'deposit', savedQuoteId: 'saved-quotes/x/quote.pdf' },
    ];

    for (const body of missingBodies) {
      expect(isDepositPaymentRequest(body)).toBe(true);
      expect(createPaymentMayInvokeStripe(body)).toBe(false);
      expect(() => assertDepositRequestHasSavedQuoteId(body)).toThrow(INVALID_DEPOSIT_SAVED_QUOTE);
      expect(wouldInvokeStripe(body)).toBe(false);
    }
  });

  it('preserves verify and quote-payment Stripe access without a saved quote', () => {
    expect(isDepositPaymentRequest({ action: 'verify', sessionId: 'cs_test_abc' })).toBe(false);
    expect(assertDepositRequestHasSavedQuoteId({ action: 'verify', sessionId: 'cs_test_abc' })).toBeNull();
    expect(createPaymentMayInvokeStripe({ action: 'verify', sessionId: 'cs_test_abc' })).toBe(true);
    expect(wouldInvokeStripe({ action: 'verify', sessionId: 'cs_test_abc' })).toBe(true);

    expect(isDepositPaymentRequest({ paymentType: 'quote' })).toBe(false);
    expect(assertDepositRequestHasSavedQuoteId({ paymentType: 'quote' })).toBeNull();
    expect(createPaymentMayInvokeStripe({ paymentType: 'quote' })).toBe(true);
    expect(wouldInvokeStripe({ paymentType: 'quote' })).toBe(true);
  });

  it('requires a canonical UUID before a deposit may reach Stripe', () => {
    expect(assertDepositRequestHasSavedQuoteId({
      paymentType: 'deposit',
      depositAmount: '500',
      savedQuoteId: QUOTE_ID,
    })).toBe(QUOTE_ID);
    expect(createPaymentMayInvokeStripe({
      paymentType: 'deposit',
      savedQuoteId: QUOTE_ID,
    })).toBe(true);
    expect(wouldInvokeStripe({
      paymentType: 'deposit',
      savedQuoteId: QUOTE_ID,
    })).toBe(true);
  });

  it('constructs the Stripe client only after the deposit savedQuoteId guard', () => {
    const source = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    const guardIdx = source.indexOf('assertDepositRequestHasSavedQuoteId');
    const stripeIdx = source.indexOf('new Stripe(');
    const customersListIdx = source.indexOf('stripe.customers.list');
    const checkoutCreateIdx = source.indexOf('stripe.checkout.sessions.create');

    expect(guardIdx).toBeGreaterThan(-1);
    expect(stripeIdx).toBeGreaterThan(guardIdx);
    expect(source.indexOf('new Stripe(', stripeIdx + 1)).toBe(-1);
    expect(customersListIdx).toBeGreaterThan(stripeIdx);
    expect(checkoutCreateIdx).toBeGreaterThan(customersListIdx);
    expect(source).toContain('if (!depositSavedQuoteId)');
  });
});
