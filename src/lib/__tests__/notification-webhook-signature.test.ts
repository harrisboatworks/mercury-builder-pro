import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { handleNotificationWebhook } from '#edge-deno/notification-webhook-handler';
import {
  computeTwilioSignature,
  parseTwilioFormBody,
  resolveTwilioWebhookUrl,
  verifyTwilioSignature,
} from '../../../supabase/functions/_shared/twilio-signature.ts';

const AUTH_TOKEN = 'test-twilio-auth-token-not-real';
const SUPABASE_URL = 'https://eutsoqdpjurknjsshxes.supabase.co';
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/notification-webhook`;

function formBody(entries: ReadonlyArray<readonly [string, string]>): string {
  const form = new URLSearchParams();
  for (const [key, value] of entries) form.append(key, value);
  return form.toString();
}

const VALID_ENTRIES = [
  ['MessageSid', 'SM1234567890abcdef1234567890abcdef'],
  ['MessageStatus', 'delivered'],
  ['To', '+15555550100'],
] as const;

async function signedRequest(input?: {
  requestUrl?: string;
  signedUrl?: string;
  entries?: ReadonlyArray<readonly [string, string]>;
  signature?: string | null;
  authHeader?: boolean;
}): Promise<Request> {
  const entries = input?.entries ?? VALID_ENTRIES;
  const body = formBody(entries);
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (input?.signature !== null) {
    headers['X-Twilio-Signature'] = input?.signature ?? await computeTwilioSignature(
      AUTH_TOKEN,
      input?.signedUrl ?? WEBHOOK_URL,
      parseTwilioFormBody(body),
    );
  }
  return new Request(input?.requestUrl ?? WEBHOOK_URL, {
    method: 'POST',
    headers,
    body,
  });
}

describe('Twilio request signature', () => {
  it("matches Twilio's published HMAC-SHA1 known-answer vector", async () => {
    const signature = await computeTwilioSignature(
      '12345',
      'https://example.com/myapp.php?foo=1&bar=2',
      {
        Digits: '1234',
        To: '+18005551212',
        From: '+14158675310',
        Caller: '+14158675310',
        CallSid: 'CA1234567890ABCDE',
      },
    );
    expect(signature).toBe('L/OH5YylLD5NRKLltdqwSvS0BnU=');
  });

  it('accepts a signature computed with a fake token over the form body', async () => {
    const params = parseTwilioFormBody(formBody(VALID_ENTRIES));
    const signature = await computeTwilioSignature(AUTH_TOKEN, WEBHOOK_URL, params);
    await expect(verifyTwilioSignature({
      authToken: AUTH_TOKEN,
      webhookUrl: WEBHOOK_URL,
      signature,
      params,
    })).resolves.toBe(true);
  });
});

describe('canonical Twilio webhook URL', () => {
  it('signs the public function URL, not the runtime host or path', () => {
    expect(resolveTwilioWebhookUrl(
      `${SUPABASE_URL}/`,
      'http://localhost:9999/notification-webhook',
    )).toBe(WEBHOOK_URL);
    expect(resolveTwilioWebhookUrl(
      SUPABASE_URL,
      `https://proxy.invalid/rewritten?MessageSid=SM1`,
    )).toBe(`${WEBHOOK_URL}?MessageSid=SM1`);
  });
});

describe('notification webhook handler', () => {
  it('accepts a valid signature and then invokes storage', async () => {
    const onVerified = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
    const response = await handleNotificationWebhook(
      await signedRequest({
        requestUrl: 'http://edge.internal/notification-webhook',
      }),
      { authToken: AUTH_TOKEN, supabaseUrl: SUPABASE_URL, onVerified },
    );
    expect(response.status).toBe(200);
    expect(onVerified).toHaveBeenCalledTimes(1);
    expect(onVerified).toHaveBeenCalledWith(formBody(VALID_ENTRIES));
  });

  it('returns 403 and does not write when the signature is wrong', async () => {
    const onVerified = vi.fn();
    const response = await handleNotificationWebhook(
      await signedRequest({ signature: 'aaaaaaaaaaaaaaaaaaaaaaaaaaa=' }),
      { authToken: AUTH_TOKEN, supabaseUrl: SUPABASE_URL, onVerified },
    );
    expect(response.status).toBe(403);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('returns 403 and does not write when the header is missing', async () => {
    const onVerified = vi.fn();
    const response = await handleNotificationWebhook(
      await signedRequest({ signature: null }),
      { authToken: AUTH_TOKEN, supabaseUrl: SUPABASE_URL, onVerified },
    );
    expect(response.status).toBe(403);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('returns 403 and does not write when a valid signature covers different parameters', async () => {
    const onVerified = vi.fn();
    const otherSignature = await computeTwilioSignature(
      AUTH_TOKEN,
      WEBHOOK_URL,
      parseTwilioFormBody(formBody([
        ['MessageSid', 'SM1234567890abcdef1234567890abcdef'],
        ['MessageStatus', 'failed'],
        ['To', '+15555550100'],
      ])),
    );
    const response = await handleNotificationWebhook(
      await signedRequest({ signature: otherSignature }),
      { authToken: AUTH_TOKEN, supabaseUrl: SUPABASE_URL, onVerified },
    );
    expect(response.status).toBe(403);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('fails closed without a token and does not write', async () => {
    const onVerified = vi.fn();
    const response = await handleNotificationWebhook(
      await signedRequest(),
      { authToken: '', supabaseUrl: SUPABASE_URL, onVerified },
    );
    expect(response.status).toBe(503);
    expect(onVerified).not.toHaveBeenCalled();
  });
});

describe('Twilio webhook source contracts', () => {
  it('verifies the Twilio signature before creating a client or writing sms_logs', () => {
    const source = readFileSync('supabase/functions/notification-webhook/index.ts', 'utf8');
    expect(source.indexOf('handleNotificationWebhook')).toBeLessThan(source.indexOf('createClient('));
    expect(source.indexOf('onVerified')).toBeLessThan(source.indexOf(".from('sms_logs')"));
    expect(source).toContain(".eq('to_phone', to)");
    expect(source).not.toContain('message_sid');
    expect(source).not.toContain('TWILIO_WEBHOOK_URL');
  });

  it('keeps verify_jwt false and fails closed without TWILIO_AUTH_TOKEN', () => {
    const config = readFileSync('supabase/config.toml', 'utf8');
    const handler = readFileSync(
      'supabase/functions/_shared/notification-webhook-handler.ts',
      'utf8',
    );
    const signature = readFileSync(
      'supabase/functions/_shared/twilio-signature.ts',
      'utf8',
    );
    expect(config).toMatch(/\[functions\.notification-webhook\]\s*\nverify_jwt = false/);
    expect(handler).toContain('gateTwilioStatusCallback');
    expect(signature).toContain('timingSafeEqual');
    expect(signature).toContain('parseTwilioFormBody');
    expect(signature).toContain('/functions/v1/notification-webhook');
    expect(signature).toContain("if (!input.authToken)");
  });
});
