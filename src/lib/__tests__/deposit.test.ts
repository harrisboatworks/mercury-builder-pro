import { describe, expect, it } from 'vitest';
import { getRecommendedDeposit } from '@/lib/deposit';

describe('recommended quote deposit', () => {
  it('keeps the established horsepower tiers consistent across web and PDF', () => {
    expect(getRecommendedDeposit(9.9)).toBe(200);
    expect(getRecommendedDeposit(25)).toBe(200);
    expect(getRecommendedDeposit(60)).toBe(500);
    expect(getRecommendedDeposit(115)).toBe(500);
    expect(getRecommendedDeposit(150)).toBe(1000);
  });
});
