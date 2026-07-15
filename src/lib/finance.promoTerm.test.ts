// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { calculateMonthlyPayment, getDefaultFinancingRate } from './finance';

describe('calculateMonthlyPayment — promo financing selection', () => {
  it('uses the customer-selected promo rate and term when both are provided', () => {
    // 2.99% for 24 months on $15,000 — customer opted in on PromoSelectionPage.
    const result = calculateMonthlyPayment(15000, 2.99, 24);
    expect(result.rate).toBe(2.99);
    expect(result.termMonths).toBe(24);
    // Sanity: 24-mo amortization gives a much higher payment than the
    // default 60/72-mo term the tier heuristic would pick.
    expect(result.payment).toBeGreaterThan(600);
    expect(result.payment).toBeLessThan(700);
  });

  it('falls back to tier default rate and term when no promo is selected', () => {
    const result = calculateMonthlyPayment(15000, null);
    expect(result.rate).toBe(getDefaultFinancingRate(15000));
    // Tier heuristic for $10k–$20k is 60 months.
    expect(result.termMonths).toBe(60);
  });

  it('honors an explicit promo rate without a term override (backward compat)', () => {
    const result = calculateMonthlyPayment(15000, 5.48);
    expect(result.rate).toBe(5.48);
    expect(result.termMonths).toBe(60);
  });

  it('a customer who opts OUT of promo financing gets standard TD rate math', () => {
    // Simulates: state.selectedPromoOption === "cash_rebate" (no promo rate)
    // → summary passes promo.rate (5.48) with no term override.
    const opted = calculateMonthlyPayment(15000, 2.99, 24);
    const standard = calculateMonthlyPayment(15000, 5.48);
    expect(standard.rate).toBe(5.48);
    expect(standard.termMonths).toBe(60);
    // The two paths must produce different numbers so we know the selection
    // actually affects the summary display.
    expect(standard.payment).not.toBe(opted.payment);
  });
});
