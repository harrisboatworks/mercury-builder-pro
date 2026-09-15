import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { handleNotificationWebhook } from '#edge-deno/notification-webhook-handler';
import {
  computeTwilioSignature,
  decideNotificationWebhook,
  parseTwilioFormBody,
  resolveConfiguredTwilioWebhookUrl,
  resolveInboundTwilioWebhookUrl,
  TwilioWebhookRequestError,
  verifyTwilioSignature,
} from '../../../supabase/functions/_shared/twilio-signature.ts';
import { buildSmsStatusCallbackUrl } from '../../../supabase/functions/_shared/twilio-status.ts';

const AUTH_TOKEN = 'test-twilio-auth-token-not-real';
const SUPABASE_URL = 'https://eutsoqdpjurknjsshxes.supabase.co';
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/notification-webhook`;
const SMS_LOG_ID = 'd9428888-122b-4f16-9f99-2a40336793c1';
const MESSAGE_SID = 'SM1234567890abcdef1234567890abcdef';

function formBody(entries: ReadonlyArray<readonly [string, string]>): string {
  const form = new URLSearchParams();
  for (const [key, value] of entries) form.append(key, value);
  return form.toString();
}

const VALID_ENTRIES = [
  ['MessageSid', MESSAGE_SID],
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

  it('matches a deterministic repeated-key vector using unique sorted values', async () => {
    const signature = await computeTwilioSignature(
      'duplicate-key-token',
      'https://example.com/status',
      {
        MessageSid: 'SM11111111111111111111111111111111',
        MessageStatus: 'delivered',
        Tag: ['zeta', 'alpha', 'alpha'],
      },
    );
    expect(signature).toBe('uguR1uzVMNvt3qhSZR/LUxVVqbA=');
  });

  it('retains repeated form keys instead of silently taking the last value', () => {
    expect(parseTwilioFormBody('Tag=zeta&Tag=alpha&Tag=alpha')).toEqual({
      Tag: ['zeta', 'alpha', 'alpha'],
    });
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

  it('accepts exact semantic duplicates but rejects distinct signed values', async () => {
    const exactBody = formBody([
      ['MessageSid', MESSAGE_SID],
      ['MessageStatus', 'delivered'],
      ['MessageStatus', 'delivered'],
    ]);
    const exactSignature = await computeTwilioSignature(
      AUTH_TOKEN,
      WEBHOOK_URL,
      parseTwilioFormBody(exactBody),
    );
    await expect(decideNotificationWebhook({
      signature: exactSignature,
      rawBody: exactBody,
      authToken: AUTH_TOKEN,
      webhookUrl: WEBHOOK_URL,
    })).resolves.toMatchObject({ ok: true, messageStatus: 'delivered' });

    const conflictBody = formBody([
      ['MessageSid', MESSAGE_SID],
      ['MessageStatus', 'sent'],
      ['MessageStatus', 'delivered'],
    ]);
    const conflictSignature = await computeTwilioSignature(
      AUTH_TOKEN,
      WEBHOOK_URL,
      parseTwilioFormBody(conflictBody),
    );
    await expect(decideNotificationWebhook({
      signature: conflictSignature,
      rawBody: conflictBody,
      authToken: AUTH_TOKEN,
      webhookUrl: WEBHOOK_URL,
    })).resolves.toEqual({
      ok: false,
      status: 400,
      error: 'Conflicting MessageStatus values',
    });
  });

  it('retains ErrorCode separately from ErrorMessage', async () => {
    const body = formBody([
      ['MessageSid', MESSAGE_SID],
      ['MessageStatus', 'undelivered'],
      ['ErrorCode', '30006'],
      ['ErrorMessage', 'Landline or unreachable carrier'],
    ]);
    const signature = await computeTwilioSignature(
      AUTH_TOKEN,
      WEBHOOK_URL,
      parseTwilioFormBody(body),
    );
    await expect(decideNotificationWebhook({
      signature,
      rawBody: body,
      authToken: AUTH_TOKEN,
      webhookUrl: WEBHOOK_URL,
    })).resolves.toMatchObject({
      ok: true,
      errorCode: '30006',
      errorMessage: 'Landline or unreachable carrier',
    });
  });
});

describe('canonical Twilio webhook URL', () => {
  it('signs the configured public URL, not the runtime host or path', () => {
    const configured = `  ${WEBHOOK_URL}  `;
    expect(resolveConfiguredTwilioWebhookUrl(configured)).toBe(WEBHOOK_URL);
    expect(resolveInboundTwilioWebhookUrl(
      configured,
      'http://localhost:9999/notification-webhook',
    )).toEqual({ signedUrl: WEBHOOK_URL, smsLogId: null });
    expect(resolveInboundTwilioWebhookUrl(
      configured,
      `https://proxy.invalid/rewritten?sms_log_id=${SMS_LOG_ID}`,
    )).toEqual({
      signedUrl: `${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}`,
      smsLogId: SMS_LOG_ID,
    });
  });

  it('rejects duplicate or unexpected callback query keys', () => {
    expect(() => resolveInboundTwilioWebhookUrl(
      WEBHOOK_URL,
      `${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}&sms_log_id=${SMS_LOG_ID}`,
    )).toThrow(TwilioWebhookRequestError);
    expect(() => resolveInboundTwilioWebhookUrl(
      WEBHOOK_URL,
      `${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}&next=https://evil.invalid`,
    )).toThrow(TwilioWebhookRequestError);
  });

  it('puts the correlated callback URL in the outbound StatusCallback', () => {
    expect(buildSmsStatusCallbackUrl(WEBHOOK_URL, SMS_LOG_ID)).toBe(
      `${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}#rp=ct,rt,5xx&rc=2`,
    );
  });
});

