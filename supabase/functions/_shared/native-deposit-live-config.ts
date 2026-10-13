import { nativeSellerProfileId } from './native-deposit-seller-profile.ts';
import { NATIVE_STRIPE_API_VERSION } from './native-stripe-preview.ts';

export type NativeLiveConfigEnv = Record<string, string | undefined>;
async function sha256(value: string): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(v => v.toString(16).padStart(2, '0')).join('');
}

// Controller records this only after Stripe account access, the profile owner,
// live SPT terms/access and an actual signed no-op callback are verified. It is
// deployment evidence in trusted server env, never a caller approval field.
// Binding to current key/signing hashes catches accidental rotation/drift.
export async function nativeLiveSellerVerified(env: NativeLiveConfigEnv): Promise<boolean> {
  if (env.SUPABASE_URL !== 'https://eutsoqdpjurknjsshxes.supabase.co') return false;
  const key = env.STRIPE_SECRET_KEY?.trim() || '';
  const signing = env.STRIPE_WEBHOOK_SECRET || '';
  const profile = nativeSellerProfileId(env.NATIVE_STRIPE_SELLER_PROFILE, true);
  const account = env.NATIVE_STRIPE_SELLER_ACCOUNT || '';
  if (!key.startsWith('sk_live_') || key.length < 16 || !signing.startsWith('whsec_')
    || !profile || !/^acct_[A-Za-z0-9]+$/.test(account)) return false;
  try {
    const proof = JSON.parse(env.NATIVE_DEPOSIT_LIVE_ATTESTATION || 'null');
    if (!proof || Array.isArray(proof) || typeof proof !== 'object'
      || proof.account_id !== account || proof.profile_id !== profile
      || proof.api_version !== NATIVE_STRIPE_API_VERSION
      || proof.spt_access_verified !== true || proof.signed_callback_verified !== true
      || !/^evt_[A-Za-z0-9]+$/.test(proof.callback_event_id || '')
      || !Number.isFinite(Date.parse(proof.terms_accepted_at))
      || Date.parse(proof.terms_accepted_at) > Date.now()
      || !Number.isFinite(Date.parse(proof.verified_at)) || Date.parse(proof.verified_at) > Date.now()
      || !/^[0-9a-f]{64}$/.test(proof.key_sha256 || '')
      || !/^[0-9a-f]{64}$/.test(proof.signing_sha256 || '')) return false;
    return proof.key_sha256 === await sha256(key) && proof.signing_sha256 === await sha256(signing);
  } catch { return false; }
}
