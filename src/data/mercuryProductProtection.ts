import rateCard from './mercuryProductProtectionRates.json';

/**
 * Mercury Platinum Product Protection retail rate card used by Harris Boat Works.
 *
 * Prices are CAD before HST. The year columns are the purchased Product
 * Protection term (1-5 years), not the customer's combined warranty total.
 * Prices were verified against HBW's current published rate card on
 * 2026-07-17. The supplied March 2025 Canadian Mercury plan material is the
 * source for contract wording and eligibility, not the retail prices.
 */

export const MERCURY_PLATINUM_BASE_COVERAGE_YEARS = rateCard.baseCoverageYears;
export const MERCURY_PLATINUM_MAX_TOTAL_YEARS = rateCard.maximumCombinedYears;
export const MERCURY_PLATINUM_MAX_PLAN_YEARS = rateCard.maximumPlanYears;
export const MERCURY_PLATINUM_RATE_CARD_LAST_VERIFIED = rateCard.lastVerified;
export const MERCURY_PRODUCT_PROTECTION_OFFICIAL_OVERVIEW_URL = rateCard.officialOverviewUrl;
export const MERCURY_PRODUCT_PROTECTION_CANADA_PLAN_TERMS_URL = rateCard.officialCanadaPlanTermsUrl;

export type PlatinumPlanYears = 1 | 2 | 3 | 4 | 5;

export interface MercuryPlatinumRateBand {
  hpMin: number;
  hpMax: number;
  label: string;
  prices: Record<PlatinumPlanYears, number>;
}

export const MERCURY_PLATINUM_RATES = rateCard.rates as MercuryPlatinumRateBand[];

export function getMercuryPlatinumRateBand(horsepower: number): MercuryPlatinumRateBand | null {
  if (!Number.isFinite(horsepower) || horsepower <= 0) return null;
  return MERCURY_PLATINUM_RATES.find(
    (band) => horsepower >= band.hpMin && horsepower <= band.hpMax,
  ) ?? null;
}

export function getMercuryPlatinumPlanPrice(
  horsepower: number,
  planYears: number,
): number | null {
  const band = getMercuryPlatinumRateBand(horsepower);
  if (!band || !Number.isInteger(planYears) || planYears < 1 || planYears > 5) return null;
  return band.prices[planYears as PlatinumPlanYears];
}

export function getMaximumPlatinumPlanYears(currentCoverageYears: number): number {
  const safeCurrentYears = Number.isFinite(currentCoverageYears)
    ? Math.max(0, currentCoverageYears)
    : MERCURY_PLATINUM_BASE_COVERAGE_YEARS;

  return Math.max(
    0,
    Math.min(
      MERCURY_PLATINUM_MAX_PLAN_YEARS,
      MERCURY_PLATINUM_MAX_TOTAL_YEARS - safeCurrentYears,
    ),
  );
}

/**
 * Return the exact Platinum plan price needed to move from the currently
 * included coverage to a requested combined total. Promotional years are
 * represented in currentCoverageYears, so they naturally reduce the paid plan
 * term and the result can never exceed Mercury's eight-year combined maximum.
 */
export function calculateMercuryPlatinumExtensionCost(
  horsepower: number,
  currentCoverageYears: number,
  targetTotalYears: number,
): number | null {
  if (targetTotalYears <= currentCoverageYears) return 0;
  if (targetTotalYears > MERCURY_PLATINUM_MAX_TOTAL_YEARS) return null;

  const planYears = targetTotalYears - currentCoverageYears;
  if (!Number.isInteger(planYears) || planYears > getMaximumPlatinumPlanYears(currentCoverageYears)) {
    return null;
  }

  return getMercuryPlatinumPlanPrice(horsepower, planYears);
}
