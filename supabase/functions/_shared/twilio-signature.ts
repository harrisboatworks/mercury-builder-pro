/**
 * Twilio request-signature helpers.
 * Algorithm: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * The signed URL is the public function URL Twilio was given, not the Edge
 * runtime's internal req.url. Host and path come from SUPABASE_URL; the
 * incoming request contributes only its query string (Twilio includes it).
 */

export type TwilioFormValues = Readonly<
  Record<string, string | readonly string[]>
>;

export function resolveTwilioWebhookUrl(
  supabaseUrl: string | null | undefined,
  requestUrl: string,
): string | null {
  const origin = supabaseUrl?.trim().replace(/\/$/, "") ?? "";
  if (!origin) return null;

  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      return null;
    }
  } catch {
    return null;
  }

  let search = "";
  const queryAt = requestUrl.indexOf("?");
  if (queryAt !== -1) {
    search = requestUrl.slice(queryAt);
    const hashAt = search.indexOf("#");
    if (hashAt !== -1) search = search.slice(0, hashAt);
  }

  return `${origin}/functions/v1/notification-webhook${search}`;
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

export type TwilioWebhookGate =
  | { ok: false; status: 403 | 503; error: string }
  | { ok: true; rawBody: string };

export async function gateTwilioStatusCallback(
  request: Request,
  input: {
    authToken: string | null | undefined;
    supabaseUrl: string | null | undefined;
  },
): Promise<TwilioWebhookGate> {
  if (!input.authToken) {
    return { ok: false, status: 503, error: "Twilio webhook is not configured" };
  }

  const webhookUrl = resolveTwilioWebhookUrl(input.supabaseUrl, request.url);
  if (!webhookUrl) {
    return { ok: false, status: 503, error: "Twilio webhook is not configured" };
  }

  const signature = request.headers.get("X-Twilio-Signature");
  if (!signature) {
    return { ok: false, status: 403, error: "Missing Twilio signature" };
  }

  const rawBody = await request.text();
  const valid = await verifyTwilioSignature({
    authToken: input.authToken,
    webhookUrl,
    signature,
    params: parseTwilioFormBody(rawBody),
  });
  if (!valid) {
    return { ok: false, status: 403, error: "Invalid Twilio signature" };
  }

  return { ok: true, rawBody };
}
