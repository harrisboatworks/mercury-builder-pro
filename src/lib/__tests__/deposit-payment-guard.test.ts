import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  INVALID_DEPOSIT_IDENTITY,
  INVALID_DEPOSIT_SAVED_QUOTE,
  assertDepositRequestHasSavedQuoteId,
  assertDepositRequestReadyForStripe,
  createPaymentMayInvokeStripe,
  isDepositPaymentRequest,
} from '../../../supabase/functions/_shared/deposit-payment-guard.ts';

const QUOTE_ID = '11111111-1111-4111-8111-111111111111';

const validIdentity = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '905-555-0100',
  addressLine1: '5369 Harris Boat Works Rd',
  city: 'Gores Landing',
  region: 'ON',
  postalCode: 'K0K 2E0',
  country: 'Canada',
};

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
      { paymentType: 'deposit', customerInfo: validIdentity },
      { paymentType: 'deposit', depositAmount: '500', customerInfo: validIdentity },
      { depositAmount: '200', customerInfo: validIdentity },
      { paymentType: 'deposit', savedQuoteId: '', customerInfo: validIdentity },
      { paymentType: 'deposit', savedQuoteId: 'not-a-uuid', customerInfo: validIdentity },
      { paymentType: 'deposit', savedQuoteId: 'saved-quotes/x/quote.pdf', customerInfo: validIdentity },
    ];

    for (const body of missingBodies) {
      expect(isDepositPaymentRequest(body)).toBe(true);
      expect(createPaymentMayInvokeStripe(body)).toBe(false);
      expect(() => assertDepositRequestHasSavedQuoteId(body)).toThrow(INVALID_DEPOSIT_SAVED_QUOTE);
      expect(wouldInvokeStripe(body)).toBe(false);
    }
  });

  it('fails closed and does not invoke Stripe when identity/address is incomplete', () => {
    const missingFields = ['name', 'email', 'phone', 'addressLine1', 'city', 'region', 'postalCode', 'country'] as const;
    for (const field of missingFields) {
      const customerInfo = { ...validIdentity, [field]: '' };
      const body = { paymentType: 'deposit', savedQuoteId: QUOTE_ID, customerInfo };
      expect(createPaymentMayInvokeStripe(body)).toBe(false);
      expect(() => assertDepositRequestReadyForStripe(body)).toThrow(INVALID_DEPOSIT_IDENTITY);
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

  it('requires a canonical UUID and complete identity before a deposit may reach Stripe', () => {
    expect(assertDepositRequestReadyForStripe({
      paymentType: 'deposit',
      depositAmount: '500',
      savedQuoteId: QUOTE_ID,
      customerInfo: validIdentity,
    })).toBe(QUOTE_ID);
    expect(createPaymentMayInvokeStripe({
      paymentType: 'deposit',
      savedQuoteId: QUOTE_ID,
      customerInfo: validIdentity,
    })).toBe(true);
    expect(wouldInvokeStripe({
      paymentType: 'deposit',
      savedQuoteId: QUOTE_ID,
      customerInfo: validIdentity,
    })).toBe(true);
    expect(createPaymentMayInvokeStripe({
      paymentType: 'deposit',
      savedQuoteId: QUOTE_ID,
    })).toBe(false);
  });

  it('constructs the deposit Stripe client only after identity, saved-quote, and bound document checks', () => {
    const source = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    const identityGuardIdx = source.indexOf('assertDepositRequestReadyForStripe');
    const documentCheck = source.indexOf('assertCanonicalQuoteDocumentReady({');
    const depositStripeIdx = source.indexOf('const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });', documentCheck);
    const customersListIdx = source.indexOf('stripe.customers.list', documentCheck);
    const checkoutCreateIdx = source.indexOf('stripe.checkout.sessions.create(sessionData');

    expect(identityGuardIdx).toBeGreaterThan(-1);
    expect(documentCheck).toBeGreaterThan(identityGuardIdx);
    expect(depositStripeIdx).toBeGreaterThan(documentCheck);
    expect(customersListIdx).toBeGreaterThan(depositStripeIdx);
    expect(checkoutCreateIdx).toBeGreaterThan(customersListIdx);
    expect(source).toContain('if (!depositSavedQuoteId || !submittedIdentity)');
    expect(source).toContain('buildStripeDepositMetadata');
    expect(source).toContain('metadata: buildStripeDepositMetadata({');
    expect(source).not.toContain('customer_name: customerName');
    expect(source).not.toContain('customer_phone: customerPhone');
    expect(source).not.toMatch(/metadata:[\s\S]{0,400}quote_pdf_path/);
  });

  it('recovers historical Stripe billing through an admin-only bound-session path before checkout', () => {
    const source = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    expect(source.indexOf('rawBody.action === "recover_stripe_billing"')).toBeGreaterThan(-1);
    expect(source.indexOf('rawBody.action === "recover_stripe_billing"'))
      .toBeLessThan(source.indexOf('depositSavedQuoteId = assertDepositRequestReadyForStripe'));
    expect(source.indexOf('requireAdmin(options.req, options.corsHeaders)')).toBeGreaterThan(-1);
    expect(source.indexOf('requireAdmin(options.req, options.corsHeaders)'))
      .toBeLessThan(source.indexOf('stripe.checkout.sessions.retrieve(boundSessionId,'));
    expect(source).toContain('assertNoCallerDocumentPath(options.rawBody)');
    expect(source).toContain('assertRecoverStripeBillingRequest(options.rawBody)');
    expect(source).toContain('planVerifiedStripeRecovery');
    expect(source).toContain('boundCheckoutSessionIdFromDeposit(deposit)');
    expect(source).toContain('promotedCustomerQuoteFields');
    expect(source).toContain('savedQuoteDepositStatus');
    expect(source).not.toContain('stripe.checkout.sessions.retrieve(options.body.sessionId)');
    expect(source).not.toContain('send-deposit-confirmation-email');
    expect(source).not.toContain('send-sms');
    expect(source).toContain('requireAdmin(options.req, options.corsHeaders)');
    expect(source).not.toContain('Access-Control-Allow-Origin": "*"');
  });

  it('fails closed on an existing-deposit read error before creating or retrieving a Stripe checkout session', () => {
    const source = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    const documentCheck = source.indexOf('assertCanonicalQuoteDocumentReady({');
    const lookupError = source.indexOf('if (existingDepositError)', documentCheck);
    const sessionRetrieve = source.indexOf('const existingSession = await stripe.checkout.sessions.retrieve', documentCheck);
    const sessionCreate = source.indexOf('stripe.checkout.sessions.create(sessionData');
    expect(lookupError).toBeGreaterThan(documentCheck);
    expect(sessionRetrieve).toBeGreaterThan(lookupError);
    expect(sessionCreate).toBeGreaterThan(sessionRetrieve);
    expect(source).toContain('ERROR: Failed to read existing deposit');
    expect(source).toContain('Unable to prepare reservation checkout');
  });

  it('rebinding an existing deposit is conditional on pending status and the prior session', () => {
    const source = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    expect(source).toContain('classifyDepositPersistOutcome');
    expect(source).toContain('.or("payment_status.is.null,payment_status.eq.pending")');
    expect(source).toContain('.eq("stripe_checkout_session_id", existingDeposit.stripe_checkout_session_id)');
    expect(source).toContain('.is("stripe_checkout_session_id", null)');
    expect(source).toContain('Deposit already paid during persist race');
    expect(source).toContain('stripe.checkout.sessions.expire(session.id)');
    expect(source.lastIndexOf('classifyDepositPersistOutcome'))
      .toBeGreaterThan(source.indexOf('stripe.checkout.sessions.create(sessionData'));
  });

  it('rejects a complete existing Checkout Session before creating a replacement', () => {
    const source = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    const retrieveIdx = source.indexOf('const existingSession = await stripe.checkout.sessions.retrieve');
    const classifyIdx = source.indexOf('classifyExistingDepositCheckoutSession(existingSession)');
    const completeIdx = source.indexOf('existingSessionDisposition === "already_complete"');
    const createIdx = source.indexOf('stripe.checkout.sessions.create(sessionData');
    expect(retrieveIdx).toBeGreaterThan(-1);
    expect(classifyIdx).toBeGreaterThan(retrieveIdx);
    expect(completeIdx).toBeGreaterThan(classifyIdx);
    expect(createIdx).toBeGreaterThan(completeIdx);
    expect(source).toContain('existingSessionDisposition !== "renew_expired"');
    expect(source).toContain('Existing deposit checkout session is already complete');
  });

  it('recovers Stripe billing with an expanded PaymentIntent timestamp and optimistic writes', () => {
    const source = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    expect(source).toContain('expand: ["payment_intent"]');
    expect(source).toContain('stripeDerivedPaidAt(session)');
    expect(source).toContain('Stripe payment timestamp is unavailable');
    expect(source).toContain('classifyOptimisticRecoveryWrite');
    expect(source).toContain('.eq("payment_status", expectedPaymentStatus)');
    expect(source).toContain('.is("payment_status", null)');
    expect(source).toContain('.eq("stripe_checkout_session_id", expectedCheckoutSessionId)');
    expect(source).toContain('.eq("deposit_status", expectedSavedDepositStatus)');
    expect(source).not.toContain('paidAt: new Date().toISOString()');
  });
});
