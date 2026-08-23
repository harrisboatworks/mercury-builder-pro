import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createPaymentCustomerInfoSchema } from '../../../supabase/functions/_shared/create-payment-request.ts';
import {
  INVALID_DEPOSIT_IDENTITY,
  INVALID_DEPOSIT_SAVED_QUOTE,
  assertDepositRequestHasSavedQuoteId,
  assertDepositRequestReadyForStripe,
  createPaymentMayInvokeStripe,
  decideCreatePaymentStripeAccess,
  isDepositPaymentRequest,
  readRequiredStripeSecret,
  type CreatePaymentStripeAccessDecision,
} from '../../../supabase/functions/_shared/deposit-payment-guard.ts';

const compatiblePaymentRequestSchema = z.object({
  depositAmount: z.enum(['100', '200', '500', '1000', '2500']).optional(),
  customerInfo: createPaymentCustomerInfoSchema(z),
  paymentType: z.enum(['deposit', 'quote']).optional(),
  savedQuoteId: z.string().uuid().optional(),
});

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

function simulateCreatePaymentBeforeStripe(
  body: Parameters<typeof decideCreatePaymentStripeAccess>[0],
  env: Record<string, string | undefined>,
) {
  const stripeAccess: CreatePaymentStripeAccessDecision = decideCreatePaymentStripeAccess(body);
  if (stripeAccess.allowStripeAccess === false) {
    return {
      status: stripeAccess.status,
      error: stripeAccess.error,
      readStripeSecret: false,
      createdStripeClient: false,
    };
  }
  try {
    readRequiredStripeSecret(env);
  } catch {
    return {
      status: 500,
      error: 'An error occurred processing your payment. Please try again.',
      readStripeSecret: true,
      createdStripeClient: false,
    };
  }
  return {
    status: 'continue' as const,
    error: null,
    readStripeSecret: true,
    createdStripeClient: true,
  };
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

  it('accepts a quote payload with absent or partial customerInfo', () => {
    const absent = compatiblePaymentRequestSchema.safeParse({ paymentType: 'quote' });
    const nameOnly = compatiblePaymentRequestSchema.safeParse({
      paymentType: 'quote',
      customerInfo: { name: 'Ada Lovelace' },
    });
    const priorOptionalShape = compatiblePaymentRequestSchema.safeParse({
      paymentType: 'quote',
      customerInfo: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: '905-555-0100',
      },
    });
    const emptyEmail = compatiblePaymentRequestSchema.safeParse({
      paymentType: 'quote',
      customerInfo: { email: '' },
    });

    expect(absent.success).toBe(true);
    expect(nameOnly.success).toBe(true);
    expect(priorOptionalShape.success).toBe(true);
    expect(emptyEmail.success).toBe(true);
    expect(createPaymentMayInvokeStripe({ paymentType: 'quote', customerInfo: { name: 'Ada' } })).toBe(true);

    const payment = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    expect(payment).toContain('createPaymentCustomerInfoSchema(z)');
    expect(payment).toContain('decideCreatePaymentStripeAccess');
    expect(payment).not.toContain('addressLine1: z.string().trim().min(1).max(120)');
  });

  it('rejects incomplete deposit identity after compatible schema parse and before Stripe', () => {
    const incompleteBodies = [
      { paymentType: 'deposit' as const, savedQuoteId: QUOTE_ID },
      { paymentType: 'deposit' as const, savedQuoteId: QUOTE_ID, customerInfo: { name: 'Ada Lovelace' } },
      {
        paymentType: 'deposit' as const,
        savedQuoteId: QUOTE_ID,
        customerInfo: { name: 'Ada Lovelace', email: 'ada@example.com', phone: '905-555-0100' },
      },
    ];

    for (const body of incompleteBodies) {
      expect(compatiblePaymentRequestSchema.safeParse(body).success).toBe(true);
      expect(isDepositPaymentRequest(body)).toBe(true);
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
    const identityGuardIdx = source.indexOf('decideCreatePaymentStripeAccess(validationResult.data)');
    const stripeSecretIdx = source.indexOf('readRequiredStripeSecret(Deno.env)', identityGuardIdx);
    const supabaseClientIdx = source.indexOf('const supabaseClient = createClient(', stripeSecretIdx);
    const documentCheck = source.indexOf('assertCanonicalQuoteDocumentReady({');
    const depositStripeIdx = source.indexOf('const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });', documentCheck);
    const customersListIdx = source.indexOf('stripe.customers.list', documentCheck);
    const checkoutCreateIdx = source.indexOf('stripe.checkout.sessions.create(sessionData');

    expect(identityGuardIdx).toBeGreaterThan(-1);
    expect(source.slice(identityGuardIdx, stripeSecretIdx)).toContain('allowStripeAccess');
    expect(source.slice(identityGuardIdx, stripeSecretIdx)).toContain('status: stripeAccess.status');
    expect(stripeSecretIdx).toBeGreaterThan(identityGuardIdx);
    expect(supabaseClientIdx).toBeGreaterThan(stripeSecretIdx);
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
      .toBeLessThan(source.indexOf('decideCreatePaymentStripeAccess(validationResult.data)'));
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

  it('returns 400 for the hosted no-Stripe-secret malformed deposits before reading the secret', () => {
    const hostedMissingAddress = {
      paymentType: 'deposit' as const,
      depositAmount: '500' as const,
      savedQuoteId: '31313131-3131-4131-8131-313131313131',
      customerInfo: {
        name: 'Staging Lovelace',
        email: 'ada@example.invalid',
        phone: '5555550100',
      },
    };
    const hostedMissingSavedQuoteId = {
      paymentType: 'deposit' as const,
      depositAmount: '500' as const,
      customerInfo: {
        name: 'Staging Lovelace',
        email: 'ada@example.invalid',
        phone: '5555550100',
        addressLine1: '1 Example Invalid Road',
        city: 'Exampleville',
        region: 'ON',
        postalCode: 'K0K 0A0',
        country: 'Canada',
      },
    };

    expect(compatiblePaymentRequestSchema.safeParse(hostedMissingAddress).success).toBe(true);
    expect(compatiblePaymentRequestSchema.safeParse(hostedMissingSavedQuoteId).success).toBe(true);

    const missingAddress = simulateCreatePaymentBeforeStripe(hostedMissingAddress, {});
    expect(missingAddress).toEqual({
      status: 400,
      error: INVALID_DEPOSIT_IDENTITY,
      readStripeSecret: false,
      createdStripeClient: false,
    });
    expect(missingAddress.error).toBe('Customer identity and address are required for a deposit');

    const missingQuote = simulateCreatePaymentBeforeStripe(hostedMissingSavedQuoteId, {});
    expect(missingQuote).toEqual({
      status: 400,
      error: INVALID_DEPOSIT_SAVED_QUOTE,
      readStripeSecret: false,
      createdStripeClient: false,
    });
    expect(missingQuote.error).toBe('Invalid saved quote for deposit');

    expect(() => readRequiredStripeSecret({})).toThrow('STRIPE_SECRET_KEY is not set');
    expect(() => readRequiredStripeSecret({ get: () => undefined })).toThrow('STRIPE_SECRET_KEY is not set');

    const source = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    const serveIdx = source.indexOf('serve(async (req) => {');
    const parseIdx = source.indexOf('const rawBody = await req.json();', serveIdx);
    const decideIdx = source.indexOf('decideCreatePaymentStripeAccess(validationResult.data)', parseIdx);
    const rejectIdx = source.indexOf('if (!stripeAccess.allowStripeAccess)', decideIdx);
    const paymentSecretIdx = source.indexOf('const stripeKey = readRequiredStripeSecret(Deno.env);', rejectIdx);
    const firstEnvGet = source.indexOf('Deno.env.get("STRIPE_SECRET_KEY")', serveIdx);
    expect(parseIdx).toBeGreaterThan(serveIdx);
    expect(decideIdx).toBeGreaterThan(parseIdx);
    expect(rejectIdx).toBeGreaterThan(decideIdx);
    expect(paymentSecretIdx).toBeGreaterThan(rejectIdx);
    expect(source.slice(rejectIdx, paymentSecretIdx)).toContain('status: stripeAccess.status');
    expect(firstEnvGet).toBe(-1);
  });
});
