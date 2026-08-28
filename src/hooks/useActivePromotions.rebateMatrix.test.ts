import { describe, expect, it } from 'vitest';
import {
  getFirstPromotionRebateForHP,
  getPromotionDiscountAmount,
  getPromotionRebateForHP,
  getRebateTierForHP,
  getTotalPromotionDiscount,
  resolveRebateForHP,
  type RebateTier,
} from '@/lib/promotion-discounts';

const MATRIX: RebateTier[] = [
  { hp_min: 2.5, hp_max: 3.5, rebate: 50 },
  { hp_min: 4, hp_max: 8, rebate: 75 },
  { hp_min: 9.9, hp_max: 25, rebate: 100 },
  { hp_min: 30, hp_max: 115, rebate: 250 },
  { hp_min: 150, hp_max: 200, rebate: 350 },
  { hp_min: 225, hp_max: 425, rebate: 700 },
];

const SUMMER_SAVINGS = {
  discount_fixed_amount: 700,
  discount_percentage: 5,
  promo_options: {
    options: [{ id: 'cash_rebate', matrix: MATRIX }],
  },
};

describe('production promotion discount calculator', () => {
  it.each([
    [2.5, 50],
    [3.5, 50],
    [4, 75],
    [8, 75],
    [9.9, 100],
    [25, 100],
    [30, 250],
    [60, 250],
    [115, 250],
    [150, 350],
    [200, 350],
    [225, 700],
    [425, 700],
  ])('resolves explicit matrix tier %s HP to $%s', (hp, expected) => {
    expect(resolveRebateForHP(MATRIX, hp)).toBe(expected);
  });

  it.each([0, 3.9, 9, 26, 120, 210, 500, 600])(
    'does not invent a nearest-tier rebate for ineligible %s HP',
    (hp) => {
      expect(resolveRebateForHP(MATRIX, hp)).toBeNull();
    },
  );

  it('uses the matrix as the sole discount source even with hostile universal fields', () => {
    expect(getPromotionDiscountAmount(SUMMER_SAVINGS, {
      basePrice: 15_000,
      horsepower: 60,
    })).toBe(250);
  });

  it('returns zero for a matrix promotion when the motor is not explicitly eligible', () => {
    expect(getPromotionDiscountAmount(SUMMER_SAVINGS, {
      basePrice: 45_000,
      horsepower: 500,
    })).toBe(0);
  });

  it('continues to support fixed and percentage discounts for non-matrix promos', () => {
    expect(getPromotionDiscountAmount({
      discount_fixed_amount: 200,
      discount_percentage: 2,
    }, { basePrice: 10_000, horsepower: 60 })).toBe(400);
  });

  it('sums matrix and legacy promotions without double-counting either', () => {
    const total = getTotalPromotionDiscount([
      SUMMER_SAVINGS,
      { discount_fixed_amount: 100 },
    ], { basePrice: 15_000, horsepower: 60 });

    expect(total).toBe(350);
  });

  it('exposes the same production result through promotion-level wrappers', () => {
    expect(getRebateTierForHP(MATRIX, 60)).toEqual({ hp_min: 30, hp_max: 115, rebate: 250 });
    expect(getPromotionRebateForHP(SUMMER_SAVINGS, 60)).toBe(250);
    expect(getFirstPromotionRebateForHP([SUMMER_SAVINGS], 60)).toBe(250);
    expect(getFirstPromotionRebateForHP([SUMMER_SAVINGS], 500)).toBeNull();
  });
});
