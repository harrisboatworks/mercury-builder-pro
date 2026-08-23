import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  assertBoundCheckoutMatchesRecovery,
  assertStripeDepositChargeMatches,
  boundCheckoutSessionIdFromDeposit,
  buildStripeDepositMetadata,
  classifyDepositPersistOutcome,
  classifyExistingDepositCheckoutSession,
  classifyNotificationOutcomeWrite,
  classifyOptimisticRecoveryWrite,
  depositNotificationOutcomeGuard,
  lookupDepositBySession,
  resolveDepositWebhookSmsGate,
  pendingDepositRebindAllowed,
  planVerifiedStripeRecovery,
  shouldSendFirstClaimSms,
  stripeBillingAddressFromCheckout,
  stripeDepositMetadataIsSafe,
  stripeDerivedPaidAt,
} from '../../../supabase/functions/_shared/deposit-deal-record.ts';
import {
  audiencesNeedingDelivery,
  hasDepositOutboxSchema,
  isDeliveryRowClaimable,
  legacyNotificationStatusFromAudienceResults,
  planDepositWebhookMailer,
  seedDepositEmailDeliveryRows,
  shouldSeedAndInvokeDepositMailer,
  stripeWebhookStatusAfterHandler,
} from '../../../supabase/functions/_shared/deposit-email-deliveries.ts';

const SESSION_ID = 'cs_test_dealpacket001';
const QUOTE_ID = '11111111-1111-4111-8111-111111111111';
const DEAL_ID = '22222222-2222-4222-8222-222222222222';

