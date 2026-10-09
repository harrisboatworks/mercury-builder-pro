import { describe, expect, it } from 'vitest';
import { calculateMonthlyPayment } from '../finance';
import {
  meetsPromotionFinancingMinimum,
  resolveSelectedPromotionFinancing,
} from '../promotion-financing';

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

describe('resolveSelectedPromotionFinancing', () => {
  const chase = { minimum_amount: 5000, minimum_amount_exclusive: true };
  const selected = {
    selectedPromoOption: 'special_financing' as const,
    selectedPromoRate: 2.99,
    selectedPromoTerm: 24,
    specialFinancingOption: chase,
    standingRate: 5.48,
  };

  it('falls back to the standing TD Always On rate and term below the exclusive minimum', () => {
    const resolved = resolveSelectedPromotionFinancing({ ...selected, amount: 5000 });
    expect(resolved).toEqual({ rate: 5.48, term: null, usesSpecialFinancing: false });
    const payment = calculateMonthlyPayment(5000, resolved.rate, resolved.term);
    expect(payment.rate).toBe(5.48);
    expect(payment.termMonths).not.toBe(24);
  });

  it('applies the selected 2.99% / 24-month special financing above the exclusive minimum', () => {
    const resolved = resolveSelectedPromotionFinancing({ ...selected, amount: 5000.01 });
    expect(resolved).toEqual({ rate: 2.99, term: 24, usesSpecialFinancing: true });
    const payment = calculateMonthlyPayment(5000.01, resolved.rate, resolved.term);
    expect(payment.rate).toBe(2.99);
    expect(payment.termMonths).toBe(24);
  });

  it('does not apply special financing when a different promo option is selected', () => {
    const resolved = resolveSelectedPromotionFinancing({
      ...selected,
      selectedPromoOption: 'cash_rebate',
      amount: 8000,
    });
    expect(resolved).toEqual({ rate: 5.48, term: null, usesSpecialFinancing: false });
  });
});
