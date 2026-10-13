import { filterPromotionsForCountry, getPromotionOptions, type PromotionRecord } from "./promotion-context.ts";
import { isPromotionLive } from "./promo-dates.ts";
import {
  DEALERPLAN_FEE_CAD,
  FINANCING_MINIMUM_CAD,
  meetsAmountFinancedMinimum,
  monthlyPaymentFromAprPercent,
} from "./public-quote-financing.ts";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function asNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface LivePromoFinancingRate {
  rate: number;
  months: number;
  minimum: number;
  exclusive: boolean;
}

/** First live CA-market special_financing rates[0] from the loaded promotions, if any. */
export function getLivePromoFinancingRate(
  promotions: PromotionRecord[],
  now: Date = new Date(),
): LivePromoFinancingRate | null {
  for (const promotion of filterPromotionsForCountry(promotions, "CA")) {
    if (!isPromotionLive({ startDate: promotion.start_date, endDate: promotion.end_date, now })) continue;
    for (const option of getPromotionOptions(promotion)) {
      if (option.id !== "special_financing" || !Array.isArray(option.rates)) continue;
      const rawRate = asRecord(option.rates[0]);
      if (!rawRate) continue;
      const rate = asNumber(rawRate.rate);
      const months = asNumber(rawRate.months);
      if (rate === null || rate < 0 || months === null || months <= 0) continue;
      const minimum = asNumber(
        rawRate.minAmount ?? rawRate.minimum_amount ?? option.minimum_amount ?? option.minAmount,
      ) ?? FINANCING_MINIMUM_CAD;
      const exclusive = rawRate.minimum_amount_exclusive === true
        || rawRate.minimumAmountExclusive === true
        || option.minimum_amount_exclusive === true
        || option.minimumAmountExclusive === true;
      return { rate, months, minimum, exclusive };
    }
  }
  return null;
}

/**
 * Financing-dependent promo options require the standing before-tax
 * minimum. Below it they fall back to cash_rebate so the factory rebate
 * still applies. `beforeTaxSubtotal` must be the post-rebate, post-trade
 * subtotal on the pricing basis (see calcPricing adjustedSubtotal).
 */
export function resolveAgentPromoFallback(input: {
  requestedOption: string | null;
  beforeTaxSubtotal: number;
  minimum?: number;
}): { effectiveOption: string | null; fellBack: boolean; warning: string | null } {
  const minimum = input.minimum ?? FINANCING_MINIMUM_CAD;
  const financingDependent = input.requestedOption === "special_financing"
    || input.requestedOption === "no_payments";
  if (!financingDependent || !(input.beforeTaxSubtotal < minimum)) {
    return { effectiveOption: input.requestedOption, fellBack: false, warning: null };
  }
  return {
    effectiveOption: "cash_rebate",
    fellBack: true,
    warning: `Financing requires at least $${minimum.toLocaleString("en-CA")} CAD before tax; switched the promotion to cash_rebate so the factory rebate still applies.`,
  };
}

export interface AgentFinancingResult {
  financing: {
    rate: number;
    term_months: number;
    monthly_payment: number;
    total_cost: number;
    amount_financed: number;
  } | null;
  warning?: string;
}

/**
 * Agent promo financing under the §1 rule: standing before-tax minimum AND
 * promo minimum on the amount financed (finalPrice + DealerPlan fee).
 * Rate/term come only from the live promotion; caller rates are ignored.
 */
export function buildAgentFinancing(input: {
  beforeTaxSubtotal: number;
  finalPrice: number;
  promotions: PromotionRecord[];
  now?: Date;
}): AgentFinancingResult {
  const live = getLivePromoFinancingRate(input.promotions, input.now);
  if (!live) {
    return {
      financing: null,
      warning: "No live promotional financing rate is available; no rate was substituted.",
    };
  }
  const amountFinanced = round2(input.finalPrice + DEALERPLAN_FEE_CAD);
  if (input.beforeTaxSubtotal < FINANCING_MINIMUM_CAD) {
    return {
      financing: null,
      warning: `Financing requires at least $${FINANCING_MINIMUM_CAD.toLocaleString("en-CA")} CAD before tax`,
    };
  }
  if (!meetsAmountFinancedMinimum(amountFinanced, live.minimum, live.exclusive)) {
    return {
      financing: null,
      warning: live.exclusive
        ? `Promotion requires a loan above $${live.minimum.toLocaleString("en-CA")} CAD`
        : `Promotion requires a loan of at least $${live.minimum.toLocaleString("en-CA")} CAD`,
    };
  }
  const monthlyPayment = round2(monthlyPaymentFromAprPercent(amountFinanced, live.rate, live.months));
  return {
    financing: {
      rate: live.rate,
      term_months: live.months,
      monthly_payment: monthlyPayment,
      total_cost: round2(monthlyPayment * live.months),
      amount_financed: amountFinanced,
    },
  };
}
