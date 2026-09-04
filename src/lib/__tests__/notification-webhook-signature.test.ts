import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { handleNotificationWebhook } from '../../../supabase/functions/_shared/notification-webhook-handler.ts';
import {
  buildTwilioMessageForm,
  buildTwilioStatusCallbackUrl,
  computeTwilioSignature,
  decideNotificationWebhook,
  parseTwilioFormBody,
  resolveConfiguredTwilioWebhookUrl,
  resolveInboundTwilioWebhookUrl,
  TwilioWebhookRequestError,
} from '../../../supabase/functions/_shared/twilio-signature.ts';
import { canApplyTwilioStatus } from '../../../supabase/functions/_shared/twilio-status.ts';
import { applyTwilioStatusToSmsLog } from '../../../supabase/functions/_shared/twilio-status-store.ts';

const AUTH_TOKEN = 'test-twilio-auth-token';
const WEBHOOK_URL =
  'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/notification-webhook';
const SMS_LOG_ID = 'd9428888-122b-4f16-9f99-2a40336793c1';
const MESSAGE_SID = 'SM1234567890abcdef1234567890abcdef';

function formBody(entries: ReadonlyArray<readonly [string, string]>): string {
  const form = new URLSearchParams();
  for (const [key, value] of entries) form.append(key, value);
  return form.toString();
}

async function signedRequest(input?: {
  requestUrl?: string;
  signedUrl?: string;
  entries?: ReadonlyArray<readonly [string, string]>;
  signature?: string;
}): Promise<Request> {
  const entries = input?.entries ?? [
    ['MessageSid', MESSAGE_SID],
    ['MessageStatus', 'delivered'],
  ];
  const body = formBody(entries);
  const signature = input?.signature ?? await computeTwilioSignature(
    AUTH_TOKEN,
    input?.signedUrl ?? WEBHOOK_URL,
    parseTwilioFormBody(body),
  );
  return new Request(input?.requestUrl ?? WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Twilio-Signature': signature,
    },
    body,
  });
}

