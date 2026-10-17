import { describe, expect, it } from 'vitest';
import {
  MERCURY_PLATINUM_RATES,
  MERCURY_PRODUCT_PROTECTION_CANADA_PLAN_TERMS_URL,
  calculateMercuryPlatinumCoverageCost,
  calculateMercuryPlatinumExtensionCost,
  getMaximumPlatinumPlanYears,
  getMercuryGoldUpgradePrice,
  getMercuryPlatinumPlanPrice,
  getMercuryPlatinumRateBand,
} from '@/data/mercuryProductProtection';

describe('Mercury Platinum Product Protection pricing', () => {
  it('contains the current eleven-band rate card', () => {
    expect(MERCURY_PLATINUM_RATES).toHaveLength(11);
    expect(getMercuryPlatinumPlanPrice(9.9, 5)).toBe(293);
    expect(getMercuryPlatinumPlanPrice(115, 4)).toBe(1748);
    expect(getMercuryPlatinumPlanPrice(600, 5)).toBe(22469);
  });

  it('links the Canadian Platinum provisions, not the U.S. plan', () => {
    expect(MERCURY_PRODUCT_PROTECTION_CANADA_PLAN_TERMS_URL).toContain('8M0236695');
    expect(MERCURY_PRODUCT_PROTECTION_CANADA_PLAN_TERMS_URL).not.toContain('8M0236693');
  });

  it('uses exact HP boundaries without leaking across a band', () => {
    expect(getMercuryPlatinumRateBand(14.9)?.label).toBe('2.5-14.9 HP');
    expect(getMercuryPlatinumRateBand(15)?.label).toBe('15-39.9 HP');
    expect(getMercuryPlatinumRateBand(399.9)?.label).toBe('300-399.9 HP');
    expect(getMercuryPlatinumRateBand(400)?.label).toBe('400 HP');
    expect(getMercuryPlatinumRateBand(450)).toBeNull();
  });

  it('prices the purchased plan term, not a difference between cumulative totals', () => {
    expect(calculateMercuryPlatinumExtensionCost(115, 3, 7)).toBe(1748);
    expect(calculateMercuryPlatinumExtensionCost(115, 3, 8)).toBe(2077);
  });

  it('lets active promotional coverage reduce the pure paid plan term', () => {
    expect(calculateMercuryPlatinumExtensionCost(115, 5, 7)).toBe(971);
    expect(calculateMercuryPlatinumExtensionCost(115, 5, 8)).toBe(1376);
    expect(calculateMercuryPlatinumExtensionCost(115, 7, 7)).toBe(0);
  });

  it('uses exact verified Gold upgrade rates and fails closed where none exist', () => {
    expect(getMercuryGoldUpgradePrice(60, 2)).toBe(153);
    expect(getMercuryGoldUpgradePrice(115, 2)).toBe(233);
    expect(getMercuryGoldUpgradePrice(9.9, 5)).toBe(70);
    expect(getMercuryGoldUpgradePrice(425, 5)).toBe(3475);
    expect(getMercuryGoldUpgradePrice(500, 2)).toBeNull();
    expect(getMercuryGoldUpgradePrice(600, 1)).toBeNull();
    expect(getMercuryGoldUpgradePrice(60, 0)).toBeNull();
    expect(getMercuryGoldUpgradePrice(60, 6)).toBeNull();
    expect(getMercuryGoldUpgradePrice(Number.NaN, 2)).toBeNull();
  });

  it('prices full promotional Platinum as Gold upgrade plus only extra years', () => {
    expect(calculateMercuryPlatinumCoverageCost(60, 5, 8)).toMatchObject({ goldUpgradePrice: 153, platinumExtensionPrice: 904, totalPrice: 1057, extensionYears: 3 });
    expect(calculateMercuryPlatinumCoverageCost(60, 5, 7)).toMatchObject({ totalPrice: 792 });
    expect(calculateMercuryPlatinumCoverageCost(60, 5, 6)).toMatchObject({ totalPrice: 508 });
    expect(calculateMercuryPlatinumCoverageCost(60, 5, 5)).toMatchObject({ totalPrice: 153, extensionYears: 0 });
    expect(calculateMercuryPlatinumCoverageCost(60, 3, 8)).toMatchObject({ goldUpgradePrice: 0, totalPrice: 1365 });
    expect(calculateMercuryPlatinumCoverageCost(115, 5, 8)).toMatchObject({ goldUpgradePrice: 233, platinumExtensionPrice: 1376, totalPrice: 1609 });
    expect(calculateMercuryPlatinumCoverageCost(500, 5, 8)).toBeNull();
    expect(calculateMercuryPlatinumCoverageCost(60, 5, 9)).toBeNull();
    expect(calculateMercuryPlatinumCoverageCost(60, 8, 8)).toMatchObject({ goldUpgradePrice: 328, totalPrice: 328 });
  });

  it('enforces the eight-year combined maximum and rejects invalid input', () => {
    expect(getMaximumPlatinumPlanYears(3)).toBe(5);
    expect(getMaximumPlatinumPlanYears(6)).toBe(2);
    expect(calculateMercuryPlatinumExtensionCost(115, 3, 9)).toBeNull();
    expect(getMercuryPlatinumPlanPrice(115, 6)).toBeNull();
    expect(getMercuryPlatinumPlanPrice(Number.NaN, 2)).toBeNull();
  });
});
