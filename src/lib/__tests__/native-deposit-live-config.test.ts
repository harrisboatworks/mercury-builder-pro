import { describe, expect, it } from 'vitest';
import { nativeLiveSellerVerified } from '../../../supabase/functions/_shared/native-deposit-live-config';

async function digest(value: string) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(v => v.toString(16).padStart(2, '0')).join('');
}
async function config() {
  const env = { SUPABASE_URL: 'https://eutsoqdpjurknjsshxes.supabase.co', STRIPE_SECRET_KEY: 'sk_live_fixture-not-a-key',
    STRIPE_WEBHOOK_SECRET: 'whsec_fixture-not-a-secret', NATIVE_STRIPE_SELLER_ACCOUNT: 'acct_Synthetic',
    NATIVE_STRIPE_SELLER_PROFILE: 'profile_Synthetic', NATIVE_STRIPE_WEBHOOK_ID: 'we_Synthetic', NATIVE_DEPOSIT_LIVE_ATTESTATION: '' };
  const proof = { account_id: env.NATIVE_STRIPE_SELLER_ACCOUNT, profile_id: env.NATIVE_STRIPE_SELLER_PROFILE,
    api_version: '2026-09-30.preview', spt_access_verified: true, signed_callback_verified: true,
    callback_event_id: 'evt_Synthetic', terms_accepted_at: '2026-01-01T00:00:00Z', verified_at: '2026-01-01T00:00:00Z',
    webhook_id: 'we_Synthetic', charges_enabled: true, native_webhook_verified: true,
    key_sha256: await digest(env.STRIPE_SECRET_KEY), signing_sha256: await digest(env.STRIPE_WEBHOOK_SECRET) };
  env.NATIVE_DEPOSIT_LIVE_ATTESTATION = JSON.stringify(proof);
  return { env, proof };
}
describe('controller native activation proof', () => {
  it('accepts only the current account/profile/key/signing binding', async () => {
    const { env } = await config(); expect(await nativeLiveSellerVerified(env)).toBe(true);
  });
  it.each(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NATIVE_STRIPE_SELLER_ACCOUNT', 'NATIVE_STRIPE_SELLER_PROFILE', 'NATIVE_STRIPE_WEBHOOK_ID'])('rejects drift in %s', async field => {
    const { env } = await config(); env[field] += 'Changed'; expect(await nativeLiveSellerVerified(env)).toBe(false);
  });
  it.each(['account_id', 'profile_id', 'api_version', 'key_sha256', 'signing_sha256', 'callback_event_id'])('rejects incorrect proof field %s', async field => {
    const { env, proof } = await config(); proof[field] = 'incorrect'; env.NATIVE_DEPOSIT_LIVE_ATTESTATION = JSON.stringify(proof);
    expect(await nativeLiveSellerVerified(env)).toBe(false);
  });
  it.each(['spt_access_verified', 'signed_callback_verified', 'charges_enabled', 'native_webhook_verified'])('requires completed %s evidence', async field => {
    const { env, proof } = await config(); proof[field] = false; env.NATIVE_DEPOSIT_LIVE_ATTESTATION = JSON.stringify(proof);
    expect(await nativeLiveSellerVerified(env)).toBe(false);
  });
  it.each(['terms_accepted_at', 'verified_at'])('rejects missing or future %s', async field => {
    const { env, proof } = await config(); proof[field] = '9999-01-01T00:00:00Z'; env.NATIVE_DEPOSIT_LIVE_ATTESTATION = JSON.stringify(proof);
    expect(await nativeLiveSellerVerified(env)).toBe(false); delete proof[field]; env.NATIVE_DEPOSIT_LIVE_ATTESTATION = JSON.stringify(proof);
    expect(await nativeLiveSellerVerified(env)).toBe(false);
  });
  it.each(['', 'null', '[]', '{broken'])('refuses absent or malformed evidence %j', async raw => {
    const { env } = await config(); env.NATIVE_DEPOSIT_LIVE_ATTESTATION = raw; expect(await nativeLiveSellerVerified(env)).toBe(false);
  });
  it('rejects a test key or another project despite matching-looking metadata', async () => {
    const { env, proof } = await config(); env.STRIPE_SECRET_KEY = 'sk_test_fixture-not-a-key'; proof.key_sha256 = await digest(env.STRIPE_SECRET_KEY);
    env.NATIVE_DEPOSIT_LIVE_ATTESTATION = JSON.stringify(proof); expect(await nativeLiveSellerVerified(env)).toBe(false);
    const live = await config(); live.env.SUPABASE_URL = 'https://isolated.example.invalid'; expect(await nativeLiveSellerVerified(live.env)).toBe(false);
  });
});
