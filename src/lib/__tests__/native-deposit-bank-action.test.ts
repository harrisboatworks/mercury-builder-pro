import { describe, expect, it } from 'vitest';
import { nativeDepositBankAction } from '../../../supabase/functions/_shared/native-deposit-bank-action';

const expected = {
  amountCents: 50000,
  intentId: '71717171-7171-4171-8171-717171717171',
  savedQuoteId: '72727272-7272-4272-8272-727272727272',
  motorId: '36363636-3636-4636-8636-363636363636',
  childId: 'ndc_' + 'a'.repeat(32),
  livemode: false,
};
function paymentIntent() {
  return {
    id: 'pi_syntheticBankAction',
    livemode: false,
    amount: 50000,
    amount_received: 0,
    currency: 'cad',
    status: 'requires_action',
    client_secret: 'pi_synthetic_secret_not_public',
    metadata: {
      payment_channel: 'native_spt',
      payment_type: 'motor_deposit',
      native_intent_id: expected.intentId,
      native_child_id: expected.childId,
      saved_quote_id: expected.savedQuoteId,
      motor_id: expected.motorId,
      deposit_amount: '500',
    },
    next_action: { type: 'shared_payment_token_action', shared_payment_token_action: {} },
  };
}

describe('native deposit bank action wallet handoff', () => {
  it('projects the bound native shared-token bank action as a safe wallet handoff', () => {
    const action = nativeDepositBankAction(paymentIntent(), expected);
    expect(action).toEqual({
      payment_status: 'requires_action',
      verification_owner: 'wallet',
      message: 'Finish bank verification in the wallet that approved this deposit, then refresh the existing payment.',
    });
  });

  it('never projects processor secrets, token actions, metadata or identities from the payment object', () => {
    const pi = {
      ...paymentIntent(),
      customer: 'cus_synthetic_buyer',
      payment_method: 'pm_synthetic_card',
      next_action: {
        type: 'shared_payment_token_action',
        shared_payment_token_action: { token: 'spt_synthetic_private', private_url: 'https://example.invalid/private-wallet' },
        use_stripe_sdk: { value: 'synthetic_issuer_hashed_action' },
      },
    };
    const action = nativeDepositBankAction(pi, expected);
    expect(action).not.toBeNull();
    expect(Object.keys(action!)).toEqual(['payment_status', 'verification_owner', 'message']);
    expect(JSON.stringify(action)).not.toMatch(/pi_synthetic|cus_synthetic|pm_synthetic|spt_synthetic|private-wallet|hashed_action|client_secret|native_child_id|saved_quote_id/);
  });

  it.each([
    ['Checkout session identity', { id: 'cs_test_synthetic' }],
    ['different amount', { amount: 100000 }],
    ['different currency', { currency: 'usd' }],
    ['different mode', { livemode: true }],
  ] as const)('rejects %s', (_name, changed) => {
    expect(nativeDepositBankAction({ ...paymentIntent(), ...changed }, expected)).toBeNull();
  });

  it.each([
    ['payment_channel', 'hosted'],
    ['payment_type', 'final_sale'],
    ['native_intent_id', '73737373-7373-4373-8373-737373737373'],
    ['native_child_id', 'ndc_' + 'b'.repeat(32)],
    ['saved_quote_id', '74747474-7474-4474-8474-747474747474'],
    ['motor_id', '45454545-4545-4545-8545-454545454545'],
    ['deposit_amount', '1000'],
  ])('rejects a mismatched %s binding', (field, changed) => {
    const pi = paymentIntent();
    expect(nativeDepositBankAction({ ...pi, metadata: { ...pi.metadata, [field]: changed } }, expected)).toBeNull();
  });

  it.each(['succeeded', 'processing', 'requires_payment_method', 'requires_confirmation', 'requires_capture', 'canceled', 'unknown'])('rejects payment status %s', status => {
    expect(nativeDepositBankAction({ ...paymentIntent(), status, amount_received: status === 'succeeded' ? 50000 : 0 }, expected)).toBeNull();
  });

  it.each([undefined, null, {}, { type: 'use_stripe_sdk', use_stripe_sdk: { value: 'synthetic_merchant_action' } }, { type: 'redirect_to_url', redirect_to_url: { url: 'https://example.invalid/' } }])('rejects an absent or non-wallet action %j', next_action => {
    expect(nativeDepositBankAction({ ...paymentIntent(), next_action }, expected)).toBeNull();
  });

  it.each([null, {}, { ...paymentIntent(), metadata: null }])('rejects an incomplete payment binding %j', value => {
    expect(nativeDepositBankAction(value, expected)).toBeNull();
  });
});
