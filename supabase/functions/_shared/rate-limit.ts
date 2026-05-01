// Lightweight rate-limit helper for public Edge Functions.
// Wraps the existing public.check_rate_limit(_identifier, _action, _max_attempts, _window_minutes) RPC.
// Fail-open on errors so a transient DB issue never breaks public buyer flows.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.53.1";

export function getClientIdentifier(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

let _cached: SupabaseClient | null = null;
function getClient(): SupabaseClient | null {
  if (_cached) return _cached;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  _cached = createClient(url, key, { auth: { persistSession: false } });
  return _cached;
}

export interface RateLimitOptions {
  identifier?: string;       // explicit id (e.g. session id). Falls back to IP.
  action: string;            // short action key, e.g. "ai_chat"
  maxAttempts: number;
  windowMinutes: number;
}

/**
 * Returns true when the request is allowed; false when rate-limited.
 * Fail-open: returns true on any RPC error so we never block legitimate buyers.
 */
export async function checkRateLimit(
  req: Request,
  opts: RateLimitOptions,
): Promise<boolean> {
  const client = getClient();
  if (!client) return true;
  const identifier = (opts.identifier && opts.identifier.length > 0)
    ? opts.identifier
    : getClientIdentifier(req);
  try {
    const { data, error } = await client.rpc("check_rate_limit", {
      _identifier: identifier,
      _action: opts.action,
      _max_attempts: opts.maxAttempts,
      _window_minutes: opts.windowMinutes,
    });
    if (error) {
      console.warn(`[rate-limit] RPC error for ${opts.action}:`, error.message);
      return true;
    }
    return data !== false;
  } catch (e) {
    console.warn(`[rate-limit] exception for ${opts.action}:`, (e as Error).message);
    return true;
  }
}

export function rateLimitedResponse(
  corsHeaders: Record<string, string>,
  retryAfterSeconds = 60,
): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again in a moment.",
      code: "rate_limited",
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
