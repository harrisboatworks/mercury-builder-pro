import { calculateWarrantyExtensionCost } from '@/lib/quote-utils';

export const COMPLETE_COVERAGE_TARGET_YEARS = 7;
export const PREMIUM_COVERAGE_TARGET_YEARS = 8;

export function getProductProtectionPackagePrices(
  motorHorsepower: number,
  includedCoverageYears: number,
  promotionsVerified: boolean,
): { complete: number | null; premium: number | null } {
  if (!promotionsVerified) {
    return { complete: null, premium: null };
  }

  return {
    complete: COMPLETE_COVERAGE_TARGET_YEARS > includedCoverageYears
      ? calculateWarrantyExtensionCost(
        motorHorsepower,
        includedCoverageYears,
        COMPLETE_COVERAGE_TARGET_YEARS,
      )
      : null,
    premium: PREMIUM_COVERAGE_TARGET_YEARS > includedCoverageYears
      ? calculateWarrantyExtensionCost(
        motorHorsepower,
        includedCoverageYears,
        PREMIUM_COVERAGE_TARGET_YEARS,
      )
      : null,
  };
}