describe('Twilio request signature', () => {
  it('matches Twilio\'s published HMAC-SHA1 known-answer vector', async () => {
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
  it('normalizes configured whitespace identically for outbound and inbound URLs', () => {
    const configured = `  ${WEBHOOK_URL}  `;
    const callback = buildTwilioStatusCallbackUrl(configured, SMS_LOG_ID);
    expect(resolveConfiguredTwilioWebhookUrl(configured)).toBe(WEBHOOK_URL);
    expect(callback).toBe(`${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}`);
    expect(resolveInboundTwilioWebhookUrl(
      configured,
      `https://proxy.invalid/anything?sms_log_id=${SMS_LOG_ID}`,
    )).toEqual({ signedUrl: callback, smsLogId: SMS_LOG_ID });
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

  it('puts the correlated callback URL in the outbound Twilio form', () => {
    const callback = buildTwilioStatusCallbackUrl(WEBHOOK_URL, SMS_LOG_ID);
    const form = buildTwilioMessageForm({
      to: '+15555550100',
      from: '+15555550199',
      body: 'Quote ready',
      statusCallbackUrl: callback,
    });
    expect(form.get('StatusCallback')).toBe(
      `${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}`,
    );
  });
});

describe('notification webhook handler', () => {
  it('does not invoke storage for an invalid signature', async () => {
    const applyStatus = vi.fn();
    const response = await handleNotificationWebhook(
      await signedRequest({ signature: 'invalid' }),
      { authToken: AUTH_TOKEN, configuredWebhookUrl: WEBHOOK_URL, applyStatus },
    );
    expect(response.status).toBe(403);
    expect(applyStatus).not.toHaveBeenCalled();
  });

  it('persists an early callback by its pre-inserted outbox id', async () => {
    const callback = buildTwilioStatusCallbackUrl(WEBHOOK_URL, SMS_LOG_ID)!;
    const applyStatus = vi.fn().mockResolvedValue({
      kind: 'applied',
      currentStatus: 'delivered',
    });
    const response = await handleNotificationWebhook(
      await signedRequest({
        requestUrl: `https://proxy.invalid/rewritten?sms_log_id=${SMS_LOG_ID}`,
        signedUrl: callback,
      }),
      { authToken: AUTH_TOKEN, configuredWebhookUrl: WEBHOOK_URL, applyStatus },
    );
    expect(response.status).toBe(200);
    expect(applyStatus).toHaveBeenCalledWith({
      smsLogId: SMS_LOG_ID,
      messageSid: MESSAGE_SID,
      messageStatus: 'delivered',
      errorCode: null,
      errorMessage: null,
    });
  });

  it.each([
    ['not_found', 503],
    ['sid_conflict', 409],
    ['stale', 200],
  ] as const)('maps %s storage results to HTTP %i', async (kind, status) => {
    const response = await handleNotificationWebhook(
      await signedRequest(),
      {
        authToken: AUTH_TOKEN,
        configuredWebhookUrl: WEBHOOK_URL,
        applyStatus: vi.fn().mockResolvedValue({ kind, currentStatus: 'delivered' }),
      },
    );
    expect(response.status).toBe(status);
  });
});

describe('Twilio status ordering', () => {
  it('allows forward progress and exact retries', () => {
    expect(canApplyTwilioStatus('pending', 'queued')).toBe(true);
    expect(canApplyTwilioStatus('queued', 'sent')).toBe(true);
    expect(canApplyTwilioStatus('delivered', 'delivered')).toBe(true);
  });

  it('blocks regressions and conflicting terminal outcomes', () => {
    expect(canApplyTwilioStatus('delivered', 'sent')).toBe(false);
    expect(canApplyTwilioStatus('failed', 'delivered')).toBe(false);
    expect(canApplyTwilioStatus('undelivered', 'failed')).toBe(false);
  });

  it('builds an AND-composed PostgREST update for status, row id, and SID', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(
      JSON.stringify([{ id: SMS_LOG_ID, status: 'delivered' }]),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ));
    const client = createClient('https://project.invalid', 'test-anon-key', {
      global: { fetch: fetchSpy },
    });

    await expect(applyTwilioStatusToSmsLog(client, {
      smsLogId: SMS_LOG_ID,
      messageSid: MESSAGE_SID,
      messageStatus: 'delivered',
      errorCode: null,
      errorMessage: null,
    })).resolves.toEqual({ kind: 'applied', currentStatus: 'delivered' });

    const requestedUrl = new URL(String(fetchSpy.mock.calls[0][0]));
    expect(requestedUrl.searchParams.get('id')).toBe(`eq.${SMS_LOG_ID}`);
    expect(requestedUrl.searchParams.get('status')).toContain('in.');
    expect(requestedUrl.searchParams.get('status')).toContain('pending');
    expect(requestedUrl.searchParams.getAll('or')).toEqual([
      `(message_sid.is.null,message_sid.eq.${MESSAGE_SID})`,
    ]);
  });
});

describe('Twilio tracking source contracts', () => {
  it('retains current-main pre-insert ordering before the provider request', () => {
    const source = readFileSync('supabase/functions/send-sms/index.ts', 'utf8');
    expect(source.indexOf(".insert({\n        to_phone: formattedPhone")).toBeGreaterThan(-1);
    expect(source.indexOf(".insert({\n        to_phone: formattedPhone")).toBeLessThan(
      source.indexOf('api.twilio.com'),
    );
    expect(source).toContain('buildTwilioStatusCallbackUrl');
    expect(source).not.toContain("headers.get('host')");
    expect(source).not.toContain("headers.get('x-forwarded-host')");
  });

  it('keeps service-role creation behind validated handler dependencies', () => {
    const source = readFileSync(
      'supabase/functions/notification-webhook/index.ts',
      'utf8',
    );
    expect(source.indexOf('handleNotificationWebhook')).toBeLessThan(
      source.indexOf('createClient('),
    );
    expect(source).not.toContain('api.twilio.com');
    expect(source).not.toContain(".eq('to_phone'");
  });
});
