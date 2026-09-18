import { beforeEach, describe, expect, it, vi } from 'vitest';

const setHeader = vi.fn();
const rpc = vi.fn(() => ({ setHeader }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc },
}));

import { getSoftLeadReference } from './soft-lead-reference';

describe('getSoftLeadReference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the quote session as both the RPC argument and capability header', async () => {
    setHeader.mockResolvedValue({ data: 'HBW-48213', error: null });

    await expect(getSoftLeadReference('qa_0123456789abcdef01234567')).resolves.toBe('HBW-48213');
    expect(rpc).toHaveBeenCalledWith('get_soft_lead_reference', {
      p_session_id: 'qa_0123456789abcdef01234567',
    });
    expect(setHeader).toHaveBeenCalledWith('x-quote-session-id', 'qa_0123456789abcdef01234567');
  });

  it.each(['HBW-123456', 'HBW-ABCDE', '', null])('hides a non-canonical result: %s', async (data) => {
    setHeader.mockResolvedValue({ data, error: null });
    await expect(getSoftLeadReference('qa_0123456789abcdef01234567')).resolves.toBeNull();
  });

  it('hides RPC failures', async () => {
    setHeader.mockResolvedValue({ data: null, error: new Error('unavailable') });
    await expect(getSoftLeadReference('qa_0123456789abcdef01234567')).resolves.toBeNull();
  });
});