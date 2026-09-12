/**
 * Twilio request-signature and outbound Messages.json helpers.
 * Algorithm: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * The canonical signed URL is always derived from TWILIO_WEBHOOK_URL. The
 * request URL contributes only the allowlisted sms_log_id correlation value;
 * proxy-controlled host and path values never participate in validation.
 */

export type TwilioFormValues = Readonly<
  Record<string, string | readonly string[]>
>;

export class TwilioWebhookConfigurationError extends Error {}
export class TwilioWebhookRequestError extends Error {}

const SMS_LOG_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MESSAGE_SID_PATTERN = /^SM[0-9a-f]{32}$/i;
const MAX_WEBHOOK_BODY_BYTES = 16 * 1024;

export function resolveConfiguredTwilioWebhookUrl(
  configuredUrl: string | null | undefined,
): string | null {
  const rawUrl = configuredUrl?.trim() ?? "";
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export type ResolvedTwilioWebhookUrl = {
  signedUrl: string;
  smsLogId: string | null;
};

export function resolveInboundTwilioWebhookUrl(
  configuredUrl: string | null | undefined,
  requestUrl: string,
): ResolvedTwilioWebhookUrl {
  const canonicalUrl = resolveConfiguredTwilioWebhookUrl(configuredUrl);
  if (!canonicalUrl) {
    throw new TwilioWebhookConfigurationError(
      "Twilio webhook is not configured",
    );
  }

  let incomingUrl: URL;
  try {
    incomingUrl = new URL(requestUrl);
  } catch {
    throw new TwilioWebhookRequestError("Invalid webhook URL");
  }

  const entries = [...incomingUrl.searchParams.entries()];
  if (entries.length === 0) {
    return { signedUrl: canonicalUrl, smsLogId: null };
  }
  if (
    entries.length !== 1 ||
    entries[0][0] !== "sms_log_id" ||
    !SMS_LOG_ID_PATTERN.test(entries[0][1])
  ) {
    throw new TwilioWebhookRequestError("Invalid webhook query");
  }

  const signedUrl = new URL(canonicalUrl);
  signedUrl.searchParams.set("sms_log_id", entries[0][1]);
  return {
    signedUrl: signedUrl.toString(),
    smsLogId: entries[0][1],
  };
}

export function parseTwilioFormBody(body: string): Record<string, string[]> {
  const parsed: Record<string, string[]> = {};
  for (const [key, value] of new URLSearchParams(body).entries()) {
    (parsed[key] ??= []).push(value);
  }
  return parsed;
}

export function buildTwilioSignaturePayload(
  webhookUrl: string,
  params: TwilioFormValues,
): string {
  let payload = webhookUrl;
  for (const key of Object.keys(params).sort()) {
    const rawValues = params[key];
    const values = Array.isArray(rawValues)
      ? [...new Set(rawValues)].sort()
      : [rawValues as string];
    for (const value of values) payload += key + value;
  }
  return payload;
}

export async function computeTwilioSignature(
  authToken: string,
  webhookUrl: string,
  params: TwilioFormValues,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(buildTwilioSignaturePayload(webhookUrl, params)),
  );
  let binary = "";
  for (const byte of new Uint8Array(signature)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function verifyTwilioSignature(input: {
  authToken: string;
  webhookUrl: string;
  signature: string;
  params: TwilioFormValues;
}): Promise<boolean> {
  const expected = await computeTwilioSignature(
    input.authToken,
    input.webhookUrl,
    input.params,
  );
  return timingSafeEqual(expected, input.signature);
}

function uniqueSemanticValue(
  params: Readonly<Record<string, readonly string[]>>,
  key: string,
  maxLength: number,
  required = false,
): string | null {
  const values = [...new Set(params[key] ?? [])].map((value) => value.trim());
  if (values.length > 1) {
    throw new TwilioWebhookRequestError(`Conflicting ${key} values`);
  }
  const value = values[0] ?? "";
  if (!value) {
    if (required) throw new TwilioWebhookRequestError(`Missing ${key}`);
    return null;
  }
  if (value.length > maxLength) {
    throw new TwilioWebhookRequestError(`Invalid ${key}`);
  }
  return value;
}

export type NotificationWebhookDecision =
  | { ok: false; status: 400 | 403 | 503; error: string }
  | {
      ok: true;
      messageSid: string;
      messageStatus: string;
      errorCode: string | null;
      errorMessage: string | null;
    };

export function readNotificationWebhookFields(
  rawBody: string,
): NotificationWebhookDecision {
  const params = parseTwilioFormBody(rawBody);
  try {
    const messageSid = uniqueSemanticValue(params, "MessageSid", 34, true)!;
    const messageStatus = uniqueSemanticValue(
      params,
      "MessageStatus",
      50,
      true,
    )!;
    if (!MESSAGE_SID_PATTERN.test(messageSid)) {
      return { ok: false, status: 400, error: "Invalid MessageSid" };
    }
    return {
      ok: true,
      messageSid,
      messageStatus,
      errorCode: uniqueSemanticValue(params, "ErrorCode", 20),
      errorMessage: uniqueSemanticValue(params, "ErrorMessage", 500),
    };
  } catch (error) {
    if (error instanceof TwilioWebhookRequestError) {
      return { ok: false, status: 400, error: error.message };
    }
    throw error;
  }
}

export async function decideNotificationWebhook(input: {
  signature: string | null;
  rawBody: string;
  authToken: string | null | undefined;
  webhookUrl: string;
}): Promise<NotificationWebhookDecision> {
  if (!input.authToken) {
    return { ok: false, status: 503, error: "Twilio webhook is not configured" };
  }
  if (!input.signature) {
    return { ok: false, status: 403, error: "Missing Twilio signature" };
  }

  const params = parseTwilioFormBody(input.rawBody);
  const valid = await verifyTwilioSignature({
    authToken: input.authToken,
    webhookUrl: input.webhookUrl,
    signature: input.signature,
    params,
  });
  if (!valid) {
    return { ok: false, status: 403, error: "Invalid Twilio signature" };
  }

  return readNotificationWebhookFields(input.rawBody);
}

export type TwilioWebhookGate =
  | { ok: false; status: 400 | 403 | 413 | 503; error: string }
  | { ok: true; rawBody: string; smsLogId: string | null };

export async function gateTwilioStatusCallback(
  request: Request,
  input: {
    authToken: string | null | undefined;
    configuredWebhookUrl: string | null | undefined;
  },
): Promise<TwilioWebhookGate> {
  if (!input.authToken) {
    return { ok: false, status: 503, error: "Twilio webhook is not configured" };
  }

  let resolved: ResolvedTwilioWebhookUrl;
  try {
    resolved = resolveInboundTwilioWebhookUrl(
      input.configuredWebhookUrl,
      request.url,
    );
  } catch (error) {
    if (error instanceof TwilioWebhookConfigurationError) {
      return { ok: false, status: 503, error: error.message };
    }
    if (error instanceof TwilioWebhookRequestError) {
      return { ok: false, status: 400, error: error.message };
    }
    return { ok: false, status: 400, error: "Invalid webhook URL" };
  }

  const signature = request.headers.get("X-Twilio-Signature");
  if (!signature) {
    return { ok: false, status: 403, error: "Missing Twilio signature" };
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BODY_BYTES) {
    return { ok: false, status: 413, error: "Webhook body too large" };
  }

  const valid = await verifyTwilioSignature({
    authToken: input.authToken,
    webhookUrl: resolved.signedUrl,
    signature,
    params: parseTwilioFormBody(rawBody),
  });
  if (!valid) {
    return { ok: false, status: 403, error: "Invalid Twilio signature" };
  }

  return { ok: true, rawBody, smsLogId: resolved.smsLogId };
}
