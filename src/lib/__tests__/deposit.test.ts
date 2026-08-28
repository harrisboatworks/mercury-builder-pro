import { describe, expect, it } from 'vitest';
import { getExpressReservationDeposit, getRecommendedDeposit } from '@/lib/deposit';

describe('recommended quote deposit', () => {
  it('keeps the established horsepower tiers consistent across web and PDF', () => {
    expect(getRecommendedDeposit(9.9)).toBe(200);
    expect(getRecommendedDeposit(25)).toBe(200);
    expect(getRecommendedDeposit(60)).toBe(500);
    expect(getRecommendedDeposit(115)).toBe(500);
    expect(getRecommendedDeposit(150)).toBe(1000);
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
