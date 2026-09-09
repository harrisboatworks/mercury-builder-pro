// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import ts from 'typescript';
import { z } from 'zod';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as consultationDocumentPolicy from '../../../supabase/functions/_shared/consultation-document-policy.ts';
import * as consultationSmsPolicy from '../../../supabase/functions/_shared/consultation-sms-policy.ts';
import * as notificationWebhookHandler from '../../../supabase/functions/_shared/notification-webhook-handler.ts';
import {
  computeTwilioSignature,
  parseTwilioFormBody,
} from '../../../supabase/functions/_shared/twilio-signature.ts';
import {
  buildSmsStatusCallbackUrl,
  canApplyTwilioStatus,
  httpStatusForTwilioStatusApplyResult,
  isTwilioMessageSid,
  parseSmsLogIdFromRequestUrl,
} from '../../../supabase/functions/_shared/twilio-status.ts';
import { applyTwilioStatusToSmsLog } from '../../../supabase/functions/_shared/twilio-status-store.ts';

const AUTH_TOKEN = 'test-twilio-auth-token-not-real';
const SUPABASE_URL = 'https://eutsoqdpjurknjsshxes.supabase.co';
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/notification-webhook`;
const SMS_LOG_ID = 'd9428888-122b-4f16-9f99-2a40336793c1';
const MESSAGE_SID = 'SM1234567890abcdef1234567890abcdef';
const OTHER_SID = 'SM00000000000000000000000000000000';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

describe('Twilio status ordering', () => {
  it('allows forward progress and exact retries', () => {
    expect(canApplyTwilioStatus('pending', 'queued')).toBe(true);
    expect(canApplyTwilioStatus('queued', 'sent')).toBe(true);
    expect(canApplyTwilioStatus('sent', 'delivered')).toBe(true);
    expect(canApplyTwilioStatus('delivered', 'delivered')).toBe(true);
  });

  it('blocks regressions and conflicting terminal outcomes', () => {
    expect(canApplyTwilioStatus('delivered', 'sent')).toBe(false);
    expect(canApplyTwilioStatus('failed', 'delivered')).toBe(false);
    expect(canApplyTwilioStatus('undelivered', 'failed')).toBe(false);
    expect(canApplyTwilioStatus(null, 'queued')).toBe(false);
  });
});

describe('Twilio status callback URL', () => {
  it('derives the public function URL from SUPABASE_URL plus sms_log_id', () => {
    expect(buildSmsStatusCallbackUrl(`${SUPABASE_URL}/`, SMS_LOG_ID)).toBe(
      `${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}`,
    );
    expect(buildSmsStatusCallbackUrl(SUPABASE_URL, 'not-a-uuid')).toBeNull();
    expect(buildSmsStatusCallbackUrl('', SMS_LOG_ID)).toBeNull();
  });

  it('reads a single valid sms_log_id from the inbound request query', () => {
    expect(parseSmsLogIdFromRequestUrl(
      `http://edge.internal/notification-webhook?sms_log_id=${SMS_LOG_ID}`,
    )).toBe(SMS_LOG_ID);
    expect(parseSmsLogIdFromRequestUrl(WEBHOOK_URL)).toBeNull();
    expect(parseSmsLogIdFromRequestUrl(
      `${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}&sms_log_id=${SMS_LOG_ID}`,
    )).toBeNull();
  });
});

describe('Twilio status HTTP mapping', () => {
  it('maps storage results the way Twilio retries expect', () => {
    expect(httpStatusForTwilioStatusApplyResult({
      kind: 'applied',
      currentStatus: 'delivered',
    })).toBe(200);
    expect(httpStatusForTwilioStatusApplyResult({
      kind: 'stale',
      currentStatus: 'delivered',
    })).toBe(200);
    expect(httpStatusForTwilioStatusApplyResult({
      kind: 'not_found',
      currentStatus: null,
    })).toBe(503);
    expect(httpStatusForTwilioStatusApplyResult({
      kind: 'sid_conflict',
      currentStatus: 'sent',
    })).toBe(409);
  });
});

