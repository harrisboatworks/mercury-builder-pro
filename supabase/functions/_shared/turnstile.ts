export const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const MISSING_TURNSTILE = "Captcha verification required";

export function parseTurnstileToken(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(MISSING_TURNSTILE);
  }
  const token = value.trim();
  if (token.length < 20 || token.length > 2048) {
    throw new Error(MISSING_TURNSTILE);
  }
  return token;
}

export async function verifyTurnstileToken(options: {
  token: unknown;
  remoteip?: string | null;
  secret: string | null | undefined;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  const token = parseTurnstileToken(options.token);
  const secret = options.secret;
  if (!secret) {
    throw new Error(MISSING_TURNSTILE);
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (options.remoteip) body.set("remoteip", options.remoteip);

  const fetchImpl = options.fetchImpl ?? fetch;
  let payload: { success?: unknown };
  try {
    const response = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
    });
    if (!response.ok) {
      throw new Error(MISSING_TURNSTILE);
    }
    payload = await response.json();
  } catch {
    throw new Error(MISSING_TURNSTILE);
  }

  if (payload.success !== true) {
    throw new Error(MISSING_TURNSTILE);
  }
}
