import { filterPromotionsForCountry, getPromotionRebateMatrix, type PromotionRecord } from "./promotion-context.ts";
import { isPromotionLive } from "./promo-dates.ts";
import { applyTradeCredit } from "./trade-credit.ts";

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

export interface PublicQuoteMotorContext {
  horsepower: number;
  family?: string | null;
  modelDisplay?: string | null;
  model?: string | null;
}

/** Mirror src/lib/promotion-eligibility: stock never gates; family/HP rules do. */
export function isMotorEligibleForPromotion(
  promotion: PromotionRecord,
  motor: PublicQuoteMotorContext,
): boolean {
  const details = asRecord(promotion.details);
  const rule = asRecord(details?.motor_eligibility);
  if (!rule) return true;
  if (!Number.isFinite(motor.horsepower)) return false;
  const minHp = asNumber(rule.min_hp);
  const maxHp = asNumber(rule.max_hp);
  if (minHp !== null && motor.horsepower < minHp) return false;
  if (maxHp !== null && motor.horsepower > maxHp) return false;
  const identity = `${motor.modelDisplay || ""} ${motor.model || ""} ${motor.family || ""}`.toLowerCase();
  const excluded = Array.isArray(rule.excluded_families) ? rule.excluded_families : [];
  return !excluded.some((family) =>
    typeof family === "string" && family.trim() !== "" && identity.includes(family.toLowerCase())
  );
}

export interface FactoryRebate {
  amount: number;
  promotionName: string;
  promotionId: string | null;
}

/**
 * First live, motor-eligible HP-matrix rebate, mirroring the configurator
 * (getRebateForHP). Only a `no_payments` selection suppresses the rebate;
 * promotional financing layers with it.
 */
export function resolveFactoryRebate(
  promotions: PromotionRecord[],
  motor: PublicQuoteMotorContext,
  input: { now?: Date; selectedPromoOption?: string | null } = {},
): FactoryRebate | null {
  if (input.selectedPromoOption === "no_payments") return null;
  if (!Number.isFinite(motor.horsepower) || motor.horsepower <= 0) return null;
  const now = input.now ?? new Date();
  for (const promotion of filterPromotionsForCountry(promotions, "CA")) {
    if (!isPromotionLive({ startDate: promotion.start_date, endDate: promotion.end_date, now })) continue;
    if (!isMotorEligibleForPromotion(promotion, motor)) continue;
    for (const tier of getPromotionRebateMatrix(promotion)) {
      const min = asNumber(tier.hp_min);
      const max = asNumber(tier.hp_max);
      const rebate = asNumber(tier.rebate);
      if (min === null || max === null || rebate === null || rebate <= 0) continue;
      if (motor.horsepower >= min && motor.horsepower <= max) {
        return {
          amount: round2(rebate),
          promotionName: typeof promotion.name === "string" && promotion.name.trim()
            ? promotion.name.trim()
            : "Mercury promotion",
          promotionId: typeof promotion.id === "string" ? promotion.id : null,
        };
      }
    }
  }
  return null;
}

export interface PublicQuotePricing {
  subtotal: number;
  factoryRebate: number;
  postRebateSubtotal: number;
  tradeInCredit: number;
  adjustedSubtotal: number;
  hst: number;
  finalPrice: number;
}

/** Rebate first (floored at 0), then trade credit capped at the remainder, then HST. */
export function computePublicQuotePricing(input: {
  subtotal: number;
  rebateAmount?: number | null;
  tradeEstimatedValue?: number | null;
  hasTradeIn?: boolean;
  hstRate?: number;
}): PublicQuotePricing {
  const subtotal = round2(Math.max(0, Number.isFinite(input.subtotal) ? input.subtotal : 0));
  const rebate = round2(Math.min(
    subtotal,
    Math.max(0, Number.isFinite(input.rebateAmount ?? NaN) ? (input.rebateAmount as number) : 0),
  ));
  const postRebateSubtotal = round2(subtotal - rebate);
  const applied = applyTradeCredit({
    preTradeSubtotal: postRebateSubtotal,
    estimatedValue: input.tradeEstimatedValue,
    hasTradeIn: input.hasTradeIn,
    taxRate: input.hstRate,
  });
  const adjustedSubtotal = round2(Math.max(0, applied.subtotal));
  const hst = round2(adjustedSubtotal * (input.hstRate ?? 0.13));
  return {
    subtotal,
    factoryRebate: rebate,
    postRebateSubtotal,
    tradeInCredit: round2(applied.credit),
    adjustedSubtotal,
    hst,
    finalPrice: round2(adjustedSubtotal + hst),
  };
}