describe('Twilio status store', () => {
  it('builds an AND-composed PostgREST update for status, row id, and SID', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse([
      { id: SMS_LOG_ID, status: 'delivered' },
    ]));
    const client = createClient('https://project.invalid', 'test-anon-key', {
      global: { fetch: fetchSpy },
    });

    await expect(applyTwilioStatusToSmsLog(client, {
      smsLogId: SMS_LOG_ID,
      messageSid: MESSAGE_SID,
      messageStatus: 'delivered',
      errorCode: '30006',
      errorMessage: 'Landline or unreachable carrier',
    })).resolves.toEqual({ kind: 'applied', currentStatus: 'delivered' });

    const requestedUrl = new URL(String(fetchSpy.mock.calls[0][0]));
    expect(requestedUrl.pathname).toContain('/sms_logs');
    expect(requestedUrl.searchParams.get('id')).toBe(`eq.${SMS_LOG_ID}`);
    expect(requestedUrl.searchParams.get('status')).toContain('in.');
    expect(requestedUrl.searchParams.get('status')).toContain('pending');
    expect(requestedUrl.searchParams.getAll('or')).toEqual([
      `(message_sid.is.null,message_sid.eq.${MESSAGE_SID})`,
    ]);
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toMatchObject({
      status: 'delivered',
      message_sid: MESSAGE_SID,
      error_code: '30006',
      error: 'Landline or unreachable carrier',
    });
  });

  it('looks up by MessageSid when the callback has no outbox id', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse([
      { id: SMS_LOG_ID, status: 'sent' },
    ]));
    const client = createClient('https://project.invalid', 'test-anon-key', {
      global: { fetch: fetchSpy },
    });

    await expect(applyTwilioStatusToSmsLog(client, {
      smsLogId: null,
      messageSid: MESSAGE_SID,
      messageStatus: 'sent',
      errorCode: null,
      errorMessage: null,
    })).resolves.toEqual({ kind: 'applied', currentStatus: 'sent' });

    const requestedUrl = new URL(String(fetchSpy.mock.calls[0][0]));
    expect(requestedUrl.searchParams.get('message_sid')).toBe(`eq.${MESSAGE_SID}`);
    expect(requestedUrl.searchParams.get('id')).toBeNull();
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      status: 'sent',
      message_sid: MESSAGE_SID,
    });
  });

  it('classifies zero-row updates as not_found, stale, or sid_conflict', async () => {
    const notFound = vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));
    await expect(applyTwilioStatusToSmsLog(
      createClient('https://project.invalid', 'test-anon-key', { global: { fetch: notFound } }),
      {
        smsLogId: SMS_LOG_ID,
        messageSid: MESSAGE_SID,
        messageStatus: 'queued',
        errorCode: null,
        errorMessage: null,
      },
    )).resolves.toEqual({ kind: 'not_found', currentStatus: null });

    const stale = vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({
        id: SMS_LOG_ID,
        status: 'delivered',
        message_sid: MESSAGE_SID,
      }));
    await expect(applyTwilioStatusToSmsLog(
      createClient('https://project.invalid', 'test-anon-key', { global: { fetch: stale } }),
      {
        smsLogId: SMS_LOG_ID,
        messageSid: MESSAGE_SID,
        messageStatus: 'sent',
        errorCode: null,
        errorMessage: null,
      },
    )).resolves.toEqual({ kind: 'stale', currentStatus: 'delivered' });

    const conflict = vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({
        id: SMS_LOG_ID,
        status: 'pending',
        message_sid: OTHER_SID,
      }));
    await expect(applyTwilioStatusToSmsLog(
      createClient('https://project.invalid', 'test-anon-key', { global: { fetch: conflict } }),
      {
        smsLogId: SMS_LOG_ID,
        messageSid: MESSAGE_SID,
        messageStatus: 'queued',
        errorCode: null,
        errorMessage: null,
      },
    )).resolves.toEqual({ kind: 'sid_conflict', currentStatus: 'pending' });
  });
});

