import { describe, expect, it, vi } from 'vitest';
import {
  assessSharedPaymentToken, inspectNativeDepositCompleteCaller, nativePaymentIntentForm,
  nativeDepositActorAuthorized, projectNativeDepositCheckout, runNativeDepositComplete,
  NATIVE_DEPOSIT_HANDLER_ID, type NativeIntentRecord, type NativeCompleteIo,
} from '../../../supabase/functions/_shared/native-deposit-checkout';
import { createNativeStripePreviewClient, NativeStripeRequestError } from '../../../supabase/functions/_shared/native-stripe-preview';
const now = new Date('2026-10-12T12:00:00Z');
const saved = '71717171-7171-4171-8171-717171717171'; const motor = '36363636-3636-4636-8636-363636363636';
const intent: NativeIntentRecord = { id: saved, child_id: 'ndc_' + 'a'.repeat(32), parent_session_id: 'chk_synthetic', saved_quote_id: saved,
  owner_user_id: 'buyer', motor_id: motor, amount_cents: 50000, currency: 'CAD', merchandise_cents: 1400000,
  document_sha256: 'a'.repeat(64), document_path: `saved-quotes/${saved}/quote.pdf`, policy_version: 'deposit-policy/v1',
  policy_code: 'in_stock_refundable', terms_version: 'hbw-reservation-terms/2026-04-08', catalog_model_number: '90ELPT', horsepower: 90,
  express_verified: false, status: 'approved', expires_at: '2026-10-12T13:00:00Z' };
const token = () => ({ id: 'spt_synthetic', object: 'shared_payment.granted_token', livemode: false, deactivated_at: null, deactivated_reason: null,
  usage_limits: { currency: 'cad', max_amount: 50000, expires_at: (now.getTime() + 300_000) / 1000 }, usage_details: { amount_captured: 0 } });
const expected = { amountCents: 50000, sellerAccountId: 'acct_synthetic', livemode: false, now, approvalExpiresAt: new Date(intent.expires_at) };
const payment = { instruments: [{ id: 'wallet_card', handler_id: NATIVE_DEPOSIT_HANDLER_ID, type: 'card', selected: true,
  credential: { type: 'shared_payment_token', token: 'spt_synthetic' } }] };
