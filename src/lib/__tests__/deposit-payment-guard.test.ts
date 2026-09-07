/// <reference types="node" />

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

  it('keeps every deposit authority check ahead of the first Stripe API call', () => {
    const source = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    const guardIdx = source.indexOf('assertDepositRequestHasSavedQuoteId');
    const stripeIdx = source.indexOf('new Stripe(');
    const customersListIdx = source.indexOf('stripe.customers.list');
    const documentCheckIdx = source.indexOf('await assertCanonicalQuoteDocumentReady({');
    const motorLookupIdx = source.indexOf('.from("motor_models")');
    const authoritativeTierIdx = source.indexOf('const authoritativeDeposit = getMotorReservationDeposit(');
    const bindingAuthorityIdx = source.indexOf(
      'await supabaseService.rpc("deposit_checkout_binding_authority_ready")',
    );
    const boundSessionRefreshIdx = source.indexOf('priorSession = await stripe.checkout.sessions.retrieve(');
    const checkoutCreateIdx = source.indexOf('stripe.checkout.sessions.create');

    expect(guardIdx).toBeGreaterThan(-1);
    expect(stripeIdx).toBeGreaterThan(guardIdx);
    expect(source.indexOf('new Stripe(', stripeIdx + 1)).toBe(-1);
    expect(documentCheckIdx).toBeGreaterThan(stripeIdx);
    expect(motorLookupIdx).toBeGreaterThan(documentCheckIdx);
    expect(authoritativeTierIdx).toBeGreaterThan(motorLookupIdx);
    expect(bindingAuthorityIdx).toBeGreaterThan(authoritativeTierIdx);
    expect(boundSessionRefreshIdx).toBeGreaterThan(bindingAuthorityIdx);
    expect(customersListIdx).toBeGreaterThan(boundSessionRefreshIdx);
    expect(checkoutCreateIdx).toBeGreaterThan(customersListIdx);
    expect(source).toContain('if (!depositSavedQuoteId)');
    expect(source).toContain('|| !savedMotorId');
    expect(source).toContain('Number(savedQuote.deposit_amount) !== authoritativeDeposit');
    expect(source).toContain('motor_id: savedMotorId');
  });

  it('makes Stripe creation and durable binding replay-safe', () => {
    const source = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');

    expect(source).toContain('`motor-reservation:${savedQuoteId}:${idempotencyFingerprint}`');
    expect(source).toContain('replacesSessionId: expiredBinding?.sessionId || null');
    expect(source).toContain('depositSaveError.code === "23505"');
    expect(source).toContain('.contains("quote_data", { saved_quote_id: savedQuoteId })');
    expect(source).toContain('Replaced expired motor reservation checkout');
    expect(source).toContain('priorSession.status !== "expired"');
    expect(source).toContain('priorSession.payment_status !== "unpaid"');
    expect(source).toContain('Reusing existing motor reservation checkout');
    expect(source).toContain('bindingMatchesReplaceableLegacyAuthority');
    expect(source).toContain('priorBindingIsReplaceableLegacy');
    expect(source).toContain('priorBindingIsExact');
    expect(source).toContain('currentBinding.state === "missing"');
    expect(source).toContain('currentBinding.sessionId !== session.id');
  });
});
