import { describe, expect, it, vi } from 'vitest';
import { createNativeStripeLivePreflight } from '../../../scripts/operations/native-stripe-live-preflight/handler';
import { NATIVE_LIVE_WEBHOOK_EVENTS } from '../../../supabase/functions/_shared/native-stripe-live-webhook';

const project = 'https://eutsoqdpjurknjsshxes.supabase.co';
const env = { SUPABASE_URL: project, SUPABASE_SERVICE_ROLE_KEY: 'operator-fixture', NATIVE_DEPOSIT_ENABLED: 'false',
  STRIPE_SECRET_KEY: 'sk_live_fixture-not-a-key', STRIPE_WEBHOOK_SECRET: 'whsec_fixture-not-a-secret', NATIVE_PREFLIGHT_SPT_APPROVED: '1' };
const account = { id: 'acct_Synthetic', charges_enabled: true, country: 'CA', email: 'private@example.invalid' };
const hook = { id: 'we_Synthetic', url: project + '/functions/v1/stripe-webhook', status: 'enabled', livemode: true,
  api_version: '2022-11-15', enabled_events: [...NATIVE_LIVE_WEBHOOK_EVENTS], secret: 'private-secret' };
const event = { id: 'evt_Synthetic', type: 'payment_intent.succeeded', livemode: true, created: 123,
  data: { object: { object: 'payment_intent', metadata: {}, customer: 'private-customer' } } };
