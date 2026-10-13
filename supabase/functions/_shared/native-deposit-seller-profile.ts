import { NATIVE_DEPOSIT_HANDLER_ID, type NativeDepositCheckout } from './native-deposit-checkout.ts';

// Public merchant network identity for issuer wallets. Never accepts a buyer
// token, account credential or caller-selected seller; the route supplies env.
export function nativeSellerProfileId(value: unknown, livemode: boolean): string | null {
  if (typeof value !== 'string') return null;
  const id = value.trim();
  const pattern = livemode ? /^profile_(?!test_)[A-Za-z0-9]{1,160}$/ : /^profile_test_[A-Za-z0-9]{1,160}$/;
  return pattern.test(id) ? id : null;
}

export function withNativeSellerProfile(checkout: NativeDepositCheckout, options: {
  profileId: unknown; livemode: boolean; enabled: boolean; verified: boolean; nowMs?: number;
}): NativeDepositCheckout {
  // This is issuer guidance for a new approved payment, not authority to pay.
  // Submitted/terminal/paused/expired checkouts retain their original attempt.
  if (!options.enabled || !options.verified || checkout.status !== 'ready_for_complete'
    || checkout.payment_status !== 'not_started'
    || !(Date.parse(checkout.expires_at) > (options.nowMs ?? Date.now()))) return checkout;
  const profile = nativeSellerProfileId(options.profileId, options.livemode);
  if (!profile) return checkout;
  const handlers = checkout.ucp.payment_handlers as Record<string, Array<{ config: Record<string, unknown> }>>;
  const entries = handlers?.[NATIVE_DEPOSIT_HANDLER_ID];
  if (!Array.isArray(entries) || entries.length !== 1 || !entries[0]?.config) {
    throw new Error('native_payment_handler_missing');
  }
  return {
    ...checkout,
    payment_handler: { ...checkout.payment_handler, status: 'configured' },
    ucp: { ...checkout.ucp, payment_handlers: { ...handlers, [NATIVE_DEPOSIT_HANDLER_ID]: [{
      ...entries[0], config: { ...entries[0].config, seller_details: { network_business_profile: profile } },
    }] } },
  };
}
