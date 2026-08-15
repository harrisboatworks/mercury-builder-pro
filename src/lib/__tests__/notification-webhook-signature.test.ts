import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  computeTwilioSignature,
  decideNotificationWebhook,
} from '../../../supabase/functions/_shared/twilio-signature.ts';

const AUTH_TOKEN = 'test-twilio-auth-token';
const WEBHOOK_URL = 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/notification-webhook';

function formBody(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

describe('notification-webhook Twilio signature', () => {
  it('accepts a valid signature and authorizes a MessageSid update', async () => {
    const params = {
      MessageSid: 'SM1234567890abcdef1234567890abcdef',
      MessageStatus: 'delivered',
      To: '+15555550100',
    };
    const signature = await computeTwilioSignature(AUTH_TOKEN, WEBHOOK_URL, params);

    await expect(
      decideNotificationWebhook({
        signature,
        rawBody: formBody(params),
        authToken: AUTH_TOKEN,
        webhookUrl: WEBHOOK_URL,
      }),
    ).resolves.toEqual({
      ok: true,
      messageSid: params.MessageSid,
      messageStatus: 'delivered',
      error: null,
    });
  });

  it('rejects an invalid signature with no mutation decision', async () => {
    const params = {
      MessageSid: 'SM1234567890abcdef1234567890abcdef',
      MessageStatus: 'delivered',
    };
    const decision = await decideNotificationWebhook({
      signature: 'not-a-valid-signature',
      rawBody: formBody(params),
      authToken: AUTH_TOKEN,
      webhookUrl: WEBHOOK_URL,
    });

    expect(decision).toEqual({
      ok: false,
      status: 403,
      error: 'Invalid Twilio signature',
    });
  });

  it('rejects a missing signature with no mutation decision', async () => {
    const params = {
      MessageSid: 'SM1234567890abcdef1234567890abcdef',
      MessageStatus: 'delivered',
    };
    const decision = await decideNotificationWebhook({
      signature: null,
      rawBody: formBody(params),
      authToken: AUTH_TOKEN,
      webhookUrl: WEBHOOK_URL,
    });

    expect(decision).toEqual({
      ok: false,
      status: 403,
      error: 'Missing Twilio signature',
    });
  });

  it('rejects a signed but malformed payload with no mutation decision', async () => {
    const params = { To: '+15555550100' };
    const signature = await computeTwilioSignature(AUTH_TOKEN, WEBHOOK_URL, params);
    const decision = await decideNotificationWebhook({
      signature,
      rawBody: formBody(params),
      authToken: AUTH_TOKEN,
      webhookUrl: WEBHOOK_URL,
    });

    expect(decision).toEqual({
      ok: false,
      status: 400,
      error: 'Invalid webhook data',
    });
  });

  it('does not treat a spoofed Host as the canonical webhook URL', async () => {
    const params = {
      MessageSid: 'SM1234567890abcdef1234567890abcdef',
      MessageStatus: 'delivered',
    };
    const attackerUrl = 'https://evil.example/functions/v1/notification-webhook';
    const attackerSignature = await computeTwilioSignature(AUTH_TOKEN, attackerUrl, params);

    await expect(
      decideNotificationWebhook({
        signature: attackerSignature,
        rawBody: formBody(params),
        authToken: AUTH_TOKEN,
        webhookUrl: WEBHOOK_URL,
      }),
    ).resolves.toMatchObject({ ok: false, status: 403 });
  });
});

describe('notification-webhook source contract', () => {
  const source = readFileSync('supabase/functions/notification-webhook/index.ts', 'utf8');

  it('validates the signature before creating the service-role client', () => {
    const decideAt = source.indexOf('decideNotificationWebhook');
    const rejectAt = source.indexOf('if (!decision.ok)');
    const clientAt = source.indexOf('createClient(');

    expect(decideAt).toBeGreaterThan(-1);
    expect(rejectAt).toBeGreaterThan(decideAt);
    expect(clientAt).toBeGreaterThan(rejectAt);
    expect(source).toContain("Deno.env.get('TWILIO_WEBHOOK_URL')");
    expect(source).not.toContain('X-Forwarded-Host');
    expect(source).not.toContain("headers.get('host')");
    expect(source).not.toContain("headers.get('Host')");
  });

  it('targets sms_logs by MessageSid rather than To', () => {
    expect(source).toContain(".eq('message_sid', decision.messageSid)");
    expect(source).not.toContain(".eq('to_phone'");
  });

  it('does not send a real SMS or webhook from this handler', () => {
    expect(source).not.toContain('api.twilio.com');
    expect(source).not.toContain('Messages.json');
  });
});
