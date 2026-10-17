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
export type GoldUpgradeYears = 1 | 2 | 3 | 4 | 5;

export interface MercuryPlatinumRateBand {
  hpMin: number;
  hpMax: number;
  label: string;
  prices: Record<PlatinumPlanYears, number>;
  goldUpgradePrices: Record<GoldUpgradeYears, number> | null;
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
 * Return only the Platinum extension component, excluding any Gold upgrade.
 * Quote totals must use calculateMercuryPlatinumCoverageCost instead.
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

export const MERCURY_GOLD_UPGRADE_LAST_VERIFIED = rateCard.goldUpgradeLastVerified;
export const MERCURY_GOLD_UPGRADE_SOURCE_URL = rateCard.goldUpgradeSourceUrl;

function isValidPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

/** Exact retail MSRP to upgrade `promoGoldYears` included Gold years to Platinum. Null fails closed. */
export function getMercuryGoldUpgradePrice(
  horsepower: number,
  promoGoldYears: number,
): number | null {
  if (!Number.isInteger(promoGoldYears) || promoGoldYears < 1 || promoGoldYears > 5) return null;
  const band = getMercuryPlatinumRateBand(horsepower);
  if (!band || !band.goldUpgradePrices) return null;
  const price = band.goldUpgradePrices[promoGoldYears as GoldUpgradeYears];
  return isValidPrice(price) && price > 0 ? price : null;
}

export function hasMercuryGoldUpgradePrice(horsepower: number, promoGoldYears: number): boolean {
  return getMercuryGoldUpgradePrice(horsepower, promoGoldYears) != null;
}

export interface MercuryPlatinumCoverageCost {
  includedCoverageYears: number;
  promoGoldYears: number;
  targetTotalYears: number;
  /** Chronological years added beyond the included baseline. Distinct from Gold conversion. */
  extensionYears: number;
  goldUpgradeYears: number;
  goldUpgradePrice: number;
  platinumExtensionPrice: number;
  totalPrice: number;
}

/**
 * Full paid cost to reach a combined target as Platinum beyond factory cover.
 * All promotional Gold years are first upgraded to Platinum, then only the
 * extra chronological years beyond factory+promo baseline are priced as a
 * cumulative Platinum extension. No-promo quotes pay extension only.
 */
export function calculateMercuryPlatinumCoverageCost(
  horsepower: number,
  currentCoverageYears: number,
  targetTotalYears: number,
): MercuryPlatinumCoverageCost | null {
  if (!Number.isInteger(currentCoverageYears) || !Number.isInteger(targetTotalYears)) return null;
  if (currentCoverageYears < MERCURY_PLATINUM_BASE_COVERAGE_YEARS || currentCoverageYears > MERCURY_PLATINUM_MAX_TOTAL_YEARS) return null;
  if (targetTotalYears < currentCoverageYears || targetTotalYears > MERCURY_PLATINUM_MAX_TOTAL_YEARS) return null;
  const promoGoldYears = currentCoverageYears - MERCURY_PLATINUM_BASE_COVERAGE_YEARS;
  if (promoGoldYears < 0 || promoGoldYears > 5) return null;
  const extensionYears = targetTotalYears - currentCoverageYears;
  if (extensionYears < 0 || extensionYears > MERCURY_PLATINUM_MAX_PLAN_YEARS) return null;
  if (!getMercuryPlatinumRateBand(horsepower)) return null;

  const goldUpgradePrice = promoGoldYears === 0 ? 0 : getMercuryGoldUpgradePrice(horsepower, promoGoldYears);
  if (goldUpgradePrice == null) return null;
  const platinumExtensionPrice = extensionYears === 0 ? 0 : getMercuryPlatinumPlanPrice(horsepower, extensionYears);
  if (platinumExtensionPrice == null) return null;
  if (!isValidPrice(goldUpgradePrice) || !isValidPrice(platinumExtensionPrice)) return null;
  const totalPrice = goldUpgradePrice + platinumExtensionPrice;
  if (!isValidPrice(totalPrice)) return null;
  return {
    includedCoverageYears: currentCoverageYears,
    promoGoldYears,
    targetTotalYears,
    extensionYears,
    goldUpgradeYears: promoGoldYears,
    goldUpgradePrice,
    platinumExtensionPrice,
    totalPrice,
  };
}
