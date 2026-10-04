import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackEvent } from '@/lib/analytics';
import { trackStandaloneTrade } from './trade-in-analytics';

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
const id = 'a1b2c3d4-1234-4abc-8123-123456789abc';

beforeEach(() => vi.resetAllMocks());

describe('standalone trade analytics privacy and availability', () => {
  it('sends only generated correlation and an enumerated failure', () => {
    trackStandaloneTrade('standalone_trade_estimate_failed', id, 'rate_limited');
    expect(trackEvent).toHaveBeenCalledWith('standalone_trade_estimate_failed', {
      funnel_id: id, source: 'standalone_checker', failure_reason: 'rate_limited',
    });
  });

  it('rejects a contact or asset identifier supplied instead of a generated ID', () => {
    trackStandaloneTrade('standalone_trade_estimate_requested', 'customer@example.test');
    trackStandaloneTrade('standalone_trade_estimate_requested', 'SERIAL123456');
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('keeps estimate and quote actions available when analytics throws', () => {
    vi.mocked(trackEvent).mockImplementation(() => { throw new Error('blocked analytics'); });
    expect(() => trackStandaloneTrade('standalone_trade_quote_started', id)).not.toThrow();
  });
});