function setup() {
  let attempt: any = null; let paid = false; let approval: any = { ...intent, intent_id: intent.id };
  const pi = { id: 'pi_synthetic', livemode: false, amount: 50000, amount_received: 50000, currency: 'cad', status: 'succeeded', client_secret: 'not_public', metadata: {
    payment_channel: 'native_spt', payment_type: 'motor_deposit', native_intent_id: intent.id, native_child_id: intent.child_id,
    saved_quote_id: saved, motor_id: motor, deposit_amount: '500',
  } };
  const io: NativeCompleteIo = {
    loadIntentByChild: async () => ({ ...intent, status: paid ? 'paid' : intent.status }),
    loadSavedQuote: async () => ({ id: saved, user_id: 'buyer', quote_state: { motor: { id: motor } }, quote_pdf_path: intent.document_path, deposit_amount: 500,
      deposit_status: paid ? 'paid' : 'pending', email: 'synthetic@example.invalid', customer_full_name: 'Synthetic Buyer',
      customer_phone: '6135550100', customer_address_line1: '1 Example Invalid Road', customer_city: 'Exampleville',
      customer_region: 'ON', customer_postal_code: 'K0K0A0', customer_country: 'CA' }), loadDocumentHash: async () => intent.document_sha256,
    loadApproval: async () => approval, validateFreshIntent: async () => true, loadAttempt: async () => attempt, hostedRailActive: async () => false,
    claimAttempt: async a => {
      if (attempt && attempt.token_fingerprint !== a.tokenFingerprint) return { result: 'conflict' };
      attempt ??= { id: 'attempt', intent_id: intent.id, idempotency_key: `native-deposit-pi:${intent.id}`, token_fingerprint: a.tokenFingerprint,
        processor_params_hash: a.processorParamsHash, amount_cents: 50000, currency: 'CAD', status: 'claimed', stripe_payment_intent_id: null,
        seller_account_id: 'acct_synthetic', livemode: false, submitted_at: null };
      return { ...attempt, result: 'claimed', attempt_id: attempt.id };
    },
    markReceiptReconciliation: vi.fn(async () => {}),
    observePaymentIntent: vi.fn(async () => true),
    bindAttempt: async (_id, id, status) => { if (id) attempt.stripe_payment_intent_id = id; attempt.status = status;
      if (status === 'submitted') attempt.submitted_at ??= now.toISOString(); return true; },
    sendConfirmations: vi.fn(async () => true),
    claimPaid: vi.fn(async () => { paid = true; return true; }),
  };
  const stripe = { apiVersion: '2026-09-30.preview' as const, livemode: false, sellerAccountId: 'acct_synthetic',
    retrieveSharedPaymentToken: vi.fn(async () => token()), retrievePaymentIntent: vi.fn(async () => pi),
    createConfirmedPaymentIntent: vi.fn(async () => { expect(attempt.submitted_at).not.toBeNull(); return pi; }) };
  const complete = (caller: any = { payment }, customNow = now) => runNativeDepositComplete({ caller, childId: intent.child_id,
    actor: { userId: 'buyer', resumeCapability: null }, now: customNow, sellerAccountId: 'acct_synthetic', livemode: false, openStripe: () => stripe, io });
  return { io, stripe, complete, setApproval: (v: any) => { approval = v; }, attempt: () => attempt };
}
describe('native deposit boundary', () => {
  it('requires ownership, not public UUIDs', () => {
    expect(nativeDepositActorAuthorized({ savedQuoteUserId: 'buyer', savedQuoteResumeToken: 'dep_' + 'a'.repeat(24), actor: { userId: null, resumeCapability: null } })).toBe(false);
    expect(nativeDepositActorAuthorized({ savedQuoteUserId: null, savedQuoteResumeToken: 'dep_' + 'a'.repeat(24), actor: { userId: null, resumeCapability: 'dep_' + 'a'.repeat(24) } })).toBe(true);
  });
  it('preserves independent owner and resume capability authorization when both are supplied', () => {
    const cap = 'dep_' + 'a'.repeat(24);
    expect(nativeDepositActorAuthorized({ savedQuoteUserId: 'buyer', savedQuoteResumeToken: cap, actor: { userId: 'other', resumeCapability: cap } })).toBe(true);
    expect(nativeDepositActorAuthorized({ savedQuoteUserId: 'buyer', savedQuoteResumeToken: cap, actor: { userId: 'buyer', resumeCapability: 'invalid' } })).toBe(true);
    expect(nativeDepositActorAuthorized({ savedQuoteUserId: 'buyer', savedQuoteResumeToken: cap, actor: { userId: 'other', resumeCapability: 'invalid' } })).toBe(false);
  });
  it.each(['approved', 'amount', 'motor', 'buyer', 'document_path', 'client_secret'])('rejects caller %s before payment', async field => {
    const state = setup(); expect((await state.complete({ payment, [field]: true })).ok).toBe(false); expect(state.stripe.createConfirmedPaymentIntent).not.toHaveBeenCalled();
  });
  it('uses a selected owned-handler UCP instrument and the actual Stripe preview field', () => {
    expect(inspectNativeDepositCompleteCaller({ payment }).ok).toBe(true);
    expect(inspectNativeDepositCompleteCaller({ payment: { ...payment, approved: true } }).ok).toBe(false);
    const form = nativePaymentIntentForm({ amountCents: 50000, tokenId: 'spt_synthetic', intentId: intent.id, savedQuoteId: saved, motorId: motor, childId: intent.child_id });
    expect(form['payment_method_data[shared_payment_granted_token]']).toBe('spt_synthetic'); expect(form.shared_payment_granted_token).toBeUndefined();
  });
  it('projects only the deposit, with no token, buyer or fake Checkout identity', () => {
    const result = projectNativeDepositCheckout({ intent, phase: 'requires_escalation', paymentStatus: 'not_started' });
    expect(result.totals[0].amount).toBe(50000); expect(result.line_items[0].item.price).toBe(50000);
    expect(result.ucp).toHaveProperty('payment_handlers'); expect(result.continue_url).toContain('/quote/agent-deposit/');
    expect(JSON.stringify(result)).not.toMatch(/spt_synthetic|client_secret|dep_|cs_test_|email/);
  });
  it('never calls Stripe without durable approval or with changed document/catalog', async () => {
    const state = setup(); state.setApproval(null); expect((await state.complete()).ok).toBe(false);
    expect(state.stripe.retrieveSharedPaymentToken).not.toHaveBeenCalled(); expect(state.attempt()).toBeNull();
    state.setApproval({ ...intent, intent_id: intent.id }); state.io.loadDocumentHash = async () => 'b'.repeat(64);
    expect((await state.complete()).ok).toBe(false); expect(state.stripe.createConfirmedPaymentIntent).not.toHaveBeenCalled();
  });
  it('claims before submission, binds the real PI and never pays twice on replay', async () => {
    const state = setup(); const result = await state.complete(); expect(result.ok && result.checkout.payment_status).toBe('paid');
    expect(state.io.claimPaid).toHaveBeenCalledOnce(); expect(state.attempt().stripe_payment_intent_id).toBe('pi_synthetic');
    await state.complete({}); expect(state.stripe.createConfirmedPaymentIntent).toHaveBeenCalledOnce();
    expect(JSON.stringify(result)).not.toContain('not_public');
  });
  it('preserves unknown locks and retries the same token/key after token consumption and approval expiry', async () => {
    const state = setup(); const original = state.stripe.createConfirmedPaymentIntent.getMockImplementation()!;
    state.stripe.createConfirmedPaymentIntent.mockImplementationOnce(async () => { throw new NativeStripeRequestError(null, 'network'); });
    const first = await state.complete(); expect(first.ok && first.checkout.payment_status).toBe('unknown');
    state.stripe.createConfirmedPaymentIntent.mockImplementation(original);
    const second = await state.complete({ payment }, new Date('2026-10-12T14:00:00Z'));
    expect(second.ok && second.checkout.payment_status).toBe('paid'); expect(state.stripe.retrieveSharedPaymentToken).toHaveBeenCalledOnce();
    const calls = state.stripe.createConfirmedPaymentIntent.mock.calls; expect(calls[0]).toEqual(calls[1]);
  });
  it('keeps a different token and a lost database bind from claiming paid', async () => {
    const state = setup(); state.io.bindAttempt = async () => false;
    const result = await state.complete(); expect(result.ok).toBe(false); expect(state.stripe.createConfirmedPaymentIntent).not.toHaveBeenCalled();
    const other = structuredClone(payment); other.instruments[0].credential.token = 'spt_other';
    expect((await state.complete({ payment: other })).ok).toBe(false);
  });
  it('flags captured-but-unclaimed funds for operators without clearing success or recharging', async () => {
    const state = setup(); state.io.claimPaid = vi.fn(async () => false);
    const result = await state.complete(); expect(result.ok && result.checkout.payment_status).toBe('unknown');
    expect(state.io.markReceiptReconciliation).toHaveBeenCalledWith(intent.id,'attempt');
    expect(state.stripe.createConfirmedPaymentIntent).toHaveBeenCalledOnce();
  });
  it('reconciles a bound successful PI when a wallet supplies a regenerated token', async () => {
    const state = setup(); state.io.claimPaid = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await state.complete();
    const other = structuredClone(payment); other.instruments[0].credential.token = 'spt_regenerated';
    const replay = await state.complete({ payment: other });
    expect(replay.ok && replay.checkout.payment_status).toBe('paid');
    expect(state.stripe.createConfirmedPaymentIntent).toHaveBeenCalledOnce();
    expect(state.stripe.retrieveSharedPaymentToken).toHaveBeenCalledOnce();
    expect(state.stripe.retrievePaymentIntent).toHaveBeenCalledOnce();
  });
  it('retains a mismatched observed PI without promoting paid authority', async () => {
    const state = setup(); const wrong = await state.stripe.retrievePaymentIntent();
    state.stripe.createConfirmedPaymentIntent.mockResolvedValueOnce({ ...wrong, amount: 51000 });
    const result = await state.complete(); expect(result.ok && result.checkout.payment_status).toBe('unknown');
    expect(state.io.observePaymentIntent).toHaveBeenCalledWith('attempt','pi_synthetic');
    expect(state.attempt().stripe_payment_intent_id).toBeNull(); expect(state.io.claimPaid).not.toHaveBeenCalled();
  });
  it('keeps paid authority when email fails and re-drives the same receipt without another charge', async () => {
    const state = setup(); state.io.sendConfirmations = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const first = await state.complete(); expect(first.ok && first.checkout.payment_status).toBe('paid');
    expect(first.ok && first.checkout.receipt_email_status).toBe('pending');
    const replay = await state.complete({}); expect(replay.ok && replay.checkout.receipt_email_status).toBe('provider_accepted');
    expect(state.stripe.createConfirmedPaymentIntent).toHaveBeenCalledOnce(); expect(state.io.sendConfirmations).toHaveBeenCalledTimes(2);
  });
  it('rejects client account/mode drift before a durable attempt or charge', async () => {
    const state = setup(); state.stripe.sellerAccountId = 'acct_other';
    expect((await state.complete()).ok).toBe(false); expect(state.attempt()).toBeNull();
    expect(state.stripe.createConfirmedPaymentIntent).not.toHaveBeenCalled();
  });
  it('retains and validates a PaymentIntent returned with a processor decline', async () => {
    const state = setup(); const failedPi = await state.stripe.retrievePaymentIntent();
    state.stripe.createConfirmedPaymentIntent.mockImplementationOnce(async () => {
      throw new NativeStripeRequestError(402, 'card_declined', { ...failedPi, status: 'requires_payment_method', amount_received: 0 });
    });
    const result = await state.complete(); expect(result.ok && result.checkout.payment_status).toBe('failed');
    expect(state.attempt().stripe_payment_intent_id).toBe('pi_synthetic'); expect(state.io.claimPaid).not.toHaveBeenCalled();
  });
  it.each([
    { deactivated_at: 123 }, { deactivated_reason: 'consumed' }, { livemode: true },
    { usage_limits: { currency: 'usd', max_amount: 50000, expires_at: now.getTime()/1000+300 } },
    { usage_limits: { currency: 'cad', max_amount: 100000, expires_at: now.getTime()/1000+300 } },
    { usage_limits: { currency: 'cad', max_amount: 50000, expires_at: now.getTime()/1000-1 } },
    { usage_limits: { currency: 'cad', max_amount: 50000, expires_at: now.getTime()/1000+7200 } },
    { usage_details: { amount_captured: 1 } },
  ])('rejects unusable preview tokens %j', changes => expect(assessSharedPaymentToken({ ...token(), ...changes }, expected).ok).toBe(false));
  it('accepts Stripe preview nullable uncaptured amount while rejecting missing counters', () => {
    expect(assessSharedPaymentToken({ ...token(), usage_details: { amount_captured: null } }, expected).ok).toBe(true);
    expect(assessSharedPaymentToken({ ...token(), usage_details: {} }, expected).ok).toBe(false);
  });
  it('accepts the checked preview schema without confusing the agent identity with seller scope', () => expect(assessSharedPaymentToken(token(), expected).ok).toBe(true));
  it('checks the credential account before token reads or payment calls', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 'acct_other' }), { status: 200 }));
    const stripe = createNativeStripePreviewClient({ secretKey: 'sk_test_synthetic_only', sellerAccountId: 'acct_synthetic', fetchImpl });
    await expect(stripe.retrieveSharedPaymentToken('spt_synthetic')).rejects.toThrow('native_seller_mismatch'); expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