describe('send-sms records the outbound MessageSid', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pre-inserts the outbox row, sets a SUPABASE_URL callback, and persists the SID', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input);
      const method = ((typeof input === 'object' && input && 'method' in input && input.method)
        || init?.method
        || 'GET').toString().toUpperCase();
      if (url.includes('api.twilio.com')) {
        return jsonResponse({ sid: MESSAGE_SID, status: 'queued' }, 201);
      }
      if (url.includes('sms_logs') && method === 'POST') {
        return jsonResponse({ id: SMS_LOG_ID });
      }
      if (url.includes('sms_logs') && method === 'PATCH') {
        return jsonResponse([{ id: SMS_LOG_ID, status: 'queued' }]);
      }
      throw new Error(`unhandled fetch ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchSpy);

    const compiled = ts.transpileModule(
      readFileSync('supabase/functions/send-sms/index.ts', 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
    ).outputText;

    let handler!: (request: Request) => Promise<Response>;
    const imports: Record<string, unknown> = {
      'https://deno.land/std@0.190.0/http/server.ts': {
        serve: (fn: typeof handler) => { handler = fn; },
      },
      'npm:@supabase/supabase-js@2.53.1': {
        createClient: () => createClient(SUPABASE_URL, 'test-service-role', {
          global: { fetch: fetchSpy },
        }),
      },
      '../_shared/rate-limit.ts': {
        checkRateLimit: async () => true,
        rateLimitedResponse: () => new Response('limited', { status: 429 }),
      },
      '../_shared/admin-auth.ts': {
        requireAdmin: async () => ({ userId: 'internal' }),
      },
      '../_shared/consultation-sms-policy.ts': consultationSmsPolicy,
      '../_shared/consultation-document-policy.ts': consultationDocumentPolicy,
      '../_shared/twilio-status.ts': await import('../../../supabase/functions/_shared/twilio-status.ts'),
      '../_shared/twilio-status-store.ts': await import('../../../supabase/functions/_shared/twilio-status-store.ts'),
    };

    new Function('require', 'exports', 'Deno', compiled)(
      (specifier: string) => {
        if (!(specifier in imports)) throw new Error(`Unmocked import: ${specifier}`);
        return imports[specifier];
      },
      {},
      {
        env: {
          get: (name: string) => ({
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
            TWILIO_ACCOUNT_SID: 'ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            TWILIO_AUTH_TOKEN: AUTH_TOKEN,
            TWILIO_FROM_NUMBER: '+15555550199',
            ADMIN_PHONE: '+19053766208',
          }[name]),
        },
      },
    );

    const response = await handler(new Request(`${SUPABASE_URL}/functions/v1/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: '+15555550100',
        message: 'Your quote is ready.',
        messageType: 'manual',
      }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      messageId: MESSAGE_SID,
      status: 'queued',
    });

    const twilioCall = fetchSpy.mock.calls.find(([input]) => (
      requestUrl(input).includes('api.twilio.com')
    ));
    expect(twilioCall).toBeTruthy();
    const twilioForm = new URLSearchParams(String(twilioCall?.[1]?.body ?? ''));
    expect(twilioForm.get('StatusCallback')).toBe(
      `${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}`,
    );
    expect(twilioForm.get('To')).toBe('+15555550100');

    const persistCall = fetchSpy.mock.calls.find(([input, init]) => (
      requestUrl(input).includes('/sms_logs') &&
      (init?.method || 'GET').toUpperCase() === 'PATCH'
    ));
    expect(persistCall).toBeTruthy();
    const persistUrl = new URL(requestUrl(persistCall![0]));
    expect(persistUrl.searchParams.get('id')).toBe(`eq.${SMS_LOG_ID}`);
    expect(JSON.parse(String(persistCall?.[1]?.body))).toMatchObject({
      status: 'queued',
      message_sid: MESSAGE_SID,
    });
  });
});

