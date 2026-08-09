// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc },
}));

import { persistSoftLeadQuote } from './soft-lead-save';

describe('persistSoftLeadQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('uses the atomic soft-lead RPC and returns its canonical row ID', async () => {
    rpc.mockResolvedValue({ data: '11111111-1111-4111-8111-111111111111', error: null });

    await expect(persistSoftLeadQuote({
      sessionId: 'qa_0123456789abcdef01234567',
      quoteState: { motor: { id: 'motor-1' } },
    })).resolves.toBe('11111111-1111-4111-8111-111111111111');

    expect(rpc).toHaveBeenCalledWith('upsert_soft_lead_quote', {
      p_quote_state: { motor: { id: 'motor-1' } },
      p_session_id: 'qa_0123456789abcdef01234567',
    });
  });

  it('retries once after a transient failure', async () => {
    vi.useFakeTimers();
    rpc
      .mockResolvedValueOnce({ data: null, error: new Error('temporary failure') })
      .mockResolvedValueOnce({ data: '22222222-2222-4222-8222-222222222222', error: null });

    const result = persistSoftLeadQuote({
      sessionId: 'qa_0123456789abcdef01234567',
      quoteState: { motor: { id: 'motor-1' } },
    });
    await vi.advanceTimersByTimeAsync(250);

    await expect(result).resolves.toBe('22222222-2222-4222-8222-222222222222');
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it('fails after the bounded retry when persistence remains unavailable', async () => {
    vi.useFakeTimers();
    const failure = new Error('persistent failure');
    rpc.mockResolvedValue({ data: null, error: failure });

    const result = persistSoftLeadQuote({
      sessionId: 'qa_0123456789abcdef01234567',
      quoteState: { motor: { id: 'motor-1' } },
    });
    const expectation = expect(result).rejects.toBe(failure);
    await vi.advanceTimersByTimeAsync(250);

    await expectation;
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});
