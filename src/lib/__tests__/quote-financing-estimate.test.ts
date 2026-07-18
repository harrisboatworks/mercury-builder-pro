import { describe, expect, it } from 'vitest';
import { calculateMonthly } from '@/lib/finance';
import { calculateQuoteFinancingEstimate } from '@/lib/quote-financing-estimate';

describe('quote financing estimate parity', () => {
  it('matches the final summary for a representative 60 HP installed quote', () => {
    const estimate = calculateQuoteFinancingEstimate({
      motor: {
        model: '60 ELPT FourStroke',
        hp: 60,
        msrp: 13_415,
        price: 12_040,
        salePrice: 12_040,
      },
      selectedOptions: [],
      boatInfo: { controlsOption: 'adapter' },
      purchasePath: 'installed',
      installConfig: { propellerDecision: 'reuse_existing' },
      tradeInInfo: {
        hasTradeIn: true,
        brand: 'Mercury',
        horsepower: 60,
        estimatedValue: 4_125,
      },
      selectedPackage: 'good',
      promotionalSavings: 250,
      dealerFee: 349,
    });

    expect(estimate.accessoryBreakdown).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Control Adaptor Harness', price: 125 }),
      expect.objectContaining({ name: 'Professional Installation', price: 450 }),
      expect.objectContaining({ name: 'Propeller: Use Existing', price: 0 }),
    ]));
    expect(estimate.pricing.subtotal).toBe(8_240);
    expect(estimate.financeableAmount).toBeCloseTo(9_660.2, 2);
    expect(Math.round(calculateMonthly(estimate.financeableAmount, 2.99, 24))).toBe(415);
  });

  it('uses a frozen subtotal when a saved quote has locked pricing', () => {
    const estimate = calculateQuoteFinancingEstimate({
      motor: { model: '60 ELPT FourStroke', hp: 60, msrp: 13_415, price: 12_040 },
      frozenSubtotal: 8_000,
      dealerFee: 349,
    });

    expect(estimate.financeableAmount).toBeCloseTo(9_389, 2);
  });
});