describe('notification-webhook persists verified callbacks by SID', () => {
  async function webhookHandler(): Promise<(request: Request) => Promise<Response>> {
    const compiled = ts.transpileModule(
      readFileSync('supabase/functions/notification-webhook/index.ts', 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
    ).outputText;

    let handler!: (request: Request) => Promise<Response>;
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse([
      { id: SMS_LOG_ID, status: 'delivered' },
    ]));
    const imports: Record<string, unknown> = {
      'https://deno.land/std@0.190.0/http/server.ts': {
        serve: (fn: typeof handler) => { handler = fn; },
      },
      'npm:@supabase/supabase-js@2.53.1': {
        createClient: () => createClient(SUPABASE_URL, 'test-service-role', {
          global: { fetch: fetchSpy },
        }),
      },
      'npm:zod@3.22.4': { z },
      '../_shared/notification-webhook-handler.ts': notificationWebhookHandler,
      '../_shared/twilio-status.ts': await import('../../../supabase/functions/_shared/twilio-status.ts'),
      '../_shared/twilio-status-store.ts': await import('../../../supabase/functions/_shared/twilio-status-store.ts'),
    };

    new Function('require', 'exports', 'Deno', compiled)(
      (specifier: string) => {
        if (!(specifier in imports)) throw new Error(`Unmocked import: ${specifier}`);
        return imports[specifier];
      },
      {},
      {
        env: {
          get: (name: string) => ({
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
            TWILIO_AUTH_TOKEN: AUTH_TOKEN,
          }[name]),
        },
      },
    );

    return Object.assign(handler, { fetchSpy });
  }

  async function signedCallback(status = 'delivered'): Promise<Request> {
    const body = new URLSearchParams({
      MessageSid: MESSAGE_SID,
      MessageStatus: status,
      ErrorCode: '30006',
      ErrorMessage: 'Landline or unreachable carrier',
    }).toString();
    const requestUrlWithId = `${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}`;
    const signature = await computeTwilioSignature(
      AUTH_TOKEN,
      requestUrlWithId,
      parseTwilioFormBody(body),
    );
    return new Request(requestUrlWithId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature,
      },
      body,
    });
  }

  it('updates sms_logs by outbox id after a valid signature', async () => {
    const handler = await webhookHandler();
    const response = await handler(await signedCallback());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      applied: true,
    });

    const fetchSpy = (handler as typeof handler & { fetchSpy: ReturnType<typeof vi.fn> }).fetchSpy;
    const persistUrl = new URL(String(fetchSpy.mock.calls[0][0]));
    expect(persistUrl.searchParams.get('id')).toBe(`eq.${SMS_LOG_ID}`);
    expect(persistUrl.searchParams.get('status')).toContain('in.');
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toMatchObject({
      status: 'delivered',
      message_sid: MESSAGE_SID,
      error_code: '30006',
    });
    expect(persistUrl.searchParams.get('to_phone')).toBeNull();
  });

  it('does not write when the signature is wrong', async () => {
    const handler = await webhookHandler();
    const response = await handler(new Request(`${WEBHOOK_URL}?sms_log_id=${SMS_LOG_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': 'aaaaaaaaaaaaaaaaaaaaaaaaaaa=',
      },
      body: new URLSearchParams({
        MessageSid: MESSAGE_SID,
        MessageStatus: 'delivered',
      }).toString(),
    }));
    expect(response.status).toBe(403);
    const fetchSpy = (handler as typeof handler & { fetchSpy: ReturnType<typeof vi.fn> }).fetchSpy;
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('Twilio delivery-status source contracts', () => {
  it('keeps send-sms on SUPABASE_URL and records MessageSid after the provider call', () => {
    const source = readFileSync('supabase/functions/send-sms/index.ts', 'utf8');
    expect(source.indexOf(".insert({\n        to_phone: formattedPhone")).toBeGreaterThan(-1);
    expect(source.indexOf(".insert({\n        to_phone: formattedPhone")).toBeLessThan(
      source.indexOf('api.twilio.com'),
    );
    expect(source.indexOf('api.twilio.com')).toBeLessThan(source.lastIndexOf('applyTwilioStatusToSmsLog'));
    expect(source).toContain('buildSmsStatusCallbackUrl');
    expect(source).toContain('isTwilioMessageSid');
    expect(source).not.toContain('TWILIO_WEBHOOK_URL');
    expect(source).not.toContain("headers.get('host')");
  });

  it('adds message_sid without opening sms_logs to anon or authenticated roles', () => {
    const migration = readFileSync(
      'supabase/migrations/20260830230000_add_twilio_sms_status_tracking.sql',
      'utf8',
    );
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS message_sid text');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS error_code text');
    expect(migration).toContain('CREATE UNIQUE INDEX IF NOT EXISTS sms_logs_message_sid_uidx');
    expect(migration).not.toMatch(/CREATE\s+POLICY/i);
    expect(migration).not.toMatch(/GRANT\s+/i);
    expect(isTwilioMessageSid(MESSAGE_SID)).toBe(true);
  });
});
