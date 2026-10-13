import { describe, expect, it } from 'vitest';
import { nativeSellerProfileId, withNativeSellerProfile } from '../../../supabase/functions/_shared/native-deposit-seller-profile';
import { projectNativeDepositCheckout, NATIVE_DEPOSIT_HANDLER_ID, type NativeIntentRecord } from '../../../supabase/functions/_shared/native-deposit-checkout';

function checkout() {
  const intent: NativeIntentRecord = {
    id: '71717171-7171-4171-8171-717171717171', child_id: 'ndc_' + 'a'.repeat(32),
    parent_session_id: 'chk_synthetic', saved_quote_id: '71717171-7171-4171-8171-717171717171',
    owner_user_id: 'synthetic-buyer', motor_id: '36363636-3636-4636-8636-363636363636',
    amount_cents: 50000, currency: 'CAD', merchandise_cents: 1400000,
    document_sha256: 'a'.repeat(64), document_path: 'saved-quotes/71717171-7171-4171-8171-717171717171/quote.pdf',
    policy_version: 'deposit-policy/v1', policy_code: 'in_stock_refundable',
    terms_version: 'hbw-reservation-terms/2026-04-08', catalog_model_number: '90ELPT',
    horsepower: 90, express_verified: false, status: 'awaiting_buyer', expires_at: '2026-10-13T18:00:00Z',
  };
  return projectNativeDepositCheckout({ intent, phase: 'ready_for_complete', paymentStatus: 'not_started' });
}

describe('seller profile for issuer wallets', () => {
  it('supplies the documented Stripe issuer network identity while preserving buyer authority', () => {
    const original = checkout(); const before = JSON.stringify(original);
    const result = withNativeSellerProfile(original, { profileId: 'profile_SyntheticMerchant', livemode: true, enabled: true, verified: true, nowMs: Date.parse('2026-10-13T12:00:00Z') });
    const handlers = result.ucp.payment_handlers as any;
    expect(handlers[NATIVE_DEPOSIT_HANDLER_ID][0].config.seller_details).toEqual({ network_business_profile: 'profile_SyntheticMerchant' });
    expect(handlers[NATIVE_DEPOSIT_HANDLER_ID][0].config.bank_verification_owner).toBe('wallet');
    expect(result.payment_handler.status).toBe('configured');
    expect(result.status).toBe('ready_for_complete');
    expect(result.trusted_buyer_ui).toBe('required');
    expect(result.payment_status).toBe('not_started');
    expect(result.totals).toEqual(original.totals);
    expect(result.links).toEqual(original.links);
    expect(JSON.stringify(original)).toBe(before);
    expect(JSON.stringify(result)).not.toMatch(/document_path|owner_user_id|client_secret|resume_token/);
  });
  it('does not claim an active handler when new native payments are paused', () => {
    const result = withNativeSellerProfile(checkout(), { profileId: 'profile_SyntheticMerchant', livemode: true, enabled: false, verified: true, nowMs: Date.parse('2026-10-13T12:00:00Z') });
    expect(result.payment_handler.status).toBe('staged');
    expect(result.status).toBe('ready_for_complete');
  });
  it('keeps test profiles out of live checkout and live profiles out of test checkout', () => {
    expect(nativeSellerProfileId('profile_test_Synthetic', true)).toBeNull();
    expect(nativeSellerProfileId('profile_Synthetic', false)).toBeNull();
    expect(nativeSellerProfileId('profile_test_Synthetic', false)).toBe('profile_test_Synthetic');
  });
  it.each([undefined, null, {}, '', 'profile_', 'profile_abc/foreign', 'profile_abc?key=x', 'https://stripe.com/@other', 'profile_abc_xyz', 'profile_' + 'a'.repeat(161)])('refuses malformed live profile %j', value => {
    const original = checkout();
    expect(nativeSellerProfileId(value, true)).toBeNull();
    expect(withNativeSellerProfile(original, { profileId: value, livemode: true, enabled: true, verified: true, nowMs: Date.parse('2026-10-13T12:00:00Z') })).toBe(original);
  });
  it.each(['requires_escalation', 'complete_in_progress', 'completed', 'canceled'] as const)('omits issuer identity for phase %s', phase => {
    const original = checkout(); original.status = phase;
    expect(withNativeSellerProfile(original, { profileId: 'profile_Synthetic', livemode: true, enabled: true, verified: true, nowMs: Date.parse('2026-10-13T12:00:00Z') })).toBe(original);
  });
  it.each(['requires_action', 'processing', 'failed', 'unknown', 'expired', 'revoked', 'paid'] as const)('omits new wallet guidance for payment %s', state => {
    const original = checkout(); original.payment_status = state;
    expect(withNativeSellerProfile(original, { profileId: 'profile_Synthetic', livemode: true, enabled: true, verified: true, nowMs: Date.parse('2026-10-13T12:00:00Z') })).toBe(original);
  });
  it('omits identity for expired checkout or missing controller verification', () => {
    const original = checkout();
    expect(withNativeSellerProfile(original, { profileId: 'profile_Synthetic', livemode: true, enabled: true, verified: true, nowMs: Date.parse(original.expires_at) })).toBe(original);
    expect(withNativeSellerProfile(original, { profileId: 'profile_Synthetic', livemode: true, enabled: true, verified: false, nowMs: Date.parse('2026-10-13T12:00:00Z') })).toBe(original);
  });
  it('normalizes only whitespace around a configured identifier', () => {
    expect(nativeSellerProfileId(' profile_Synthetic \n', true)).toBe('profile_Synthetic');
  });
  it('refuses to attach merchant details to an unrecognized checkout handler', () => {
    const original = checkout(); original.ucp.payment_handlers = {};
    expect(() => withNativeSellerProfile(original, { profileId: 'profile_Synthetic', livemode: true, enabled: true, verified: true, nowMs: Date.parse('2026-10-13T12:00:00Z') })).toThrow('native_payment_handler_missing');
  });
});
