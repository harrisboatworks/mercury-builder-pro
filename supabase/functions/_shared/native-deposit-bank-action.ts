import { assessNativePaymentIntent } from './native-deposit-checkout.ts';

// Shared Payment Token bank actions belong to the issuing wallet. The seller
// must not return a merchant PI secret or fetch another party's issued token.
export function nativeDepositBankAction(
  pi: unknown,
  expected: Parameters<typeof assessNativePaymentIntent>[1],
): { payment_status: 'requires_action'; verification_owner: 'wallet'; message: string } | null {
  const assessed = assessNativePaymentIntent(pi, expected);
  if (!assessed.ok || assessed.status !== 'requires_action') return null;
  const action = (pi as { next_action?: { type?: string } }).next_action;
  if (action?.type !== 'shared_payment_token_action') return null;
  return {
    payment_status: 'requires_action', verification_owner: 'wallet',
    message: 'Finish bank verification in the wallet that approved this deposit, then refresh the existing payment.',
  };
}
