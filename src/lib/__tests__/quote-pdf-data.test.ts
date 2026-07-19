import { describe, expect, it } from 'vitest';
import {
  buildLegacyQuotePdfSnapshot,
  calculateProtectionMonthlyDelta,
  QUOTE_PDF_SNAPSHOT_VERSION,
} from '@/lib/quote-pdf-data';

describe('quote PDF data', () => {
  it('calculates the Platinum payment increment from price plus HST', () => {
    expect(calculateProtectionMonthlyDelta({
      priceBeforeTax: 1365,
      annualRate: 5.48,
      amortizationMonths: 60,
    })).toBe(29);
    expect(calculateProtectionMonthlyDelta({
      priceBeforeTax: 1365,
      annualRate: 5.48,
      amortizationMonths: 240,
    })).toBe(11);
  });

  it('refuses to invent a PDF snapshot when exact persisted totals are absent', () => {
    expect(buildLegacyQuotePdfSnapshot({
      motor: { model: '60 ELPT FourStroke', hp: 60, msrp: 11000 },
    })).toBeNull();
  });

  it('adapts an exact frozen quote without replacing its promotion value', () => {
    const snapshot = buildLegacyQuotePdfSnapshot({
      motor: { model: '60 ELPT FourStroke', hp: 60, msrp: 11000, year: 2026 },
      purchasePath: 'installed',
      selectedPromoOption: 'special_financing',
      selectedPromoValue: '2.99%',
      selectedPaymentMethod: 'special_financing',
      frozenPricing: {
        motorMSRP: 11000,
        motorDiscount: 1000,
        adminDiscount: 0,
        promoSavings: 250,
        subtotal: 10800,
        hst: 1404,
        total: 12204,
        savings: 1250,
        promotionName: 'Summer Savings Rebate',
        promotionEndDate: '2026-08-31',
      },
    }, '2026-07-19T12:00:00.000Z');

    expect(snapshot).toMatchObject({
      version: QUOTE_PDF_SNAPSHOT_VERSION,
      pricing: { promoValue: 250, totalCashPrice: 12204 },
      promotion: {
        name: 'Summer Savings Rebate',
        endDate: '2026-08-31',
        selectedOption: 'special_financing',
      },
    });
  });
});
