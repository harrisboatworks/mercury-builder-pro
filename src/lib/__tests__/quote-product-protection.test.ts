import { describe, expect, it } from 'vitest';
import {
  createBaselineWarrantyConfig,
  getPlatinumQuoteOptions,
  reconcileWarrantyConfig,
} from '@/lib/quote-product-protection';

describe('quote Product Protection options', () => {
  it('offers every one- through five-year Platinum term from base coverage', () => {
    expect(getPlatinumQuoteOptions(115, 3)).toEqual([
      { planYears: 1, totalYears: 4, price: 539, promoGoldYears: 0, goldUpgradeYears: 0, goldUpgradePrice: 0, platinumExtensionYears: 1, platinumExtensionPrice: 539, isUpgradeOnly: false },
      { planYears: 2, totalYears: 5, price: 971, promoGoldYears: 0, goldUpgradeYears: 0, goldUpgradePrice: 0, platinumExtensionYears: 2, platinumExtensionPrice: 971, isUpgradeOnly: false },
      { planYears: 3, totalYears: 6, price: 1376, promoGoldYears: 0, goldUpgradeYears: 0, goldUpgradePrice: 0, platinumExtensionYears: 3, platinumExtensionPrice: 1376, isUpgradeOnly: false },
      { planYears: 4, totalYears: 7, price: 1748, promoGoldYears: 0, goldUpgradeYears: 0, goldUpgradePrice: 0, platinumExtensionYears: 4, platinumExtensionPrice: 1748, isUpgradeOnly: false },
      { planYears: 5, totalYears: 8, price: 2077, promoGoldYears: 0, goldUpgradeYears: 0, goldUpgradePrice: 0, platinumExtensionYears: 5, platinumExtensionPrice: 2077, isUpgradeOnly: false },
    ]);
  });

  it('prices 60HP promo Gold upgrade plus only extra Platinum years (baseline 5)', () => {
    expect(getPlatinumQuoteOptions(60, 5)).toEqual([
      { planYears: 0, totalYears: 5, price: 153, promoGoldYears: 2, goldUpgradeYears: 2, goldUpgradePrice: 153, platinumExtensionYears: 0, platinumExtensionPrice: 0, isUpgradeOnly: true },
      { planYears: 1, totalYears: 6, price: 508, promoGoldYears: 2, goldUpgradeYears: 2, goldUpgradePrice: 153, platinumExtensionYears: 1, platinumExtensionPrice: 355, isUpgradeOnly: false },
      { planYears: 2, totalYears: 7, price: 792, promoGoldYears: 2, goldUpgradeYears: 2, goldUpgradePrice: 153, platinumExtensionYears: 2, platinumExtensionPrice: 639, isUpgradeOnly: false },
      { planYears: 3, totalYears: 8, price: 1057, promoGoldYears: 2, goldUpgradeYears: 2, goldUpgradePrice: 153, platinumExtensionYears: 3, platinumExtensionPrice: 904, isUpgradeOnly: false },
    ]);
  });

  it('prices 115HP baseline 5 to 8 as 233 + 1376 = 1609', () => {
    const opt = getPlatinumQuoteOptions(115, 5).find((o) => o.totalYears === 8);
    expect(opt).toMatchObject({ price: 1609, goldUpgradePrice: 233, platinumExtensionPrice: 1376 });
  });

  it('offers nothing beyond eight years or for unsupported horsepower / unsupported promo upgrade', () => {
    expect(getPlatinumQuoteOptions(115, 8).filter((o) => !o.isUpgradeOnly)).toEqual([]);
    // At included 8 with promo 5, only upgrade-only remains.
    expect(getPlatinumQuoteOptions(115, 8)).toEqual([
      { planYears: 0, totalYears: 8, price: 498, promoGoldYears: 5, goldUpgradeYears: 5, goldUpgradePrice: 498, platinumExtensionYears: 0, platinumExtensionPrice: 0, isUpgradeOnly: true },
    ]);
    expect(getPlatinumQuoteOptions(0, 3)).toEqual([]);
    expect(getPlatinumQuoteOptions(500, 5)).toEqual([]);
    expect(getPlatinumQuoteOptions(600, 5)).toEqual([]);
    // No promo on 500HP still prices pure Platinum extension.
    expect(getPlatinumQuoteOptions(500, 3).at(-1)).toMatchObject({ totalYears: 8, price: 18748 });
  });

  it('preserves requested total while repricing an explicitly-priced selection against promo changes without double-charging upgrade', () => {
    const selectedAtBaseline5 = {
      extendedYears: 3, warrantyPrice: 1609, totalYears: 8,
      promoGoldYears: 2, includedCoverageYears: 5, goldUpgradeYears: 2, goldUpgradePrice: 233,
      platinumExtensionYears: 3, platinumExtensionPrice: 1376, hasExplicitBreakdown: true,
    };
    // Reconciling at same baseline is idempotent — upgrade charged once.
    expect(reconcileWarrantyConfig(115, 5, selectedAtBaseline5)).toMatchObject({ extendedYears: 3, warrantyPrice: 1609, totalYears: 8, goldUpgradePrice: 233 });
    expect(reconcileWarrantyConfig(115, 5, reconcileWarrantyConfig(115, 5, selectedAtBaseline5))).toMatchObject({ warrantyPrice: 1609 });
    // Promo dropped to none: target 8 pays pure 5-year Platinum only.
    expect(reconcileWarrantyConfig(115, 3, selectedAtBaseline5)).toMatchObject({ extendedYears: 5, warrantyPrice: 2077, goldUpgradePrice: 0 });
    // Back-navigation: selected at no promo, then promo baseline 5 appears.
    const noPromoSelection = {
      extendedYears: 5, warrantyPrice: 2077, totalYears: 8,
      promoGoldYears: 0, goldUpgradePrice: 0, platinumExtensionPrice: 2077, hasExplicitBreakdown: true,
    };
    expect(reconcileWarrantyConfig(115, 5, noPromoSelection)).toMatchObject({ extendedYears: 3, warrantyPrice: 1609, totalYears: 8 });
  });

  it('does not erase a paid upgrade-only selection (extendedYears 0)', () => {
    const upgradeOnly = {
      extendedYears: 0, warrantyPrice: 153, totalYears: 5,
      promoGoldYears: 2, goldUpgradeYears: 2, goldUpgradePrice: 153,
      platinumExtensionYears: 0, platinumExtensionPrice: 0, hasExplicitBreakdown: true,
    };
    expect(reconcileWarrantyConfig(60, 5, upgradeOnly)).toMatchObject({ extendedYears: 0, warrantyPrice: 153, totalYears: 5 });
  });

  it('keeps no-paid choice at $0 with Gold baseline', () => {
    expect(reconcileWarrantyConfig(60, 5, createBaselineWarrantyConfig(5))).toMatchObject({ extendedYears: 0, warrantyPrice: 0, totalYears: 5, promoGoldYears: 2 });
    expect(createBaselineWarrantyConfig(5).warrantyPrice).toBe(0);
  });

  it('reprices stale local selections but preserves ambiguous custom pricing for review', () => {
    const legacy = { extendedYears: 3, warrantyPrice: 1376, totalYears: 8 };
    expect(reconcileWarrantyConfig(115, 5, legacy)).toMatchObject({ warrantyPrice: 1609, totalYears: 8 });
    expect(reconcileWarrantyConfig(115, 5, legacy, [{ name: 'Custom accessory', price: 20 }])).toEqual(legacy);
  });

  it('fails closed to included coverage when an explicitly-priced price is unavailable', () => {
    expect(reconcileWarrantyConfig(0, 3, {
      extendedYears: 5, warrantyPrice: 999, totalYears: 8, goldUpgradePrice: 0, platinumExtensionPrice: 999, hasExplicitBreakdown: true,
    })).toEqual(createBaselineWarrantyConfig(3));
    expect(reconcileWarrantyConfig(500, 5, {
      extendedYears: 3, warrantyPrice: 999, totalYears: 8, goldUpgradePrice: 1, platinumExtensionPrice: 998, hasExplicitBreakdown: true,
    })).toEqual(createBaselineWarrantyConfig(5));
  });
});
