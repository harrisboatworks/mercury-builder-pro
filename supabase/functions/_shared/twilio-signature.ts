/**
 * Twilio request-signature helpers.
 * Algorithm: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * Do not build the signed URL from Host / X-Forwarded-Host. Callers must pass
 * the configured production webhook URL (TWILIO_WEBHOOK_URL).
 */

export function parseTwilioFormBody(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const parsed: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    parsed[key] = value;
  }
  return parsed;
}

export function buildTwilioSignaturePayload(
  webhookUrl: string,
  params: Record<string, string>,
): string {
  const keys = Object.keys(params).sort();
  return webhookUrl + keys.map((key) => key + params[key]).join('');
}

export async function computeTwilioSignature(
  authToken: string,
  webhookUrl: string,
  params: Record<string, string>,
): Promise<string> {
  const payload = buildTwilioSignaturePayload(webhookUrl, params);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const bytes = new Uint8Array(signature);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function verifyTwilioSignature(input: {
  authToken: string;
  webhookUrl: string;
  signature: string;
  params: Record<string, string>;
}): Promise<boolean> {
  const expected = await computeTwilioSignature(
    input.authToken,
    input.webhookUrl,
    input.params,
  );
  return timingSafeEqual(expected, input.signature);
}

export type NotificationWebhookDecision =
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      messageSid: string;
      messageStatus: string;
      error: string | null;
    };

export async function decideNotificationWebhook(input: {
  signature: string | null;
  rawBody: string;
  authToken: string | null;
  webhookUrl: string | null;
}): Promise<NotificationWebhookDecision> {
  if (!input.authToken || !input.webhookUrl) {
    return {
      ok: false,
      status: 503,
      error: 'Twilio webhook is not configured',
    };
  }

  if (!input.signature) {
    return { ok: false, status: 403, error: 'Missing Twilio signature' };
  }

  const params = parseTwilioFormBody(input.rawBody);
  const valid = await verifyTwilioSignature({
    authToken: input.authToken,
    webhookUrl: input.webhookUrl,
    signature: input.signature,
    params,
  });

  if (!valid) {
    return { ok: false, status: 403, error: 'Invalid Twilio signature' };
  }

  const messageSid = params.MessageSid?.trim() || '';
  const messageStatus = params.MessageStatus?.trim() || '';
  if (!messageSid || !messageStatus) {
    return { ok: false, status: 400, error: 'Invalid webhook data' };
  }

  return {
    ok: true,
    messageSid,
    messageStatus,
    error: params.ErrorMessage?.trim() || null,
  };
}
