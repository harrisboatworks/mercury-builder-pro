import { describe, expect, it } from 'vitest';
import {
  buildQuotePdfFinancing,
  buildLegacyQuotePdfSnapshot,
  calculateProtectionMonthlyDelta,
  QUOTE_PDF_SNAPSHOT_VERSION,
  resolveQuoteMotorImage,
  validateQuotePdfSnapshot,
} from '@/lib/quote-pdf-data';

describe('quote PDF data', () => {
  it('keeps the selected motor image used by the quote builder', () => {
    expect(resolveQuoteMotorImage({ image: 'https://cdn.example.com/90-fourstroke.jpg' }))
      .toBe('https://cdn.example.com/90-fourstroke.jpg');
    expect(resolveQuoteMotorImage({ images: [{ media_url: 'https://cdn.example.com/gallery.jpg' }] }))
      .toBe('https://cdn.example.com/gallery.jpg');
  });

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

  it('rebuilds payment from the same post-rebate financed amount used by the PDF', () => {
    // Representative live failure from 2026-07-20: the visible quote had a
    // $15,285 subtotal after a $250 rebate, while the prior snapshot still
    // carried the pre-rebate amount financed and failed PDF validation.
    const amountFinanced = 15_285 * 1.13 + 349;
    const financing = buildQuotePdfFinancing({
      amountFinanced,
      rate: 5.48,
      amortizationMonths: 60,
      dealerFee: 349,
    });

    expect(financing).toMatchObject({
      amountFinanced: 17_621.05,
      monthlyPayment: 336,
      rate: 5.48,
      amortizationMonths: 60,
      contractTermMonths: 60,
      dealerFee: 349,
    });

    const result = validateQuotePdfSnapshot({
      version: QUOTE_PDF_SNAPSHOT_VERSION,
      createdAt: '2026-07-20T22:11:00.000Z',
      motor: { model: '90 ELPT FourStroke', hp: 90, msrp: 16_665, modelYear: 2026, category: 'FourStroke' },
      pricing: {
        msrp: 16_665,
        discount: 1_705,
        promoValue: 250,
        motorSubtotal: 14_710,
        subtotal: 15_285,
        hst: 1_987.05,
        totalCashPrice: 17_272.05,
        savings: 1_955,
      },
      accessoryBreakdown: [
        { name: 'Control Adaptor Harness', price: 125 },
        { name: 'Professional Installation', price: 450 },
        { name: 'Propeller: Use Existing', price: 0 },
      ],
      purchasePath: 'installed',
      includedCoverageYears: 3,
      financing,
    });

    expect(result).toEqual({ isValid: true, errors: [] });
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

  it('accepts itemized, tax and financing values that reconcile', () => {
    const result = validateQuotePdfSnapshot({
      version: QUOTE_PDF_SNAPSHOT_VERSION,
      createdAt: '2026-07-19T12:00:00.000Z',
      motor: { model: '60 ELPT FourStroke', hp: 60, msrp: 11000, modelYear: 2026, category: 'FourStroke' },
      pricing: {
        msrp: 11000,
        discount: 1000,
        promoValue: 250,
        motorSubtotal: 9750,
        subtotal: 10800,
        hst: 1404,
        totalCashPrice: 12204,
        savings: 1250,
      },
      accessoryBreakdown: [{ name: 'Rigging package', price: 1050 }],
      purchasePath: 'installed',
      includedCoverageYears: 3,
      financing: {
        monthlyPayment: 240,
        rate: 5.48,
        amortizationMonths: 60,
        contractTermMonths: 60,
        amountFinanced: 12553,
        dealerFee: 349,
      },
    });

    expect(result).toEqual({ isValid: true, errors: [] });
  });

  it('rejects a PDF snapshot whose displayed items or payment do not reconcile', () => {
    const result = validateQuotePdfSnapshot({
      version: QUOTE_PDF_SNAPSHOT_VERSION,
      createdAt: '2026-07-19T12:00:00.000Z',
      motor: { model: '60 ELPT FourStroke', hp: 60, msrp: 11000, modelYear: 2026, category: 'FourStroke' },
      pricing: {
        msrp: 11000,
        discount: 1000,
        promoValue: 250,
        motorSubtotal: 9750,
        subtotal: 10800,
        hst: 1404,
        totalCashPrice: 12204,
        savings: 1250,
      },
      accessoryBreakdown: [{ name: 'Rigging package', price: 800 }],
      purchasePath: 'installed',
      includedCoverageYears: 3,
      financing: {
        monthlyPayment: 372,
        rate: 5.48,
        amortizationMonths: 60,
        contractTermMonths: 60,
        amountFinanced: 12553,
        dealerFee: 349,
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      'The itemized prices do not add up to the subtotal.',
      'The monthly payment does not match the financed amount, APR and amortization.',
    ]));
  });

  it('rejects non-numeric persisted line-item prices', () => {
    const result = validateQuotePdfSnapshot({
      version: QUOTE_PDF_SNAPSHOT_VERSION,
      createdAt: '2026-07-19T12:00:00.000Z',
      motor: { model: '60 ELPT FourStroke', hp: 60, msrp: 11000, modelYear: 2026, category: 'FourStroke' },
      pricing: { msrp: 11000, discount: 1000, promoValue: 0, motorSubtotal: 10000, subtotal: 10000, hst: 1300, totalCashPrice: 11300, savings: 1000 },
      accessoryBreakdown: [{ name: 'Broken legacy item', price: Number.NaN }],
      purchasePath: 'installed',
      includedCoverageYears: 3,
    });

    expect(result.errors).toContain('One or more printed prices are invalid.');
  });
});
