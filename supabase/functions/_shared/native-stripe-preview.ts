// Pinned native Shared Payment Token client. Hosted Checkout keeps its own
// 2025-08-27.basil Stripe client. This module never calls Stripe test helpers.
import { nativeLiveWebhookReady } from './native-stripe-live-webhook.ts';

export const NATIVE_STRIPE_API_VERSION = "2026-09-30.preview";
export const HOSTED_CHECKOUT_STRIPE_API_VERSION = "2025-08-27.basil";

const SPT_ID = /^spt_[A-Za-z0-9]+$/;
const PI_ID = /^pi_(?:test_|live_)?[A-Za-z0-9]+$/;
const ACCOUNT_ID = /^acct_[A-Za-z0-9]+$/;

export type NativeStripePreview = {
  apiVersion: typeof NATIVE_STRIPE_API_VERSION;
  livemode: boolean;
  sellerAccountId: string;
  retrieveSharedPaymentToken(tokenId: string): Promise<unknown>;
  createConfirmedPaymentIntent(
    params: Record<string, string>,
    idempotencyKey: string,
  ): Promise<unknown>;
  retrievePaymentIntent(id: string): Promise<unknown>;
};

export class NativeStripeRequestError extends Error {
  status: number | null;
  code: string;
  paymentIntent: unknown;

  constructor(status: number | null, code: string, paymentIntent: unknown = null) {
    super(code);
    this.name = "NativeStripeRequestError";
    this.status = status;
    this.code = code;
    this.paymentIntent = paymentIntent;
  }
}

function encodeForm(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

export function createNativeStripePreviewClient(options: {
  secretKey: string;
  sellerAccountId: string;
  liveWebhookId?: string;
  fetchImpl?: typeof fetch;
}): NativeStripePreview {
  const secretKey = options.secretKey.trim();
  const sellerAccountId = options.sellerAccountId.trim();
  const testKey = secretKey.startsWith("sk_test_");
  const liveKey = secretKey.startsWith("sk_live_");
  if ((!testKey && !liveKey) || secretKey.length < 16 || secretKey.length > 256) {
    throw new NativeStripeRequestError(null, "native_stripe_not_configured");
  }
  if (!ACCOUNT_ID.test(sellerAccountId)) {
    throw new NativeStripeRequestError(null, "native_seller_not_configured");
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  const livemode = liveKey;

  async function rawStripeRequest(
    method: "GET" | "POST",
    path: string,
    body?: Record<string, string>,
    idempotencyKey?: string,
  ): Promise<unknown> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${secretKey}`,
      "Stripe-Version": NATIVE_STRIPE_API_VERSION,
    };
    if (body) headers["Content-Type"] = "application/x-www-form-urlencoded";
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    let response: Response;
    try {
      response = await fetchImpl(`https://api.stripe.com${path}`, {
        method,
        headers,
        body: body ? encodeForm(body) : undefined,
      });
    } catch {
      throw new NativeStripeRequestError(null, "stripe_network");
    }
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok) {
      const record = payload && typeof payload === "object" ? payload as { error?: { code?: string; payment_intent?: unknown } } : {};
      const code = typeof record.error?.code === "string" ? record.error.code : "stripe_error";
      throw new NativeStripeRequestError(response.status, code, record.error?.payment_intent ?? null);
    }
    return payload;
  }

  let checkedAccount = false;
  async function stripeRequest(method: "GET" | "POST", path: string, body?: Record<string, string>, idempotencyKey?: string) {
    if (!checkedAccount) {
      const account = await rawStripeRequest("GET", "/v1/account") as { id?: string };
      if (account?.id !== sellerAccountId) throw new NativeStripeRequestError(409, "native_seller_mismatch");
      checkedAccount = true;
    }
    if (livemode && method === 'POST') {
      // Deployment proof is durable configuration, not a stale health cache.
      // Recheck current admission before a new live write. GET reconciliation
      // remains available when charges or the callback destination are paused.
      if (!/^we_[A-Za-z0-9]+$/.test(options.liveWebhookId || ''))
        throw new NativeStripeRequestError(409, 'native_webhook_not_ready');
      const current = await rawStripeRequest('GET', '/v1/account') as { id?: string; charges_enabled?: boolean };
      if (current?.id !== sellerAccountId || current.charges_enabled !== true)
        throw new NativeStripeRequestError(409, 'native_seller_not_ready');
      const hook = await rawStripeRequest('GET', `/v1/webhook_endpoints/${encodeURIComponent(options.liveWebhookId!)}`);
      if (!nativeLiveWebhookReady(hook, options.liveWebhookId))
        throw new NativeStripeRequestError(409, 'native_webhook_not_ready');
    }
    return rawStripeRequest(method, path, body, idempotencyKey);
  }

  return {
    apiVersion: NATIVE_STRIPE_API_VERSION,
    livemode,
    sellerAccountId,
    async retrieveSharedPaymentToken(tokenId: string) {
      if (!SPT_ID.test(tokenId)) throw new NativeStripeRequestError(400, "invalid_token");
      return stripeRequest("GET", `/v1/shared_payment/granted_tokens/${encodeURIComponent(tokenId)}`);
    },
    createConfirmedPaymentIntent(params, idempotencyKey) {
      if (!idempotencyKey.startsWith("native-deposit-pi:")) {
        throw new NativeStripeRequestError(400, "invalid_idempotency_key");
      }
      return stripeRequest("POST", "/v1/payment_intents", params, idempotencyKey);
    },
    retrievePaymentIntent(id: string) {
      if (!PI_ID.test(id)) throw new NativeStripeRequestError(400, "invalid_payment_intent");
      return stripeRequest("GET", `/v1/payment_intents/${encodeURIComponent(id)}`);
    },
  };
}
