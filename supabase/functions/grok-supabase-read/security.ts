export type AuthorizationResult = "ok" | "missing_config" | "missing" | "invalid";

export function extractBearer(authorization: string | null) {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}

async function digest(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

export async function timingSafeTokenEqual(provided: string, expected: string) {
  const [left, right] = await Promise.all([digest(provided), digest(expected)]);
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i += 1) difference |= left[i] ^ right[i];
  return difference === 0;
}

export async function authorize(
  authorization: string | null,
  expectedToken: string | undefined,
): Promise<AuthorizationResult> {
  if (!expectedToken || expectedToken.length < 32) return "missing_config";
  const provided = extractBearer(authorization);
  if (!provided) return "missing";
  return await timingSafeTokenEqual(provided, expectedToken) ? "ok" : "invalid";
}

export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number, windowMs: number) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  allow(identifier: string, now = Date.now()) {
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(identifier) ?? []).filter((stamp) => stamp > cutoff);
    if (recent.length >= this.maxAttempts) {
      this.hits.set(identifier, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(identifier, recent);
    if (this.hits.size > 500) {
      for (const [key, values] of this.hits.entries()) {
        if (!values.some((stamp) => stamp > cutoff)) this.hits.delete(key);
      }
    }
    return true;
  }
}
