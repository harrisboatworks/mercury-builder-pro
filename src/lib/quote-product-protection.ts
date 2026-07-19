import {
  MERCURY_PLATINUM_BASE_COVERAGE_YEARS,
  MERCURY_PLATINUM_MAX_TOTAL_YEARS,
  getMaximumPlatinumPlanYears,
  getMercuryPlatinumPlanPrice,
  getMercuryPlatinumRateBand,
} from '@/data/mercuryProductProtection';

export interface QuoteWarrantyConfig {
  extendedYears: number;
  warrantyPrice: number;
  totalYears: number;
}

export interface PlatinumQuoteOption {
  planYears: number;
  totalYears: number;
  price: number;
}

export function normalizeIncludedCoverageYears(currentCoverageYears: number): number {
  if (!Number.isFinite(currentCoverageYears)) {
    return MERCURY_PLATINUM_BASE_COVERAGE_YEARS;
  }

  return Math.min(
    MERCURY_PLATINUM_MAX_TOTAL_YEARS,
    Math.max(MERCURY_PLATINUM_BASE_COVERAGE_YEARS, Math.floor(currentCoverageYears)),
  );
}

export function createBaselineWarrantyConfig(
  currentCoverageYears: number,
): QuoteWarrantyConfig {
  return {
    extendedYears: 0,
    warrantyPrice: 0,
    totalYears: normalizeIncludedCoverageYears(currentCoverageYears),
  };
}

/**
 * Return every exact Platinum term the customer can add without exceeding
 * Mercury's eight-year combined-coverage maximum. Promotion years are already
 * represented in currentCoverageYears, so the paid term naturally gets shorter
 * when an eligible warranty promotion is active.
 */
export function getPlatinumQuoteOptions(
  horsepower: number,
  currentCoverageYears: number,
): PlatinumQuoteOption[] {
  if (!getMercuryPlatinumRateBand(horsepower)) return [];

  const includedYears = normalizeIncludedCoverageYears(currentCoverageYears);
  const maximumPlanYears = getMaximumPlatinumPlanYears(includedYears);

  return Array.from({ length: maximumPlanYears }, (_, index) => {
    const planYears = index + 1;
    const price = getMercuryPlatinumPlanPrice(horsepower, planYears);

    return price == null
      ? null
      : {
          planYears,
          totalYears: includedYears + planYears,
          price,
        };
  }).filter((option): option is PlatinumQuoteOption => option !== null);
}

/**
 * Preserve the customer's requested combined-coverage target while repricing
 * the paid Platinum term against current promotional coverage. This prevents
 * a back-navigation or promotion refresh from silently double-charging years.
 */
export function reconcileWarrantyConfig(
  horsepower: number,
  currentCoverageYears: number,
  warrantyConfig?: QuoteWarrantyConfig | null,
): QuoteWarrantyConfig {
  const includedYears = normalizeIncludedCoverageYears(currentCoverageYears);
  const baseline = createBaselineWarrantyConfig(includedYears);

  if (!warrantyConfig || warrantyConfig.extendedYears <= 0) return baseline;

  const requestedTotalYears = Number.isFinite(warrantyConfig.totalYears)
    ? Math.floor(warrantyConfig.totalYears)
    : includedYears + Math.floor(warrantyConfig.extendedYears);
  const targetTotalYears = Math.min(
    MERCURY_PLATINUM_MAX_TOTAL_YEARS,
    Math.max(includedYears, requestedTotalYears),
  );
  const planYears = targetTotalYears - includedYears;
  if (planYears <= 0) return baseline;

  const price = getMercuryPlatinumPlanPrice(horsepower, planYears);
  if (price == null) return baseline;

  return {
    extendedYears: planYears,
    warrantyPrice: price,
    totalYears: targetTotalYears,
  };
}
