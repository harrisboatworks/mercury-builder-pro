import { calculateMercuryPlatinumCoverageCost } from '@/data/mercuryProductProtection';
import { normalizeIncludedCoverageYears } from '@/lib/quote-product-protection';

export const COMPLETE_COVERAGE_TARGET_YEARS = 7;
export const PREMIUM_COVERAGE_TARGET_YEARS = 8;

function priceForTarget(motorHorsepower: number, includedCoverageYears: number, target: number): number | null {
  const included = normalizeIncludedCoverageYears(includedCoverageYears);
  if (target < included) return null;
  if (target === included) {
    // Upgrade-only is only a paid package when promo Gold years can be upgraded.
    const cost = calculateMercuryPlatinumCoverageCost(motorHorsepower, included, target);
    return cost && cost.totalPrice > 0 ? cost.totalPrice : null;
  }
  const cost = calculateMercuryPlatinumCoverageCost(motorHorsepower, included, target);
  return cost ? cost.totalPrice : null;
}

export function getProductProtectionPackagePrices(
  motorHorsepower: number,
  includedCoverageYears: number,
  promotionsVerified: boolean,
): { complete: number | null; premium: number | null } {
  if (!promotionsVerified) return { complete: null, premium: null };
  if (!Number.isFinite(motorHorsepower) || motorHorsepower <= 0) return { complete: null, premium: null };
  return {
    complete: priceForTarget(motorHorsepower, includedCoverageYears, COMPLETE_COVERAGE_TARGET_YEARS),
    premium: priceForTarget(motorHorsepower, includedCoverageYears, PREMIUM_COVERAGE_TARGET_YEARS),
  };
}

export function getProductProtectionPackageBreakdown(
  motorHorsepower: number,
  includedCoverageYears: number,
  targetYears: number,
) {
  return calculateMercuryPlatinumCoverageCost(
    motorHorsepower,
    normalizeIncludedCoverageYears(includedCoverageYears),
    targetYears,
  );
}
