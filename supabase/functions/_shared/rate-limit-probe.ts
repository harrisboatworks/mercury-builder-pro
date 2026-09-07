export type RateLimitProbeClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

export type RateLimitProbeOptions = {
  identifier: string;
  action: string;
  maxAttempts: number;
  windowMinutes: number;
  failClosed?: boolean;
};

/**
 * Probe the shared check_rate_limit RPC.
 * Legacy default is fail-open so unrelated public callers keep working.
 */
export async function probeRateLimit(
  client: RateLimitProbeClient | null,
  opts: RateLimitProbeOptions,
): Promise<boolean> {
  const failClosed = opts.failClosed === true;
  if (!client) return !failClosed;
  try {
    const { data, error } = await client.rpc("check_rate_limit", {
      _identifier: opts.identifier,
      _action: opts.action,
      _max_attempts: opts.maxAttempts,
      _window_minutes: opts.windowMinutes,
    });
    if (error) {
      console.warn(`[rate-limit] RPC error for ${opts.action}`);
      return failClosed ? false : true;
    }
    return data !== false;
  } catch {
    console.warn(`[rate-limit] exception for ${opts.action}`);
    return failClosed ? false : true;
  }
}