describe('deposit webhook deal-packet idempotency', () => {
  it('looks up the promoted session column and treats billing address as payment context only', () => {
    const rows = [
      { stripe_checkout_session_id: SESSION_ID, quote_data: { stripe_session_id: SESSION_ID } },
    ];
    expect(lookupDepositBySession(rows, SESSION_ID)).toEqual(rows[0]);
    expect(lookupDepositBySession([
      { quote_data: { stripe_session_id: SESSION_ID } },
    ], SESSION_ID)?.quote_data).toEqual({ stripe_session_id: SESSION_ID });

    const metadata = buildStripeDepositMetadata({
      depositAmount: '500',
      savedQuoteId: QUOTE_ID,
    });
    expect(stripeDepositMetadataIsSafe(metadata)).toBe(true);
    expect(metadata).not.toHaveProperty('customer_name');
    expect(metadata).not.toHaveProperty('quote_pdf_path');

    expect(stripeBillingAddressFromCheckout({
      address: { line1: '1 Market St', city: 'San Francisco', state: 'CA', postal_code: '94105', country: 'US' },
    })).toEqual({
      source: 'stripe_checkout_billing',
      line1: '1 Market St',
      line2: null,
      city: 'San Francisco',
      region: 'CA',
      postal_code: '94105',
      country: 'US',
    });
  });

  it('does not rebind a complete Checkout Session even before the webhook lands', () => {
    expect(classifyExistingDepositCheckoutSession({
      status: 'complete',
      url: 'https://checkout.stripe.com/c/pay/cs_test_complete',
    })).toBe('already_complete');
    expect(classifyExistingDepositCheckoutSession({
      status: 'open',
      url: 'https://checkout.stripe.com/c/pay/cs_test_open',
    })).toBe('reuse_open');
    expect(classifyExistingDepositCheckoutSession({
      status: 'expired',
    })).toBe('renew_expired');
    expect(classifyExistingDepositCheckoutSession({
      status: 'open',
    })).toBe('unusable');
  });

  it('does not resend SMS or already-sent audiences on replay', () => {
    expect(shouldSendFirstClaimSms({ previousPaymentStatus: 'paid' })).toBe(false);
    expect(shouldSendFirstClaimSms({ previousPaymentStatus: 'pending' })).toBe(true);
    const seeds = seedDepositEmailDeliveryRows({ customerQuoteId: DEAL_ID, savedQuoteId: QUOTE_ID });
    expect(seeds).toHaveLength(3);
    expect(audiencesNeedingDelivery([
      { audience: 'customer', status: 'sent' },
      { audience: 'hbw', status: 'sent' },
      { audience: 'grok_bot', status: 'sent' },
    ])).toEqual([]);
  });

  it('gates SMS as already paid when a lost claim rereads a concurrently paid deposit', () => {
    const boundQuoteData = { payment_status: 'pending', sms_notification_status: null };
    const lostClaimGate = resolveDepositWebhookSmsGate({
      alreadyPaid: false,
      boundQuoteData,
      claimWon: false,
      concurrent: {
        payment_status: 'paid',
        quote_data: { payment_status: 'paid', sms_notification_status: 'sent' },
      },
    });
    expect(lostClaimGate).toEqual({
      previousPaymentStatus: 'paid',
      smsStatus: 'sent',
    });
    expect(shouldSendFirstClaimSms(lostClaimGate)).toBe(false);
    expect(shouldSendFirstClaimSms(resolveDepositWebhookSmsGate({
      alreadyPaid: false,
      boundQuoteData,
      claimWon: true,
    }))).toBe(true);

    const webhook = readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8');
    expect(webhook).toContain('resolveDepositWebhookSmsGate');
    expect(webhook).toContain('shouldSendFirstClaimSms(smsGate)');
    expect(webhook).not.toContain('previousPaymentStatus: alreadyPaid ? "paid" : boundQuoteData.payment_status');
  });

  it('guards the final deposit notification write on this event\'s processing marker', () => {
    expect(depositNotificationOutcomeGuard('evt_test_deposit001')).toEqual({
      notification_status: 'processing',
      notification_event_id: 'evt_test_deposit001',
    });
    expect(classifyNotificationOutcomeWrite({
      written: null,
    })).toBe('lost_ownership');
    expect(classifyNotificationOutcomeWrite({
      written: { id: DEAL_ID },
    })).toBe('written');
    expect(classifyNotificationOutcomeWrite({
      written: null,
      writeError: { message: 'write failed' },
    })).toBe('write_failed');

    const webhook = readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8');
    expect(webhook).toContain('contains("quote_data", depositNotificationOutcomeGuard(event.id))');
    expect(webhook).toContain('notification outcome ownership lost; leaving existing state');
    const quoteGuardIdx = webhook.indexOf('notification_event_id: event.id');
    const depositGuardIdx = webhook.indexOf('depositNotificationOutcomeGuard(event.id)');
    expect(depositGuardIdx).toBeGreaterThan(-1);
    expect(quoteGuardIdx).toBeGreaterThan(-1);
  });

  it('keeps payment paid when one audience fails and retries only that audience', () => {
    expect(audiencesNeedingDelivery([
      { audience: 'customer', status: 'sent' },
      { audience: 'hbw', status: 'failed' },
      { audience: 'grok_bot', status: 'sent' },
    ])).toEqual(['hbw']);
  });

  it('wires webhook replay to seed deliveries, skip SMS, and invoke the bound mailer', () => {
    const webhook = readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8');
    expect(webhook).toContain('session.payment_status !== "paid"');
    expect(webhook).toContain('eq("stripe_checkout_session_id", session.id)');
    expect(webhook).toContain('boundSavedQuoteId !== savedQuoteId');
    expect(webhook).toContain('stripeBillingAddressFromCheckout(session.customer_details)');
    expect(webhook).toContain('seedDepositEmailDeliveryRows');
    expect(webhook).toContain('body: { stripeSessionId: session.id }');
    expect(webhook).toContain('shouldSendFirstClaimSms');
    expect(webhook).toContain('deliveriesIndicateFailure');
    expect(webhook).toContain('stripe_billing_address: billingAddress');
    expect(webhook).not.toContain('customerEmail: session.customer_email');
    expect(webhook).not.toContain('session.metadata.quote_pdf_path');
    expect(webhook).not.toContain('Deposit email FAILED for ${customerEmail');
    expect(webhook).toContain('Historical paid deposit has no email outbox');
    expect(webhook).toContain('planDepositWebhookMailer');
    expect(webhook).not.toContain('Deposit notification already in progress after payment reconciliation');
    expect(webhook).not.toContain('notificationLeaseIsActive(boundQuoteData) && !notificationsComplete');
    expect(webhook).toContain('assertStripeDepositChargeMatches');
    expect(webhook).toContain('hasDepositOutboxSchema');
    expect(webhook).toContain('DEPOSIT_OUTBOX_SCHEMA_KEY');
    expect(webhook).toContain('alreadyPaid ? {}');
    expect(webhook).toContain('legacyNotificationStatusFromAudienceResults');
    expect(webhook).toContain('.select("id")');
    expect(webhook).toContain('maybeSingle()');
    expect(webhook).toContain('paymentReconciled = true');
    expect(webhook).toContain('notification pipeline failed after payment reconciliation');
    expect(webhook).toContain('stripeWebhookStatusAfterHandler');
    expect(webhook).not.toContain('throw new Error("Deposit notification delivery is already in progress")');
  });

  it('returns 200 after durable payment reconciliation and 500 only before that boundary', () => {
    expect(stripeWebhookStatusAfterHandler({ paymentReconciled: false, failed: true })).toBe(500);
    expect(stripeWebhookStatusAfterHandler({ paymentReconciled: true, failed: true })).toBe(200);
    expect(stripeWebhookStatusAfterHandler({ paymentReconciled: true, failed: false })).toBe(200);
    expect(stripeWebhookStatusAfterHandler({ paymentReconciled: false })).toBe(200);

    const webhook = readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8');
    const reconciledIdx = webhook.indexOf('paymentReconciled = true');
    const notificationCatchIdx = webhook.indexOf('notification pipeline failed after payment reconciliation');
    const terminalIdx = webhook.indexOf('stripeWebhookStatusAfterHandler({');
    expect(reconciledIdx).toBeGreaterThan(-1);
    expect(notificationCatchIdx).toBeGreaterThan(reconciledIdx);
    expect(terminalIdx).toBeGreaterThan(notificationCatchIdx);
    expect((webhook.match(/let paymentReconciled = false/g) || []).length).toBe(1);
    expect((webhook.match(/paymentReconciled = true/g) || []).length).toBe(1);
  });

  it('does not seed or mail a historical paid deposit with an empty outbox', () => {
    expect(hasDepositOutboxSchema({ notification_event_id: 'evt_historical' })).toBe(false);
    expect(hasDepositOutboxSchema({ deposit_outbox_schema: 1 })).toBe(true);
    expect(shouldSeedAndInvokeDepositMailer({
      alreadyPaid: true,
      deliveryRows: [],
    })).toEqual({ seed: false, invoke: false });
    expect(shouldSeedAndInvokeDepositMailer({
      alreadyPaid: true,
      deliveryRows: [],
      hasOutboxSchema: false,
    })).toEqual({ seed: false, invoke: false });
    expect(shouldSeedAndInvokeDepositMailer({
      alreadyPaid: true,
      deliveryRows: [],
      hasOutboxSchema: true,
    })).toEqual({ seed: true, invoke: true });
    expect(shouldSeedAndInvokeDepositMailer({
      alreadyPaid: true,
      deliveryReadError: true,
      hasOutboxSchema: true,
    })).toEqual({ seed: false, invoke: false });
    expect(shouldSeedAndInvokeDepositMailer({
      alreadyPaid: false,
      deliveryRows: [],
    })).toEqual({ seed: true, invoke: true });
    expect(shouldSeedAndInvokeDepositMailer({
      alreadyPaid: true,
      deliveryRows: [{ audience: 'customer', status: 'failed' }],
      hasOutboxSchema: true,
    })).toEqual({ seed: false, invoke: true });
    expect(legacyNotificationStatusFromAudienceResults(null, { invoked: false }))
      .toBe('not_sent');
    expect(legacyNotificationStatusFromAudienceResults({
      customer: 'sent',
      hbw: 'failed',
      grok_bot: 'sent',
    }, { invoked: true })).toBe('manual_follow_up');
    expect(legacyNotificationStatusFromAudienceResults({
      customer: 'sent',
      hbw: 'sent',
      grok_bot: 'sent',
    }, { invoked: true })).toBe('delivered');
  });

  it('seeds and invokes on retry when already paid, the outbox marker is present, and the legacy lease is still active', () => {
    const leaseExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    expect(Date.parse(leaseExpiresAt)).toBeGreaterThan(Date.now());

    expect(planDepositWebhookMailer({
      alreadyPaid: true,
      legacyLeaseActive: true,
      hasOutboxSchema: true,
      deliveryRows: [],
    })).toEqual({ seed: true, invoke: true });
    expect(planDepositWebhookMailer({
      alreadyPaid: true,
      legacyLeaseActive: true,
      hasOutboxSchema: false,
      deliveryRows: [],
    })).toEqual({ seed: false, invoke: false });
    expect(planDepositWebhookMailer({
      alreadyPaid: true,
      legacyLeaseActive: true,
      hasOutboxSchema: true,
      deliveryRows: [
        { audience: 'customer', status: 'pending' },
        { audience: 'hbw', status: 'failed' },
        { audience: 'grok_bot', status: 'sending', claim_expires_at: leaseExpiresAt },
      ],
    })).toEqual({ seed: false, invoke: true });
    expect(audiencesNeedingDelivery([
      { audience: 'customer', status: 'pending' },
      { audience: 'hbw', status: 'failed' },
      { audience: 'grok_bot', status: 'sending', claim_expires_at: leaseExpiresAt },
    ])).toEqual(['customer', 'hbw']);
    expect(isDeliveryRowClaimable({
      status: 'sending',
      claim_expires_at: leaseExpiresAt,
    })).toBe(false);
    expect(audiencesNeedingDelivery([
      { audience: 'customer', status: 'sent' },
      { audience: 'hbw', status: 'sent' },
      { audience: 'grok_bot', status: 'sent' },
    ])).toEqual([]);

    const webhook = readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8');
    expect(webhook.indexOf('paymentReconciled = true'))
      .toBeLessThan(webhook.indexOf('planDepositWebhookMailer({'));
    expect(webhook).toContain('legacyLeaseActive: notificationLeaseIsActive(boundQuoteData)');
  });

  it('recovers billing only from the bound checkout session', () => {
    const deposit = {
      lead_source: 'deposit',
      saved_quote_id: QUOTE_ID,
      stripe_checkout_session_id: SESSION_ID,
      deposit_amount: 500,
      quote_data: { saved_quote_id: QUOTE_ID, stripe_session_id: SESSION_ID, deposit_amount: '500' },
    };
    const savedQuote = { id: QUOTE_ID, deposit_amount: 500 };
    const paidSession = {
      id: SESSION_ID,
      payment_status: 'paid',
      amount_total: 50000,
      payment_intent: 'pi_test_dealpacket001',
      metadata: { payment_type: 'motor_deposit', saved_quote_id: QUOTE_ID, deposit_amount: '500' },
    };
    expect(boundCheckoutSessionIdFromDeposit(deposit)).toBe(SESSION_ID);
    expect(assertBoundCheckoutMatchesRecovery({
      savedQuoteId: QUOTE_ID,
      deposit,
      savedQuote,
      session: paidSession,
    })).toEqual({
      sessionId: SESSION_ID,
      depositAmount: 500,
      paymentIntentId: 'pi_test_dealpacket001',
    });
    expect(() => assertBoundCheckoutMatchesRecovery({
      savedQuoteId: QUOTE_ID,
      deposit,
      savedQuote,
      session: { ...paidSession, id: 'cs_test_other' },
    })).toThrow('Checkout session is not the bound session');
    expect(() => assertBoundCheckoutMatchesRecovery({
      savedQuoteId: QUOTE_ID,
      deposit: { ...deposit, lead_source: 'website' },
      savedQuote,
      session: paidSession,
    })).toThrow('Bound row is not a deposit');
    expect(() => assertBoundCheckoutMatchesRecovery({
      savedQuoteId: QUOTE_ID,
      deposit,
      savedQuote,
      session: { ...paidSession, payment_status: 'unpaid' },
    })).toThrow('Checkout session is not paid');
    expect(() => assertBoundCheckoutMatchesRecovery({
      savedQuoteId: QUOTE_ID,
      deposit,
      savedQuote: { ...savedQuote, deposit_amount: 200 },
      session: paidSession,
    })).toThrow('Deposit amounts do not match');
  });

  it('promotes verified paid join fields without accepting caller-supplied payment payloads', () => {
    const plan = planVerifiedStripeRecovery({
      savedQuoteId: QUOTE_ID,
      deposit: {
        lead_source: 'deposit',
        saved_quote_id: null,
        stripe_checkout_session_id: null,
        stripe_payment_intent_id: null,
        payment_status: null,
        deposit_amount: 500,
        quote_data: { saved_quote_id: QUOTE_ID, stripe_session_id: SESSION_ID, deposit_amount: '500.00' },
      },
      savedQuote: { id: QUOTE_ID, deposit_status: 'pending', deposit_amount: null, deposit_paid_at: null },
      session: {
        id: SESSION_ID,
        payment_status: 'paid',
        amount_total: 50000,
        payment_intent: 'pi_test_dealpacket001',
        customer_details: {
          address: { line1: '1 Market St', city: 'San Francisco', state: 'CA', postal_code: '94105', country: 'US' },
        },
        metadata: { payment_type: 'motor_deposit', saved_quote_id: QUOTE_ID, deposit_amount: '500' },
      },
      paidAt: '2026-08-23T16:00:00.000Z',
    });

    expect(plan.savedQuoteDepositStatus).toBe('paid');
    expect(plan.promotedCustomerQuoteFields).toEqual(expect.arrayContaining([
      'saved_quote_id',
      'stripe_checkout_session_id',
      'stripe_payment_intent_id',
      'payment_status',
      'stripe_billing_address',
    ]));
    expect(plan.promotedSavedQuoteFields).toEqual(expect.arrayContaining([
      'deposit_status',
      'deposit_amount',
      'deposit_paid_at',
    ]));
    expect(plan.customerQuotePatch.payment_status).toBe('paid');
    expect(plan.savedQuotePatch).toMatchObject({
      deposit_status: 'paid',
      deposit_amount: 500,
      deposit_paid_at: '2026-08-23T16:00:00.000Z',
    });
    expect(plan.stripeBillingAddress).toMatchObject({
      source: 'stripe_checkout_billing',
      line1: '1 Market St',
    });
  });

  it('requires a CAD Stripe charge that matches the bound deposit amount', () => {
    expect(assertStripeDepositChargeMatches({
      amountTotal: 50000,
      currency: 'cad',
      depositAmount: '500',
    })).toBe(500);
    expect(() => assertStripeDepositChargeMatches({
      amountTotal: 50000,
      currency: 'usd',
      depositAmount: '500',
    })).toThrow('Stripe deposit currency is not CAD');
    expect(() => assertStripeDepositChargeMatches({
      amountTotal: 20000,
      currency: 'cad',
      depositAmount: '500',
    })).toThrow('Stripe deposit amount does not match');
  });

  it('classifies a two-tab create-payment rebind against a just-paid row as already paid', () => {
    expect(pendingDepositRebindAllowed({
      payment_status: 'pending',
      stripe_checkout_session_id: SESSION_ID,
    }, SESSION_ID)).toBe(true);
    expect(pendingDepositRebindAllowed({
      payment_status: 'paid',
      stripe_checkout_session_id: SESSION_ID,
    }, SESSION_ID)).toBe(false);
    expect(classifyDepositPersistOutcome({
      mode: 'update',
      wrote: null,
      createdSessionId: 'cs_test_newtab',
      reread: { payment_status: 'paid', stripe_checkout_session_id: SESSION_ID },
    })).toBe('already_paid');
    expect(classifyDepositPersistOutcome({
      mode: 'update',
      wrote: { id: DEAL_ID, payment_status: 'pending', stripe_checkout_session_id: 'cs_test_newtab' },
      createdSessionId: 'cs_test_newtab',
    })).toBe('saved');
    expect(classifyDepositPersistOutcome({
      mode: 'insert',
      wrote: null,
      writeError: { code: '23505' },
      createdSessionId: SESSION_ID,
      reread: { payment_status: 'pending', stripe_checkout_session_id: SESSION_ID },
    })).toBe('reused_same_session');
  });

  it('prefers the Stripe PaymentIntent created time and classifies optimistic recovery races', () => {
    expect(stripeDerivedPaidAt({
      created: 1700000000,
      payment_intent: { created: 1700001000 },
    })).toBe(new Date(1700001000 * 1000).toISOString());
    expect(stripeDerivedPaidAt({ created: 1700000000 })).toBe(new Date(1700000000 * 1000).toISOString());
    expect(stripeDerivedPaidAt({})).toBeNull();
    expect(classifyOptimisticRecoveryWrite({
      written: null,
      reread: { payment_status: 'paid', stripe_checkout_session_id: SESSION_ID },
      expectedSessionId: SESSION_ID,
    })).toBe('already_completed');
    expect(classifyOptimisticRecoveryWrite({
      written: null,
      reread: { payment_status: 'pending', stripe_checkout_session_id: SESSION_ID },
      expectedSessionId: SESSION_ID,
    })).toBe('conflict');
  });
});
