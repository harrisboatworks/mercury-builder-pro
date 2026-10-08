import { trackEvent } from '@/lib/analytics';
import type { HBWValuationFailure } from '@/lib/trade-valuation';

export type StandaloneTradeEvent =
  | 'standalone_trade_estimate_requested'
  | 'standalone_trade_estimate_succeeded'
  | 'standalone_trade_estimate_failed'
  | 'standalone_trade_report_opened'
  | 'standalone_trade_quote_started'
  | 'standalone_trade_reset';

/** Only a generated funnel UUID and an enumerated failure leave the checker. */
export function trackStandaloneTrade(
  event: StandaloneTradeEvent,
  funnelId: string,
  failure?: HBWValuationFailure,
): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(funnelId)) return;
  const params: Record<string, string> = { funnel_id: funnelId, source: 'standalone_checker' };
  if (failure && ['rate_limited', 'input_rejected', 'unavailable'].includes(failure)) params.failure_reason = failure;
  try {
    trackEvent(event, params);
  } catch {
    // Analytics must never prevent an estimate, reset or quote handoff.
  }
}
