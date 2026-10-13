export const NATIVE_LIVE_WEBHOOK_URL = 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/stripe-webhook';
export const NATIVE_LIVE_WEBHOOK_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'payment_intent.succeeded',
  'payment_intent.processing', 'payment_intent.payment_failed', 'payment_intent.canceled', 'payment_intent.requires_action'] as const;

// Preserve the existing Checkout version. Native callbacks use only signed
// identity/metadata, then retrieve authoritative PI state with the preview
// client; no new preview fields are taken from the legacy event object.
export function nativeLiveWebhookReady(hook: any, expectedId?: string): boolean {
  return !!hook && /^we_[A-Za-z0-9]+$/.test(hook.id) && (!expectedId || hook.id === expectedId)
    && hook.url === NATIVE_LIVE_WEBHOOK_URL && hook.status === 'enabled' && hook.livemode === true
    && hook.api_version === '2022-11-15' && Array.isArray(hook.enabled_events)
    && hook.enabled_events.every((s: unknown) => typeof s === 'string' && /^(\*|[a-z0-9_.]+)$/.test(s))
    && (hook.enabled_events.includes('*') || NATIVE_LIVE_WEBHOOK_EVENTS.every(e => hook.enabled_events.includes(e)));
}
