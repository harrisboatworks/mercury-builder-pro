import { describe, expect, it, vi } from 'vitest';

import {
  MISSING_TURNSTILE,
  TURNSTILE_VERIFY_URL,
  parseTurnstileToken,
  verifyTurnstileToken,
} from '../../../supabase/functions/_shared/turnstile.ts';

const TOKEN = '0'.repeat(40);

describe('Turnstile verification', () => {
  it('rejects missing or short tokens before any network call', () => {
    const fetchImpl = vi.fn();
    expect(() => parseTurnstileToken(undefined)).toThrow(MISSING_TURNSTILE);
    expect(() => parseTurnstileToken('short')).toThrow(MISSING_TURNSTILE);
    expect(() => parseTurnstileToken(TOKEN)).not.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('does not treat a missing secret as success', async () => {
    const fetchImpl = vi.fn();
    await expect(verifyTurnstileToken({
      token: TOKEN,
      secret: '',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })).rejects.toThrow(MISSING_TURNSTILE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('fails closed when Cloudflare denies or is unreachable', async () => {
    await expect(verifyTurnstileToken({
      token: TOKEN,
      secret: 'secret',
      fetchImpl: (async () => new Response(JSON.stringify({ success: false }), { status: 200 })) as typeof fetch,
    })).rejects.toThrow(MISSING_TURNSTILE);

    await expect(verifyTurnstileToken({
      token: TOKEN,
      secret: 'secret',
      fetchImpl: (async () => { throw new Error('offline'); }) as typeof fetch,
    })).rejects.toThrow(MISSING_TURNSTILE);
  });

  it('accepts only an explicit Cloudflare success payload', async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(TURNSTILE_VERIFY_URL);
      expect(init?.method).toBe('POST');
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });
    await expect(verifyTurnstileToken({
      token: TOKEN,
      secret: 'secret',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })).resolves.toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
