import { describe, it, expect } from 'vitest';
import { calculateQuotePricing } from '@/lib/quote-utils';

describe('Pricing Parity: PDF ↔ Web ↔ Admin', () => {
  
  const TAX_RATE = 0.13;

  // Scenario: Admin creates a quote for a 115HP ProXS
  it('admin save produces same total as QuoteSummaryPage would', () => {
    const motorMSRP = 14250;
    const motorSalePrice = 13050; // sale_price from DB
    const motorDiscount = motorMSRP - motorSalePrice; // 1200
    const adminDiscount = 500;
    const accessoryTotal = 1500; // controls + harness + gauges
    const tradeInValue = 3500;
    const promoSavings = 500; // cash rebate

    const result = calculateQuotePricing({
      motorMSRP,
      motorDiscount,
      adminDiscount,
      accessoryTotal,
      warrantyPrice: 0,
      promotionalSavings: promoSavings,
      tradeInValue,
      taxRate: TAX_RATE,
    });

    // Motor price: 14250 - 1200 - 500 = 12550
    // Subtotal: 12550 + 1500 - 3500 - 500 = 10050
    expect(result.subtotal).toBe(10050);
    expect(result.tax).toBeCloseTo(10050 * 0.13, 2);
    expect(result.total).toBeCloseTo(10050 * 1.13, 2);
    expect(result.savings).toBe(1200 + 500 + 500 + 3500); // 5700
  });

  it('frozen pricing override produces exact PDF match', () => {
    // Simulate: quote was saved with these frozen values
    const frozenPricing = {
      motorMSRP: 14250,
      motorDiscount: 1200,
      adminDiscount: 500,
      promoSavings: 500,
      subtotal: 10050,
      hst: 1306.50,
      total: 11356.50,
      savings: 5700,
    };

    // Simulate: live recalculation produces slightly different result
    // (e.g., warranty price changed in DB)
    const liveResult = calculateQuotePricing({
      motorMSRP: 14250,
      motorDiscount: 1200,
      adminDiscount: 500,
      accessoryTotal: 1600, // Changed! +$100
      warrantyPrice: 0,
      promotionalSavings: 500,
      tradeInValue: 3500,
      taxRate: TAX_RATE,
    });

    // Live would give different subtotal
    expect(liveResult.subtotal).toBe(10150); // Different from frozen

    // But displayPricing should use frozen values
    const displayPricing = frozenPricing.subtotal != null && frozenPricing.total != null
      ? {
          subtotal: frozenPricing.subtotal,
          tax: frozenPricing.hst ?? frozenPricing.subtotal * 0.13,
          total: frozenPricing.total,
          savings: frozenPricing.savings,
        }
      : liveResult;

    // Display must match frozen (PDF) values exactly
    expect(displayPricing.subtotal).toBe(10050);
    expect(displayPricing.total).toBe(11356.50);
    expect(displayPricing.savings).toBe(5700);
  });

  it('adminDiscount is applied before tax, not after', () => {
    const withAdminDiscount = calculateQuotePricing({
      motorMSRP: 20000,
      motorDiscount: 2000,
      adminDiscount: 1000,
      accessoryTotal: 0,
      warrantyPrice: 0,
      promotionalSavings: 0,
      tradeInValue: 0,
      taxRate: TAX_RATE,
    });

    // Correct: (20000 - 2000 - 1000) * 1.13 = 17000 * 1.13 = 19210
    // Wrong (after tax): (20000 - 2000) * 1.13 - 1000 = 20340 - 1000 = 19340
    expect(withAdminDiscount.subtotal).toBe(17000);
    expect(withAdminDiscount.total).toBeCloseTo(19210, 2);
  });

  it('promo savings reduce subtotal before tax', () => {
    const withPromo = calculateQuotePricing({
      motorMSRP: 15000,
      motorDiscount: 1000,
      accessoryTotal: 500,
      warrantyPrice: 0,
      promotionalSavings: 750,
      tradeInValue: 0,
      taxRate: TAX_RATE,
    });

    // Subtotal: (15000 - 1000) + 500 - 750 = 13750
    expect(withPromo.subtotal).toBe(13750);
    expect(withPromo.total).toBeCloseTo(13750 * 1.13, 2);
  });

  it('trade-in reduces taxable subtotal (tax savings)', () => {
    const withTradeIn = calculateQuotePricing({
      motorMSRP: 15000,
      motorDiscount: 0,
      accessoryTotal: 0,
      warrantyPrice: 0,
      promotionalSavings: 0,
      tradeInValue: 5000,
      taxRate: TAX_RATE,
    });

    // Subtotal: 15000 - 5000 = 10000
    // Tax on 10000, not on 15000 (trade-in tax savings = 5000 * 0.13 = 650)
    expect(withTradeIn.subtotal).toBe(10000);
    expect(withTradeIn.tax).toBeCloseTo(1300, 2);
    expect(withTradeIn.total).toBeCloseTo(11300, 2);
  });
});
