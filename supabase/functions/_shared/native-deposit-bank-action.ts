import { assessNativePaymentIntent, type NativeIntentRecord, type NativeAttemptRecord, type NativeApprovalRecord } from './native-deposit-checkout.ts';

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

// Initial consent limits the first POST, not buyer verification of that same
// submitted PI. Never authorize a replacement or an unsubmitted bank action.
export function nativeDepositBankRecoveryAllowed(intent: NativeIntentRecord, attempt: NativeAttemptRecord | null, approval: NativeApprovalRecord | null): boolean {
  return !intent.retired_at && intent.status !== 'paid' && Boolean(attempt?.submitted_at && attempt.stripe_payment_intent_id
    && attempt.intent_id === intent.id && approval?.intent_id === intent.id && approval.child_id === intent.child_id
    && approval.saved_quote_id === intent.saved_quote_id && approval.motor_id === intent.motor_id
    && approval.amount_cents === intent.amount_cents && approval.currency === intent.currency
    && approval.document_sha256 === intent.document_sha256 && approval.terms_version === intent.terms_version
    && approval.policy_version === intent.policy_version && approval.policy_code === intent.policy_code);
}
