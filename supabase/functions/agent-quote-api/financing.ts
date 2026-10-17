import { isPromotionLive } from '../_shared/promo-dates.ts';

// Deployment-local standard tiers, parity-tested against finance-policy.json.
const STANDARD_APR_UNDER_10000 = 8.99;
const STANDARD_APR_AT_LEAST_10000 = 7.99;
const STANDARD_TERM_MONTHS = 60;

export interface AgentFinancingPromotion {
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  promo_options?: {
    options?: Array<{
      id: string;
      minimum_amount?: number;
      minimum_amount_exclusive?: boolean;
      rates?: Array<{ rate: number; months: number; minAmount?: number; minimum_amount?: number }>;
    }>;
  } | null;
}

export function resolveAgentFinancing(input: {
  promotion: AgentFinancingPromotion | null;
  amount: number;
  requestedRate?: number;
  requestedTerm?: number;
  now?: Date;
}): { rate: number; term: number; promotional: boolean } {
  const { promotion, amount } = input;
  const standard = {
    rate: amount < 10000 ? STANDARD_APR_UNDER_10000 : STANDARD_APR_AT_LEAST_10000,
    term: STANDARD_TERM_MONTHS,
    promotional: false,
  };
  if (!promotion || promotion.is_active === false || !isPromotionLive({
    startDate: promotion.start_date, endDate: promotion.end_date, now: input.now,
  })) return standard;

  const option = promotion.promo_options?.options?.find((item) => item.id === 'special_financing');
  if (!option) return standard;
  const minimum = option.minimum_amount ?? 5000;
  if (option.minimum_amount_exclusive ? amount <= minimum : amount < minimum) return standard;
  const rates = (option.rates || []).filter((item) =>
    Number.isFinite(item.rate) && item.rate >= 0 &&
    Number.isInteger(item.months) && item.months > 0 &&
    amount >= (item.minAmount ?? item.minimum_amount ?? minimum));
  // A caller may select a published rate/term, but cannot invent an offer.
  const selected = rates.find((item) =>
    (input.requestedRate === undefined || item.rate === input.requestedRate) &&
    (input.requestedTerm === undefined || item.months === input.requestedTerm));
  if (!selected) return standard;
  return { rate: selected.rate, term: selected.months, promotional: true };
}