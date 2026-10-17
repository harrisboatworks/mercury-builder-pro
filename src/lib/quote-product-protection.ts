import {
  MERCURY_PLATINUM_BASE_COVERAGE_YEARS,
  MERCURY_PLATINUM_MAX_TOTAL_YEARS,
  calculateMercuryPlatinumCoverageCost,
  getMaximumPlatinumPlanYears,
  getMercuryGoldUpgradePrice,
  getMercuryPlatinumPlanPrice,
  getMercuryPlatinumRateBand,
} from '@/data/mercuryProductProtection';

export interface QuoteWarrantyConfig {
  /** Chronological years added beyond the included factory+promo baseline. */
  extendedYears: number;
  /** Total paid amount before HST: Gold upgrade + Platinum extension, summed once. */
  warrantyPrice: number;
  totalYears: number;
  promoGoldYears?: number;
  includedCoverageYears?: number;
  goldUpgradeYears?: number;
  goldUpgradePrice?: number;
  platinumExtensionYears?: number;
  platinumExtensionPrice?: number;
  /** True only when breakdown metadata was explicitly written by current pricing code. */
  hasExplicitBreakdown?: boolean;
}

export interface PlatinumQuoteOption {
  /** Chronological extension years beyond baseline (0 for upgrade-only). */
  planYears: number;
  totalYears: number;
  price: number;
  promoGoldYears: number;
  goldUpgradeYears: number;
  goldUpgradePrice: number;
  platinumExtensionYears: number;
  platinumExtensionPrice: number;
  isUpgradeOnly: boolean;
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

export function promoGoldYearsForIncluded(includedYears: number): number {
  return Math.max(0, normalizeIncludedCoverageYears(includedYears) - MERCURY_PLATINUM_BASE_COVERAGE_YEARS);
}

export function createBaselineWarrantyConfig(
  currentCoverageYears: number,
): QuoteWarrantyConfig {
  const includedYears = normalizeIncludedCoverageYears(currentCoverageYears);
  return {
    extendedYears: 0,
    warrantyPrice: 0,
    totalYears: includedYears,
    promoGoldYears: promoGoldYearsForIncluded(includedYears),
    includedCoverageYears: includedYears,
    goldUpgradeYears: 0,
    goldUpgradePrice: 0,
    platinumExtensionYears: 0,
    platinumExtensionPrice: 0,
    hasExplicitBreakdown: true,
  };
}

export function buildWarrantyConfigFromCost(cost: NonNullable<ReturnType<typeof calculateMercuryPlatinumCoverageCost>>): QuoteWarrantyConfig {
  return {
    extendedYears: cost.extensionYears,
    warrantyPrice: cost.totalPrice,
    totalYears: cost.targetTotalYears,
    promoGoldYears: cost.promoGoldYears,
    includedCoverageYears: cost.includedCoverageYears,
    goldUpgradeYears: cost.goldUpgradeYears,
    goldUpgradePrice: cost.goldUpgradePrice,
    platinumExtensionYears: cost.extensionYears,
    platinumExtensionPrice: cost.platinumExtensionPrice,
    hasExplicitBreakdown: true,
  };
}

export function hasExplicitWarrantyBreakdown(config?: QuoteWarrantyConfig | null): boolean {
  if (!config) return false;
  return typeof config.goldUpgradePrice === 'number'
    && Number.isFinite(config.goldUpgradePrice) && config.goldUpgradePrice >= 0
    && typeof config.platinumExtensionPrice === 'number'
    && Number.isFinite(config.platinumExtensionPrice) && config.platinumExtensionPrice >= 0
    && Math.abs(config.goldUpgradePrice + config.platinumExtensionPrice - config.warrantyPrice) < 0.005;
}

/** Unstructured legacy custom charges require staff review before repricing protection. */
export function requiresCustomProtectionReview(
  config: QuoteWarrantyConfig | null | undefined,
  customItems: readonly unknown[] = [],
): boolean {
  return !!config && config.warrantyPrice > 0 && customItems.length > 0
    && !hasExplicitWarrantyBreakdown(config);
}

export function isPaidPlatinumSelection(config?: QuoteWarrantyConfig | null): boolean {
  if (!config) return false;
  return Number.isFinite(config.warrantyPrice) && config.warrantyPrice > 0
    && (config.extendedYears > 0 || (config.goldUpgradePrice ?? 0) > 0 || hasExplicitWarrantyBreakdown(config));
}

export function getPlatinumQuoteOptions(
  horsepower: number,
  currentCoverageYears: number,
): PlatinumQuoteOption[] {
  if (!getMercuryPlatinumRateBand(horsepower)) return [];
  const includedYears = normalizeIncludedCoverageYears(currentCoverageYears);
  const promoGoldYears = promoGoldYearsForIncluded(includedYears);
  // Fail closed: promo Platinum cannot be priced without a verified Gold upgrade rate.
  if (promoGoldYears > 0 && getMercuryGoldUpgradePrice(horsepower, promoGoldYears) == null) return [];

  const options: PlatinumQuoteOption[] = [];
  if (promoGoldYears > 0) {
    const upgradeOnly = calculateMercuryPlatinumCoverageCost(horsepower, includedYears, includedYears);
    if (upgradeOnly && upgradeOnly.totalPrice > 0) {
      options.push({
        planYears: 0,
        totalYears: includedYears,
        price: upgradeOnly.totalPrice,
        promoGoldYears,
        goldUpgradeYears: upgradeOnly.goldUpgradeYears,
        goldUpgradePrice: upgradeOnly.goldUpgradePrice,
        platinumExtensionYears: 0,
        platinumExtensionPrice: 0,
        isUpgradeOnly: true,
      });
    }
  }
  const maximumPlanYears = getMaximumPlatinumPlanYears(includedYears);
  for (let planYears = 1; planYears <= maximumPlanYears; planYears++) {
    const cost = calculateMercuryPlatinumCoverageCost(horsepower, includedYears, includedYears + planYears);
    if (!cost) continue;
    // Keep pure plan price validation separate; total is upgrade+extension summed once.
    if (getMercuryPlatinumPlanPrice(horsepower, planYears) == null) continue;
    options.push({
      planYears,
      totalYears: cost.targetTotalYears,
      price: cost.totalPrice,
      promoGoldYears,
      goldUpgradeYears: cost.goldUpgradeYears,
      goldUpgradePrice: cost.goldUpgradePrice,
      platinumExtensionYears: cost.extensionYears,
      platinumExtensionPrice: cost.platinumExtensionPrice,
      isUpgradeOnly: false,
    });
  }
  return options;
}

/**
 * Reprice an explicitly-priced Platinum selection against current promo coverage.
 * Frozen quotes are handled by callers and never reach here. Unstructured
 * custom charges require staff review; ordinary stale browser selections are
 * repriced so they cannot keep an obsolete extension-only price.
 */
export function reconcileWarrantyConfig(
  horsepower: number,
  currentCoverageYears: number,
  warrantyConfig?: QuoteWarrantyConfig | null,
  customItems: readonly unknown[] = [],
): QuoteWarrantyConfig {
  const includedYears = normalizeIncludedCoverageYears(currentCoverageYears);
  const baseline = createBaselineWarrantyConfig(includedYears);
  if (!warrantyConfig) return baseline;

  const paid = isPaidPlatinumSelection(warrantyConfig);
  if (!paid) {
    // No paid protection: factory+Gold stays at $0. Refresh baseline years only.
    if ((warrantyConfig.warrantyPrice ?? 0) <= 0 && warrantyConfig.extendedYears <= 0 && (warrantyConfig.goldUpgradePrice ?? 0) <= 0) {
      return baseline;
    }
    return baseline;
  }

  if (requiresCustomProtectionReview(warrantyConfig, customItems)) return { ...warrantyConfig };

  const requestedTotalYears = Number.isFinite(warrantyConfig.totalYears)
    ? Math.floor(warrantyConfig.totalYears)
    : includedYears + Math.floor(warrantyConfig.extendedYears);
  const targetTotalYears = Math.min(
    MERCURY_PLATINUM_MAX_TOTAL_YEARS,
    Math.max(includedYears, requestedTotalYears),
  );
  const cost = calculateMercuryPlatinumCoverageCost(horsepower, includedYears, targetTotalYears);
  if (!cost) return baseline;
  // Upgrade-only (target == included, promo>0) has cost>0 and must not be erased.
  if (cost.totalPrice <= 0) return baseline;
  return buildWarrantyConfigFromCost(cost);
}
