import { describe, expect, it } from 'vitest';
import { meetsPromotionFinancingMinimum } from '../promotion-financing';

describe('source-defined promotional financing minimum', () => {
  const chase = { minimum_amount: 5000, minimum_amount_exclusive: true };
  it.each([[4999.99, false], [5000, false], [5000.01, true]])('checks a loan of %s', (amount, eligible) => {
    expect(meetsPromotionFinancingMinimum(chase, amount)).toBe(eligible);
  });
  it('preserves inclusive legacy financing and rejects invalid amounts', () => {
    expect(meetsPromotionFinancingMinimum({minimum_amount: 5000}, 5000)).toBe(true);
    expect(meetsPromotionFinancingMinimum(chase, NaN)).toBe(false);
  });
});
