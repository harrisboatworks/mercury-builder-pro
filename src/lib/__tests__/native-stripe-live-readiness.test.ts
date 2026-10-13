import { describe, expect, it, vi } from 'vitest';
import { createNativeStripePreviewClient } from '../../../supabase/functions/_shared/native-stripe-preview';
import { NATIVE_LIVE_WEBHOOK_EVENTS, NATIVE_LIVE_WEBHOOK_URL } from '../../../supabase/functions/_shared/native-stripe-live-webhook';

const account = { id: 'acct_Synthetic', charges_enabled: true };
const hook = { id: 'we_Synthetic', url: NATIVE_LIVE_WEBHOOK_URL, status: 'enabled', livemode: true,
  api_version: '2022-11-15', enabled_events: [...NATIVE_LIVE_WEBHOOK_EVENTS] };
function client(replies: unknown[], key = 'sk_live_fixture-not-a-key', webhook = 'we_Synthetic') {
  const fetcher = vi.fn(async (_url: string | URL | Request, _options?: RequestInit) => new Response(JSON.stringify(replies.shift()), { status: 200 }));
  return { fetcher, stripe: createNativeStripePreviewClient({ secretKey: key, sellerAccountId: account.id, liveWebhookId: webhook, fetchImpl: fetcher as typeof fetch }) };
}
describe('current live native write admission', () => {
  it('checks account and owned webhook before the only charge request', async () => {
    const { stripe, fetcher } = client([account, account, hook, { id: 'pi_Synthetic' }]);
    const mark = vi.fn(async () => { expect(fetcher).toHaveBeenCalledTimes(3); });
    await stripe.createConfirmedPaymentIntent({ amount: '50000' }, 'native-deposit-pi:Synthetic', mark);
    expect(mark).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls.map(c => [c[0], c[1]?.method])).toEqual([
      ['https://api.stripe.com/v1/account', 'GET'], ['https://api.stripe.com/v1/account', 'GET'],
      ['https://api.stripe.com/v1/webhook_endpoints/we_Synthetic', 'GET'], ['https://api.stripe.com/v1/payment_intents', 'POST']]);
  });
  it('never records submission on a preflight refusal or posts after a marker refusal', async () => {
    const refused = client([account, { ...account, charges_enabled: false }]); const mark = vi.fn(async () => {});
    await expect(refused.stripe.createConfirmedPaymentIntent({}, 'native-deposit-pi:Synthetic', mark)).rejects.toThrow();
    expect(mark).not.toHaveBeenCalled();
    const ready = client([account, account, hook]);
    await expect(ready.stripe.createConfirmedPaymentIntent({}, 'native-deposit-pi:Synthetic', async () => { throw Error('marker refused'); })).rejects.toThrow('marker refused');
    expect(ready.fetcher.mock.calls.every(c => c[1]?.method === 'GET')).toBe(true);
  });
  it.each([{ ...account, charges_enabled: false }, { ...account, id: 'acct_Foreign' }])('refuses a currently disabled/foreign merchant before charging', async current => {
    const { stripe, fetcher } = client([account, current]);
    await expect(stripe.createConfirmedPaymentIntent({}, 'native-deposit-pi:Synthetic')).rejects.toThrow();
    expect(fetcher.mock.calls.every(c => c[1]?.method === 'GET')).toBe(true);
  });
  it.each([{ ...hook, status: 'disabled' }, { ...hook, id: 'we_Foreign' }, { ...hook, url: 'https://foreign.example.invalid' },
    { ...hook, livemode: false }, ...NATIVE_LIVE_WEBHOOK_EVENTS.map(event => ({ ...hook, enabled_events: hook.enabled_events.filter(e => e !== event) }))])('refuses changed native webhook readiness before charging', async current => {
    const { stripe, fetcher } = client([account, account, current]);
    await expect(stripe.createConfirmedPaymentIntent({}, 'native-deposit-pi:Synthetic')).rejects.toThrow();
    expect(fetcher.mock.calls.every(c => c[1]?.method === 'GET')).toBe(true);
  });
  it('rechecks readiness for subsequent writes on the same client', async () => {
    const { stripe, fetcher } = client([account, account, hook, { id: 'pi_Synthetic' }, { ...account, charges_enabled: false }]);
    await stripe.createConfirmedPaymentIntent({}, 'native-deposit-pi:First');
    await expect(stripe.createConfirmedPaymentIntent({}, 'native-deposit-pi:Second')).rejects.toThrow();
    expect(fetcher.mock.calls.filter(c => c[1]?.method === 'POST')).toHaveLength(1);
  });
  it('keeps GET reconciliation available when charges/webhook are disabled or missing', async () => {
    const { stripe, fetcher } = client([{ ...account, charges_enabled: false }, { id: 'pi_Synthetic', status: 'succeeded' }], undefined, '');
    expect(await stripe.retrievePaymentIntent('pi_Synthetic')).toMatchObject({ status: 'succeeded' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('keeps isolated test-key behavior separate from live admission', async () => {
    const { stripe, fetcher } = client([account, { id: 'pi_Synthetic' }], 'sk_test_fixture-not-a-key', '');
    await stripe.createConfirmedPaymentIntent({}, 'native-deposit-pi:Synthetic'); expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
