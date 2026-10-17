// Canadian MSRP Gold conversion rates verified in MercNet on 2026-10-17.
// Kept separate so quote pricing does not require an unrelated chat deployment.
import { MERCURY_PLATINUM_PRODUCT_PROTECTION_RATES } from "./mercury-product-protection-rates.ts";

export const MERCURY_GOLD_TO_PLATINUM_UPGRADE_PRICES: Record<string, number[] | null> = {
  "2.5-14.9 HP": [19, 33, 47, 59, 70],
  "15-39.9 HP": [42, 77, 110, 138, 164],
  "40-74.9 HP": [85, 153, 218, 275, 328],
  "75-149.9 HP": [129, 233, 330, 420, 498],
  "150-199.9 HP": [181, 325, 461, 585, 696],
  "200-299.9 HP": [434, 782, 1107, 1406, 1671],
  "300-399.9 HP": [619, 1115, 1580, 2007, 2384],
  "400 HP": [862, 1553, 2198, 2794, 3320],
  "425 HP": [903, 1624, 2301, 2925, 3475],
  "500 HP": null,
  "600 HP": null,
};

export function getMercuryGoldUpgradePriceForBand(label: string, promoGoldYears: number): number | null {
  if (!Number.isInteger(promoGoldYears) || promoGoldYears < 1 || promoGoldYears > 5) return null;
  const prices = MERCURY_GOLD_TO_PLATINUM_UPGRADE_PRICES[label];
  if (!prices) return null;
  const price = prices[promoGoldYears - 1];
  return typeof price === 'number' && Number.isFinite(price) && Number.isInteger(price) && price > 0 ? price : null;
}

export function findMercuryPlatinumRateBand(horsepower: number) {
  if (!Number.isFinite(horsepower) || horsepower <= 0) return null;
  return MERCURY_PLATINUM_PRODUCT_PROTECTION_RATES.find((b) => horsepower >= b.hpMin && horsepower <= b.hpMax) ?? null;
}

export function getMercuryGoldUpgradePrice(horsepower: number, promoGoldYears: number): number | null {
  const band = findMercuryPlatinumRateBand(horsepower);
  if (!band) return null;
  return getMercuryGoldUpgradePriceForBand(band.label, promoGoldYears);
}

export interface MercuryPlatinumCoverageCost {
  includedCoverageYears: number;
  promoGoldYears: number;
  targetTotalYears: number;
  extensionYears: number;
  goldUpgradeYears: number;
  goldUpgradePrice: number;
  platinumExtensionPrice: number;
  totalPrice: number;
}

export function calculateMercuryPlatinumCoverageCost(horsepower: number, currentCoverageYears: number, targetTotalYears: number): MercuryPlatinumCoverageCost | null {
  if (!Number.isInteger(currentCoverageYears) || !Number.isInteger(targetTotalYears)) return null;
  if (currentCoverageYears < 3 || currentCoverageYears > 8) return null;
  if (targetTotalYears < currentCoverageYears || targetTotalYears > 8) return null;
  const band = findMercuryPlatinumRateBand(horsepower);
  if (!band) return null;
  const promoGoldYears = currentCoverageYears - 3;
  if (promoGoldYears < 0 || promoGoldYears > 5) return null;
  const extensionYears = targetTotalYears - currentCoverageYears;
  if (extensionYears < 0 || extensionYears > 5) return null;
  const goldUpgradePrice = promoGoldYears === 0 ? 0 : getMercuryGoldUpgradePrice(horsepower, promoGoldYears);
  if (goldUpgradePrice == null) return null;
  const platinumExtensionPrice = extensionYears === 0 ? 0 : band.prices[extensionYears - 1];
  if (typeof platinumExtensionPrice !== 'number' || !Number.isFinite(platinumExtensionPrice)) return null;
  return { includedCoverageYears: currentCoverageYears, promoGoldYears, targetTotalYears, extensionYears, goldUpgradeYears: promoGoldYears, goldUpgradePrice, platinumExtensionPrice, totalPrice: goldUpgradePrice + platinumExtensionPrice };
}
