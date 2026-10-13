import { assessNativePaymentIntent, NATIVE_DEPOSIT_CHANNEL } from './native-deposit-checkout.ts';
import { nativeDepositIo } from './native-deposit-io.ts';
import { createNativeStripePreviewClient } from './native-stripe-preview.ts';
import { deliveriesIndicateFailure } from './deposit-email-deliveries.ts';

// Invoked only after the parent endpoint verifies Stripe's signature. Rollback
// disables new checkouts, but never abandons existing submitted attempts.
export async function handleNativeDepositEvent(db: any, event: any, env: { secretKey: string; sellerAccountId: string }): Promise<boolean> {
  if (!event.type?.startsWith('payment_intent.') || event.data?.object?.metadata?.payment_channel !== NATIVE_DEPOSIT_CHANNEL) return false;
  const metadata = event.data.object.metadata;
  const io = nativeDepositIo(db);
  const intent = await io.loadIntentByChild(metadata.native_child_id || '');
  if (!intent || intent.id !== metadata.native_intent_id) throw new Error('native_event_binding');
  const attempt = await io.loadAttempt(intent.id);
  if (!attempt?.submitted_at || attempt.seller_account_id !== env.sellerAccountId) throw new Error('native_event_attempt');
  const piId = event.data.object.id;
  const requestKey = typeof event.request === 'object' ? event.request?.idempotency_key : null;
  if (attempt.stripe_payment_intent_id ? attempt.stripe_payment_intent_id !== piId : requestKey !== attempt.idempotency_key)
    throw new Error('native_event_attempt');
  const stripe = createNativeStripePreviewClient(env);
  if (stripe.livemode !== attempt.livemode || event.livemode !== attempt.livemode) throw new Error('native_event_mode');
  const pi = await stripe.retrievePaymentIntent(piId);
  const assessed = assessNativePaymentIntent(pi, { amountCents: intent.amount_cents, intentId: intent.id,
    savedQuoteId: intent.saved_quote_id, motorId: intent.motor_id, childId: intent.child_id, livemode: attempt.livemode });
  if (!assessed.ok) throw new Error('native_event_binding');
  if (assessed.status !== 'succeeded') {
    const status = assessed.status === 'processing' ? 'processing' : assessed.status === 'requires_action' ? 'requires_action'
      : ['canceled', 'requires_payment_method'].includes(assessed.status) ? 'failed' : 'unknown';
    if (!await io.bindAttempt(attempt.id, assessed.id, status)) throw new Error('native_event_bind');
    return true;
  }
  if ((pi as any).amount_received !== intent.amount_cents) throw new Error('native_event_amount');
  if (!await io.bindAttempt(attempt.id, assessed.id, 'succeeded')) throw new Error('native_event_bind');
  if (!await io.claimPaid({ intent, attemptId: attempt.id, paymentIntentId: assessed.id,
    notificationEventId: event.id, paidAt: new Date().toISOString() })) throw new Error('native_event_claim');
  // Existing three-audience outbox owns idempotency, frozen contact and PDF.
  const { data, error } = await db.functions.invoke('send-deposit-confirmation-email', {
    body: { savedQuoteId: intent.saved_quote_id, nativePaymentIntentId: assessed.id },
  });
  if (error || data?.success !== true || deliveriesIndicateFailure(data?.deliveries)) throw new Error('native_notification_pending');
  return true;
}
