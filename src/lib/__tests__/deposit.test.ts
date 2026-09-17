import { describe, expect, it } from 'vitest';
import { getExpressReservationDeposit, getRecommendedDeposit } from '@/lib/deposit';
import { recommendedStandardDeposit } from '../../../supabase/functions/_shared/deposit-policy.ts';

describe('recommended quote deposit', () => {
  it('keeps the established horsepower tiers consistent across web and PDF', () => {
    expect(getRecommendedDeposit(9.9)).toBe(200);
    expect(getRecommendedDeposit(25)).toBe(200);
    expect(getRecommendedDeposit(60)).toBe(500);
    expect(getRecommendedDeposit(115)).toBe(500);
    expect(getRecommendedDeposit(150)).toBe(1000);
  });

  it('uses exact unambiguous HP boundaries: 200 up to 25, 500 over 25 through 115, 1000 over 115', () => {
    expect(getRecommendedDeposit(2.5)).toBe(200);
    expect(getRecommendedDeposit(6)).toBe(200);
    expect(getRecommendedDeposit(25)).toBe(200);
    expect(getRecommendedDeposit(26)).toBe(500);
    expect(getRecommendedDeposit(9.9)).toBe(200);
    expect(getRecommendedDeposit(115)).toBe(500);
    expect(getRecommendedDeposit(116)).toBe(1000);
    expect(getRecommendedDeposit(200)).toBe(1000);
    for (const hp of [25, 26, 115, 116]) {
      expect(recommendedStandardDeposit(hp)).toBe(getRecommendedDeposit(hp));
    }
  });
});

describe('getExpressReservationDeposit', () => {
  it('uses a $100 commitment deposit for portable motors', () => {
    expect(getExpressReservationDeposit(9.9)).toBe(100);
    expect(getExpressReservationDeposit(25)).toBe(100);
  });

  it('keeps the normal deposit schedule for larger motors', () => {
    expect(getExpressReservationDeposit(60)).toBe(500);
    expect(getExpressReservationDeposit(150)).toBe(1000);
  });
});
