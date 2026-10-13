// Temporary, server-only verifier. All upstream calls are GET; no payments,
// database writes, customer notifications or credential exports are possible.
import { nativeLiveWebhookReady } from '../../../supabase/functions/_shared/native-stripe-live-webhook.ts';
type Env = Record<string, string | undefined>;
const PROJECT = 'https://eutsoqdpjurknjsshxes.supabase.co';
const VERSION = '2026-09-30.preview';
const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const CODES = new Set(['resource_missing', 'api_key_expired', 'invalid_api_key', 'permission_denied', 'account_invalid', 'rate_limit']);
const NOOP_EVENTS = new Set(['payment_intent.succeeded', 'payment_intent.created', 'charge.succeeded',
  'customer.created', 'customer.updated', 'account.updated', 'product.created', 'product.updated', 'price.created']);
class Refusal extends Error { constructor(public status: number, public code: string) { super(code); } }
async function hash(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}
function hex(bytes: Uint8Array): string { return [...bytes].map(v => v.toString(16).padStart(2, '0')).join(''); }
async function sameTokenHash(token: string, expected: string): Promise<boolean> {
  const actual = hex(await hash(token)); let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}
async function jsonBody(body: ReadableStream<Uint8Array> | null, maximum: number): Promise<any> {
  if (!body) throw new Refusal(400, 'invalid_json');
  const reader = body.getReader(); const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      length += part.value.length; if (length > maximum) throw new Refusal(413, 'body_too_large');
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) { if (e instanceof Refusal) throw e; throw new Refusal(400, 'invalid_json'); }
  finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}
export function createNativeStripeLivePreflight(env: Env, fetchImpl: typeof fetch = fetch) {
  return async (req: Request): Promise<Response> => {
    const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
    try {
      const token = req.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
      // Management returns a fresh service-role JWT which may differ from the
      // injected legacy JWT. Pin its digest only; gateway JWT stays enabled.
      if (!token || !/^[0-9a-f]{64}$/.test(env.NATIVE_PREFLIGHT_OPERATOR_SHA256 || '')
        || !await sameTokenHash(token, env.NATIVE_PREFLIGHT_OPERATOR_SHA256!))
        throw new Refusal(401, 'unauthorized');
      if (req.method !== 'POST' || req.headers.has('origin') || !req.headers.get('content-type')?.startsWith('application/json'))
        throw new Refusal(405, 'server_post_only');
      if (env.SUPABASE_URL !== PROJECT || env.NATIVE_DEPOSIT_ENABLED !== 'false') throw new Refusal(403, 'paused_production_only');
      const key = env.STRIPE_SECRET_KEY?.trim() || '';
      if (!key.startsWith('sk_live_') || key.length < 16 || !env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_'))
        throw new Refusal(403, 'live_credentials_required');
      const input = await jsonBody(req.body, 2048);
      if (!input || Array.isArray(input) || typeof input !== 'object'
        || Object.keys(input).sort().join(',') !== 'expected_account,operation'
        || !['account', 'webhooks', 'event_candidate', 'spt_access'].includes(input.operation)
        || typeof input.expected_account !== 'string' || !/^acct_[A-Za-z0-9]{1,64}$/.test(input.expected_account))
        throw new Refusal(400, 'invalid_operation');
      async function stripe(path: string) {
        // Paths below are fixed or contain a newly generated synthetic token.
        const response = await fetchImpl('https://api.stripe.com' + path, { method: 'GET', redirect: 'error',
          signal: AbortSignal.timeout(8000), headers: { Authorization: `Bearer ${key}`, 'Stripe-Version': VERSION } });
        const data = await jsonBody(response.body, 524288);
        return { status: response.status, ok: response.ok, data };
      }
      const account = await stripe('/v1/account');
      if (!account.ok) throw new Refusal(502, 'stripe_account_unavailable');
      if (account.data.id !== input.expected_account || account.data.charges_enabled !== true)
        throw new Refusal(409, 'merchant_account_not_ready');
      const base = { account_id: input.expected_account, livemode: true, api_version: VERSION };
      if (input.operation === 'account') return reply({ ...base, charges_enabled: true,
        country: /^[A-Z]{2}$/.test(account.data.country) ? account.data.country : null,
        key_sha256: hex(await hash(key)), signing_sha256: hex(await hash(env.STRIPE_WEBHOOK_SECRET!)) });
      if (input.operation === 'webhooks') {
        const result = await stripe('/v1/webhook_endpoints?limit=100');
        if (!result.ok || !Array.isArray(result.data.data) || result.data.has_more !== false) throw new Refusal(502, 'webhooks_unavailable');
        const matches = result.data.data.filter((x: any) => x.url === PROJECT + '/functions/v1/stripe-webhook');
        const hook = matches[0];
        if (matches.length !== 1 || !nativeLiveWebhookReady(hook))
          throw new Refusal(409, 'owned_webhook_not_ready');
        return reply({ ...base, webhook: { id: hook.id, url: hook.url, status: hook.status,
          livemode: true, api_version: hook.api_version, enabled_events: hook.enabled_events } });
      }
      if (input.operation === 'event_candidate') {
        const result = await stripe('/v1/events?limit=10');
        if (!result.ok || !Array.isArray(result.data.data)) throw new Refusal(502, 'events_unavailable');
        const event = result.data.data.slice(0, 10).find((e: any) => e.livemode === true && NOOP_EVENTS.has(e.type)
          && /^evt_[A-Za-z0-9]+$/.test(e.id) && e.data?.object && typeof e.data.object === 'object'
          && e.data.object.metadata?.payment_channel !== 'native_spt' && e.data.object.metadata?.payment_type !== 'motor_deposit'
          && Number.isInteger(e.created));
        if (!event) throw new Refusal(404, 'no_safe_event');
        return reply({ ...base, event: { id: event.id, type: event.type, created: event.created, native: false } });
      }
      if (env.NATIVE_PREFLIGHT_SPT_APPROVED !== '1') throw new Refusal(403, 'live_terms_approval_required');
      const synthetic = 'spt_MercuryLiveProbe' + crypto.randomUUID().replace(/-/g, '');
      const result = await stripe('/v1/shared_payment/granted_tokens/' + synthetic);
      const error = result.data?.error;
      if (result.status === 404 && error?.type === 'invalid_request_error' && error.code === 'resource_missing')
        return reply({ ...base, spt_lookup_access: true, processor_status: 404, processor_code: 'resource_missing', charged: false });
      return reply({ ...base, spt_lookup_access: false, processor_status: result.status,
        processor_code: CODES.has(error?.code) ? error.code : 'stripe_error', charged: false }, 502);
    } catch (e) {
      return reply({ error: e instanceof Refusal ? e.code : 'upstream_failure' }, e instanceof Refusal ? e.status : 502);
    }
  };
}