describe('notification webhook handler', () => {
  it('accepts a valid signature and then invokes storage', async () => {
    const onVerified = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
    const response = await handleNotificationWebhook(
      await signedRequest({
        requestUrl: 'http://edge.internal/notification-webhook',
      }),
      { authToken: AUTH_TOKEN, configuredWebhookUrl: WEBHOOK_URL, onVerified },
    );
    expect(response.status).toBe(200);
    expect(onVerified).toHaveBeenCalledTimes(1);
    expect(onVerified).toHaveBeenCalledWith(formBody(VALID_ENTRIES));
  });

  it('persists an early callback by its pre-inserted outbox id', async () => {
    const callback = `${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}`;
    const onVerified = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
    const response = await handleNotificationWebhook(
      await signedRequest({
        requestUrl: `https://proxy.invalid/rewritten?sms_log_id=${SMS_LOG_ID}`,
        signedUrl: callback,
        entries: [
          ['MessageSid', MESSAGE_SID],
          ['MessageStatus', 'delivered'],
        ],
      }),
      { authToken: AUTH_TOKEN, configuredWebhookUrl: WEBHOOK_URL, onVerified },
    );
    expect(response.status).toBe(200);
    expect(onVerified).toHaveBeenCalledTimes(1);
  });

  it('returns 400 and does not write when the inbound query is not allowlisted', async () => {
    const onVerified = vi.fn();
    const response = await handleNotificationWebhook(
      await signedRequest({
        requestUrl: `${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}&next=https://evil.invalid`,
        signedUrl: `${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}`,
      }),
      { authToken: AUTH_TOKEN, configuredWebhookUrl: WEBHOOK_URL, onVerified },
    );
    expect(response.status).toBe(400);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('returns 403 and does not write when the signature is wrong', async () => {
    const onVerified = vi.fn();
    const response = await handleNotificationWebhook(
      await signedRequest({ signature: 'aaaaaaaaaaaaaaaaaaaaaaaaaaa=' }),
      { authToken: AUTH_TOKEN, configuredWebhookUrl: WEBHOOK_URL, onVerified },
    );
    expect(response.status).toBe(403);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('returns 403 and does not write when the header is missing', async () => {
    const onVerified = vi.fn();
    const response = await handleNotificationWebhook(
      await signedRequest({ signature: null }),
      { authToken: AUTH_TOKEN, configuredWebhookUrl: WEBHOOK_URL, onVerified },
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
        ['MessageSid', MESSAGE_SID],
        ['MessageStatus', 'failed'],
        ['To', '+15555550100'],
      ])),
    );
    const response = await handleNotificationWebhook(
      await signedRequest({ signature: otherSignature }),
      { authToken: AUTH_TOKEN, configuredWebhookUrl: WEBHOOK_URL, onVerified },
    );
    expect(response.status).toBe(403);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('fails closed without a token and does not write', async () => {
    const onVerified = vi.fn();
    const response = await handleNotificationWebhook(
      await signedRequest(),
      { authToken: '', configuredWebhookUrl: WEBHOOK_URL, onVerified },
    );
    expect(response.status).toBe(503);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('fails closed without TWILIO_WEBHOOK_URL and does not write', async () => {
    const onVerified = vi.fn();
    const response = await handleNotificationWebhook(
      await signedRequest(),
      { authToken: AUTH_TOKEN, configuredWebhookUrl: '', onVerified },
    );
    expect(response.status).toBe(503);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('rejects http configured URLs and query/hash on the canonical base', () => {
    expect(resolveConfiguredTwilioWebhookUrl('http://eutsoqdpjurknjsshxes.supabase.co/functions/v1/notification-webhook')).toBeNull();
    expect(resolveConfiguredTwilioWebhookUrl(`${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}`)).toBeNull();
    expect(resolveConfiguredTwilioWebhookUrl(`${WEBHOOK_URL}#rp=ct,rt,5xx&rc=2`)).toBeNull();
  });

  it('returns 405 for non-POST methods other than OPTIONS', async () => {
    const onVerified = vi.fn();
    const response = await handleNotificationWebhook(
      new Request(WEBHOOK_URL, { method: 'GET' }),
      { authToken: AUTH_TOKEN, configuredWebhookUrl: WEBHOOK_URL, onVerified },
    );
    expect(response.status).toBe(405);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('returns 413 and does not write when the body exceeds 16 KiB', async () => {
    const onVerified = vi.fn();
    const oversized = `MessageSid=${MESSAGE_SID}&MessageStatus=delivered&Pad=${'x'.repeat(20_000)}`;
    const response = await handleNotificationWebhook(
      new Request(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'aaaaaaaaaaaaaaaaaaaaaaaaaaa=',
        },
        body: oversized,
      }),
      { authToken: AUTH_TOKEN, configuredWebhookUrl: WEBHOOK_URL, onVerified },
    );
    expect(response.status).toBe(413);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('rejects conflicting repeated MessageSid values', async () => {
    const body = formBody([
      ['MessageSid', MESSAGE_SID],
      ['MessageSid', 'SM00000000000000000000000000000000'],
      ['MessageStatus', 'delivered'],
    ]);
    const signature = await computeTwilioSignature(
      AUTH_TOKEN,
      WEBHOOK_URL,
      parseTwilioFormBody(body),
    );
    await expect(decideNotificationWebhook({
      signature,
      rawBody: body,
      authToken: AUTH_TOKEN,
      webhookUrl: WEBHOOK_URL,
    })).resolves.toEqual({
      ok: false,
      status: 400,
      error: 'Conflicting MessageSid values',
    });
  });

  it('maps storage outcomes the way Twilio retries expect', async () => {
    const cases = [
      { status: 200, body: { applied: false }, kind: 'stale' },
      { status: 503, body: { error: 'not_found' }, kind: 'not_found' },
      { status: 409, body: { error: 'sid_conflict' }, kind: 'sid_conflict' },
    ] as const;
    for (const item of cases) {
      const onVerified = vi.fn(async () => new Response(JSON.stringify(item.body), { status: item.status }));
      const response = await handleNotificationWebhook(
        await signedRequest(),
        { authToken: AUTH_TOKEN, configuredWebhookUrl: WEBHOOK_URL, onVerified },
      );
      expect(response.status).toBe(item.status);
      expect(onVerified).toHaveBeenCalledTimes(1);
    }
  });
});

describe('Twilio webhook source contracts', () => {
  it('verifies the Twilio signature before creating a client or writing sms_logs', () => {
    const source = readFileSync('supabase/functions/notification-webhook/index.ts', 'utf8');
    expect(source.indexOf('handleNotificationWebhook')).toBeLessThan(source.indexOf('createClient('));
    expect(source.indexOf('readNotificationWebhookFields')).toBeLessThan(source.indexOf('createClient('));
    expect(source.indexOf('isTwilioMessageSid')).toBeLessThan(source.indexOf('createClient('));
    expect(source.indexOf('onVerified')).toBeLessThan(source.lastIndexOf('applyTwilioStatusToSmsLog'));
    expect(source).toContain('applyTwilioStatusToSmsLog');
    expect(source).toContain('parseSmsLogIdFromRequestUrl');
    expect(source).toContain('TWILIO_WEBHOOK_URL');
    expect(source).not.toContain(".eq('to_phone'");
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
    expect(signature).toContain('TWILIO_WEBHOOK_URL');
    expect(signature).toContain('resolveConfiguredTwilioWebhookUrl');
    expect(signature).toContain("if (!input.authToken)");
  });
});