function request(operation = 'account', extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  return new Request('https://function.example.invalid', { method: 'POST', headers: { Authorization: 'Bearer operator-fixture',
    'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ operation, expected_account: account.id, ...extra }) });
}
function setup(replies: Array<{ body: unknown; status?: number }> = [{ body: account }], config = env) {
  const fetcher = vi.fn(async (_url: string | URL | Request, _options?: RequestInit) => { const next = replies.shift(); if (!next) throw Error('unexpected request');
    return new Response(JSON.stringify(next.body), { status: next.status || 200 }); });
  return { fetcher, run: createNativeStripeLivePreflight(config, fetcher as typeof fetch) };
}
describe('read-only live Stripe server preflight', () => {
  it('requires exact operator authentication before upstream work', async () => {
    const { run, fetcher } = setup(); const response = await run(request('account', {}, { Authorization: 'Bearer other-fixture' }));
    expect(response.status).toBe(401); expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([{ SUPABASE_URL: 'https://wrong.example.invalid' }, { NATIVE_DEPOSIT_ENABLED: 'true' },
    { STRIPE_SECRET_KEY: 'sk_test_fixture-not-a-key' }, { STRIPE_WEBHOOK_SECRET: '' }])('rejects unsafe deployment configuration %j', async change => {
    const { run, fetcher } = setup([], { ...env, ...change }); expect((await run(request())).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('refuses browser requests, unknown operations and caller supplied token fields', async () => {
    const { run, fetcher } = setup(); expect((await run(request('account', {}, { Origin: 'https://browser.example.invalid' }))).status).toBe(405);
    expect((await run(request('charge'))).status).toBe(400); expect((await run(request('spt_access', { token: 'spt_Caller' }))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('bounds caller input and fails closed on invalid JSON', async () => {
    const { run, fetcher } = setup(); expect((await run(request('account', { padding: 'x'.repeat(3000) }))).status).toBe(413);
    const req = new Request('https://function.example.invalid', { method: 'POST', headers: { Authorization: 'Bearer operator-fixture',
      'Content-Type': 'application/json' }, body: '{broken' }); expect((await run(req)).status).toBe(400); expect(fetcher).not.toHaveBeenCalled();
  });
  it('uses only GET, a fixed API origin/version and no redirects; returns hashes rather than keys', async () => {
    const { run, fetcher } = setup(); const response = await run(request()); const result = await response.json();
    expect(response.headers.get('cache-control')).toBe('no-store'); expect(result).toMatchObject({ account_id: account.id, charges_enabled: true, country: 'CA' });
    expect(result.key_sha256).toMatch(/^[0-9a-f]{64}$/); expect(result.signing_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(result)).not.toMatch(/private|sk_live_|whsec_/);
    expect(fetcher.mock.calls[0][0]).toBe('https://api.stripe.com/v1/account');
    expect(fetcher.mock.calls[0][1]).toMatchObject({ method: 'GET', redirect: 'error', headers: { 'Stripe-Version': '2026-09-30.preview' } });
  });
  it.each([{ ...account, id: 'acct_Foreign' }, { ...account, charges_enabled: false }])('rejects the wrong or disabled account', async data => {
    const { run } = setup([{ body: data }]); expect((await run(request())).status).toBe(409);
  });
  it('returns only the one owned live webhook and strips its secret and unrelated endpoints', async () => {
    const { run } = setup([{ body: account }, { body: { has_more: false, data: [hook, { ...hook, url: 'https://unrelated.example.invalid' }] } }]);
    const result = await (await run(request('webhooks'))).json(); expect(result.webhook.id).toBe(hook.id); expect(result.webhook.secret).toBeUndefined();
    expect(JSON.stringify(result)).not.toMatch(/private|unrelated/);
  });
  it.each([{ has_more: true, data: [hook] }, { has_more: false, data: [] }, { has_more: false, data: [hook, hook] },
    { has_more: false, data: [{ ...hook, status: 'disabled' }] }, { has_more: false, data: [{ ...hook, livemode: false }] },
    { has_more: false, data: [{ ...hook, enabled_events: ['checkout.session.completed'] }] },
    { has_more: false, data: [{ ...hook, api_version: '2020-01-01' }] }])('fails closed on ambiguous/inactive webhook configuration', async data => {
    const { run } = setup([{ body: account }, { body: data }]); expect((await run(request('webhooks'))).ok).toBe(false);
  });
  it('selects a non-native event without exposing payment/customer data', async () => {
    const native = { ...event, id: 'evt_Native', data: { object: { ...event.data.object, metadata: { payment_channel: 'native_spt' } } } };
    const { run } = setup([{ body: account }, { body: { data: [native, event] } }]); const result = await (await run(request('event_candidate'))).json();
    expect(result.event).toEqual({ id: event.id, type: event.type, created: event.created, native: false }); expect(JSON.stringify(result)).not.toContain('private');
    const none = setup([{ body: account }, { body: { data: [native] } }]); expect((await none.run(request('event_candidate'))).status).toBe(404);
  });
  it('requires live terms approval before touching the SPT API', async () => {
    const { run, fetcher } = setup([{ body: account }], { ...env, NATIVE_PREFLIGHT_SPT_APPROVED: '' });
    expect((await run(request('spt_access'))).status).toBe(403); expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('probes a freshly generated nonexistent token without charging', async () => {
    const missing = { body: { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'private-secret' } }, status: 404 };
    const a = setup([{ body: account }, missing]), b = setup([{ body: account }, missing]);
    const result = await (await a.run(request('spt_access'))).json(); await b.run(request('spt_access'));
    expect(result).toMatchObject({ spt_lookup_access: true, charged: false }); expect(JSON.stringify(result)).not.toContain('private');
    const path = a.fetcher.mock.calls[1][0]; expect(path).toMatch(/^https:\/\/api.stripe.com\/v1\/shared_payment\/granted_tokens\/spt_MercuryLiveProbe[0-9a-f]{32}$/);
    expect(path).not.toBe(b.fetcher.mock.calls[1][0]); expect(a.fetcher.mock.calls.every(call => call[1]?.method === 'GET')).toBe(true);
  });
  it.each([{ status: 404, body: { error: { type: 'invalid_request_error', message: 'Unrecognized URL private-secret' } } },
    { status: 403, body: { error: { code: 'permission_denied', message: 'private-secret' } } },
    { status: 200, body: { payment_method: 'private-card' } }])('does not confuse missing route, denied access or unexpected data with SPT admission', async reply => {
    const { run } = setup([{ body: account }, reply]); const response = await run(request('spt_access')); const result = await response.json();
    expect(response.status).toBe(502); expect(result.spt_lookup_access).toBe(false); expect(JSON.stringify(result)).not.toContain('private');
  });
  it('bounds upstream bodies and hides processor or transport errors', async () => {
    const large = setup([{ body: { blob: 'x'.repeat(524288) } }]); expect((await large.run(request())).status).toBe(413);
    const run = createNativeStripeLivePreflight(env, vi.fn(async () => { throw Error('private-secret'); }) as typeof fetch);
    expect(await (await run(request())).json()).toEqual({ error: 'upstream_failure' });
  });
});
