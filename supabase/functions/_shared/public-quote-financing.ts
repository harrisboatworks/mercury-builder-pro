import type { FinancingRecord } from "./customer-knowledge-context.ts";
import {
  getPromotionCombinationMode,
  getPromotionOptions,
  type PromotionRecord,
} from "./promotion-context.ts";

export const PUBLIC_QUOTE_FINANCING_POLICY_VERSION = "public-quote-financing-v2-2026-08-15";
export const DEALERPLAN_FEE_CAD = 349;
export const FINANCING_MINIMUM_CAD = 5000;
export const MAXIMUM_AMORTIZATION_MONTHS = 240;

type JsonRecord = Record<string, unknown>;

export interface PublicQuoteFinancingOffer {
  id: string;
  name: string;
  provider: string;
  source: "standing" | "promotion";
  apr_percent: number;
  annual_rate_decimal: number;
  contract_term_months: number;
  amortization_months: number;
  maximum_amortization_months: number;
  minimum_before_tax_cad: number;
  ends_at: string | null;
  combination_mode?: string;
  eligible: boolean;
  ineligibility_reason?: string;
  monthly_payment?: number;
}

export interface PublicQuoteFinancingResult {
  policy_version: string;
  available: boolean;
  eligible: boolean;
  reason?: string;
  selected_offer_id?: string;
  selected_offer_applied?: boolean;
  offer?: PublicQuoteFinancingOffer;
  available_offers: PublicQuoteFinancingOffer[];
  eligibility_subtotal_before_tax: number;
  finance_fee: number;
  amount_financed: number;
  apr?: number;
  apr_percent?: number;
  annual_rate_decimal?: number;
  apr_label?: string;
  contract_term_months?: number;
  amortization_months?: number;
  maximum_amortization_months?: number;
  term_months?: number;
  monthly_payment?: number;
  note?: string;
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function asNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseDateBoundary(value: string | null | undefined, endOfDay: boolean): Date | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T${endOfDay ? "23:59:59" : "00:00:00"}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function monthlyPaymentFromAprPercent(
  principal: number,
  aprPercent: number,
  months: number,
): number {
  const periodicRate = aprPercent / 100 / 12;
  if (periodicRate === 0) return principal / months;
  return (principal * periodicRate) /
    (1 - Math.pow(1 + periodicRate, -months));
}

function standingOffers(
  financing: FinancingRecord[],
  beforeTaxSubtotal: number,
  now: Date,
): PublicQuoteFinancingOffer[] {
  return financing.flatMap((record, index) => {
    if (record.is_active === false) return [];
    const endsAt = parseDateBoundary(record.promo_end_date, true);
    if (record.promo_end_date && (!endsAt || endsAt < now)) return [];
    const aprPercent = asNumber(record.rate);
    const term = asNumber(record.term_months);
    if (aprPercent === null || aprPercent < 0 || term === null || term <= 0) return [];

    const minimum = asNumber(record.min_amount) ?? FINANCING_MINIMUM_CAD;
    const eligible = beforeTaxSubtotal >= minimum;
    return [{
      id: `standing:${record.id || index}`,
      name: asString(record.name) || "Current standing financing",
      provider: /td auto/i.test(record.name || "") ? "TD Auto Finance via DealerPlan" : "DealerPlan lender",
      source: "standing" as const,
      apr_percent: aprPercent,
      annual_rate_decimal: aprPercent / 100,
      contract_term_months: Math.min(term, 60),
      amortization_months: term,
      maximum_amortization_months: MAXIMUM_AMORTIZATION_MONTHS,
      minimum_before_tax_cad: minimum,
      ends_at: record.promo_end_date || null,
      eligible,
      ...(eligible ? {} : {
        ineligibility_reason: `Financing requires at least $${minimum.toLocaleString("en-CA")} CAD before tax`,
      }),
    }];
  });
}

function promotionalOffers(
  promotions: PromotionRecord[],
  beforeTaxSubtotal: number,
  motorInStock: boolean,
  now: Date,
): PublicQuoteFinancingOffer[] {
  const offers: PublicQuoteFinancingOffer[] = [];
  for (const promotion of promotions) {
    const details = asRecord(promotion.details);
    const market = asRecord(details?.market);
    const country = asString(market?.country)?.toUpperCase();
    if (country && country !== "CA") continue;
    const startsAt = parseDateBoundary(promotion.start_date, false);
    const endsAt = parseDateBoundary(promotion.end_date, true);
    if (promotion.start_date && (!startsAt || startsAt > now)) continue;
    if (promotion.end_date && (!endsAt || endsAt < now)) continue;
    const eligibility = asRecord(details?.eligibility);
    const backordersQualify = eligibility?.backorders_qualify !== false;
    let promotionRateIndex = 0;

    for (const option of getPromotionOptions(promotion)) {
      if (option.id !== "special_financing" || !Array.isArray(option.rates)) continue;
      for (const rawRate of option.rates) {
        const offerIndex = promotionRateIndex++;
        const rate = asRecord(rawRate);
        if (!rate) continue;
        const aprPercent = asNumber(rate.rate);
        const months = asNumber(rate.months);
        if (aprPercent === null || aprPercent < 0 || months === null || months <= 0) continue;

        const minimum = asNumber(rate.minAmount ?? rate.minimum_amount) ?? FINANCING_MINIMUM_CAD;
        const minimumMet = beforeTaxSubtotal >= minimum;
        const stockMet = motorInStock || backordersQualify;
        const eligible = minimumMet && stockMet;
        const reason = !minimumMet
          ? `Promotion requires at least $${minimum.toLocaleString("en-CA")} CAD before tax`
          : !stockMet
          ? "Promotion does not apply to backordered motors"
          : undefined;
        offers.push({
          id: `promotion:${promotion.id || "active"}:${offerIndex}`,
          name: `${promotion.name || "Current Mercury promotion"} — ${aprPercent}% for ${months} months`,
          provider: "Mercury promotion financing via DealerPlan",
          source: "promotion",
          apr_percent: aprPercent,
          annual_rate_decimal: aprPercent / 100,
          contract_term_months: months,
          amortization_months: months,
          maximum_amortization_months: months,
          minimum_before_tax_cad: minimum,
          ends_at: promotion.end_date || null,
          combination_mode: getPromotionCombinationMode(promotion),
          eligible,
          ...(reason ? { ineligibility_reason: reason } : {}),
        });
      }
    }
  }
  return offers;
}

function defaultStandingOffer(offers: PublicQuoteFinancingOffer[]): PublicQuoteFinancingOffer | null {
  const eligibleStanding = offers.filter((offer) => offer.source === "standing" && offer.eligible);
  return eligibleStanding.find((offer) => /td auto/i.test(offer.name)) || eligibleStanding[0] || null;
}

export function buildPublicQuoteFinancing(input: {
  beforeTaxSubtotal: number;
  finalPriceWithTax: number;
  financing: FinancingRecord[];
  promotions: PromotionRecord[];
  motorInStock: boolean;
  selectedOfferId?: string | null;
  now?: Date;
}): PublicQuoteFinancingResult {
  const now = input.now || new Date();
  const amountFinanced = round2(input.finalPriceWithTax + DEALERPLAN_FEE_CAD);
  const offers = [
    ...standingOffers(input.financing, input.beforeTaxSubtotal, now),
    ...promotionalOffers(input.promotions, input.beforeTaxSubtotal, input.motorInStock, now),
  ].map((offer) => ({
    ...offer,
    ...(offer.eligible
      ? { monthly_payment: round2(monthlyPaymentFromAprPercent(amountFinanced, offer.apr_percent, offer.amortization_months)) }
      : {}),
  }));

  const selected = input.selectedOfferId
    ? offers.find((offer) => offer.id === input.selectedOfferId) || null
    : null;
  const fallback = defaultStandingOffer(offers);
  const applied = selected?.eligible ? selected : fallback;

  if (!offers.length) {
    return {
      policy_version: PUBLIC_QUOTE_FINANCING_POLICY_VERSION,
      available: false,
      eligible: false,
      reason: "Current financing terms are unavailable; no stale fallback rate was applied",
      available_offers: [],
      eligibility_subtotal_before_tax: round2(input.beforeTaxSubtotal),
      finance_fee: DEALERPLAN_FEE_CAD,
      amount_financed: 0,
    };
  }

  if (!applied) {
    const minimum = offers.reduce(
      (lowest, offer) => Math.min(lowest, offer.minimum_before_tax_cad),
      FINANCING_MINIMUM_CAD,
    );
    const onlyBackorderIneligible = offers.length > 0 && offers.every(
      (offer) => offer.ineligibility_reason === "Promotion does not apply to backordered motors",
    );
    return {
      policy_version: PUBLIC_QUOTE_FINANCING_POLICY_VERSION,
      available: true,
      eligible: false,
      reason: input.selectedOfferId && selected && !selected.eligible
        ? selected.ineligibility_reason
        : onlyBackorderIneligible
        ? "Promotion does not apply to backordered motors"
        : `Financing requires at least $${minimum.toLocaleString("en-CA")} CAD before tax`,
      selected_offer_id: input.selectedOfferId || undefined,
      selected_offer_applied: false,
      available_offers: offers,
      eligibility_subtotal_before_tax: round2(input.beforeTaxSubtotal),
      finance_fee: DEALERPLAN_FEE_CAD,
      amount_financed: 0,
    };
  }

  const requestedOfferMissing = Boolean(input.selectedOfferId && !selected);
  const requestedOfferIneligible = Boolean(input.selectedOfferId && selected && !selected.eligible);
  return {
    policy_version: PUBLIC_QUOTE_FINANCING_POLICY_VERSION,
    available: true,
    eligible: true,
    ...(requestedOfferMissing ? { reason: "Requested financing offer was not found; current standing offer applied" } : {}),
    ...(requestedOfferIneligible ? { reason: `${selected?.ineligibility_reason}; current standing offer applied` } : {}),
    selected_offer_id: applied.id,
    selected_offer_applied: Boolean(input.selectedOfferId && selected?.eligible),
    offer: applied,
    available_offers: offers,
    eligibility_subtotal_before_tax: round2(input.beforeTaxSubtotal),
    finance_fee: DEALERPLAN_FEE_CAD,
    amount_financed: amountFinanced,
    apr: applied.annual_rate_decimal,
    apr_percent: applied.apr_percent,
    annual_rate_decimal: applied.annual_rate_decimal,
    apr_label: `${applied.apr_percent.toFixed(2)}%`,
    contract_term_months: applied.contract_term_months,
    amortization_months: applied.amortization_months,
    maximum_amortization_months: applied.maximum_amortization_months,
    term_months: applied.amortization_months,
    monthly_payment: applied.monthly_payment,
    note: `${applied.provider}. Estimate only; approval and final terms are determined by the lender.`,
  };
}
