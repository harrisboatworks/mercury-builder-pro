import { describe, expect, it } from 'vitest';
import {
  MERCURY_PLATINUM_RATES,
  MERCURY_PRODUCT_PROTECTION_CANADA_PLAN_TERMS_URL,
  calculateMercuryPlatinumExtensionCost,
  getMaximumPlatinumPlanYears,
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

  it('lets active promotional coverage reduce the paid plan term', () => {
    expect(calculateMercuryPlatinumExtensionCost(115, 5, 7)).toBe(971);
    expect(calculateMercuryPlatinumExtensionCost(115, 5, 8)).toBe(1376);
    expect(calculateMercuryPlatinumExtensionCost(115, 7, 7)).toBe(0);
  });

  it('enforces the eight-year combined maximum and rejects invalid input', () => {
    expect(getMaximumPlatinumPlanYears(3)).toBe(5);
    expect(getMaximumPlatinumPlanYears(6)).toBe(2);
    expect(calculateMercuryPlatinumExtensionCost(115, 3, 9)).toBeNull();
    expect(getMercuryPlatinumPlanPrice(115, 6)).toBeNull();
    expect(getMercuryPlatinumPlanPrice(Number.NaN, 2)).toBeNull();
  });
});
