import { describe, expect, it } from 'vitest';
import { buildProfessionalQuotePdfData } from '@/lib/react-pdf-generator';
import { QUOTE_PDF_SNAPSHOT_VERSION } from '@/lib/quote-pdf-data';

describe('professional quote PDF normalization', () => {
  it('prefers the immutable snapshot and carries financing semantics through', () => {
    const result = buildProfessionalQuotePdfData({
      quoteNumber: 'HBW-123456',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      snapshot: {
        version: QUOTE_PDF_SNAPSHOT_VERSION,
        createdAt: '2026-07-19T12:00:00.000Z',
        validUntil: '2026-08-18T23:59:59.000Z',
        motor: { model: '60 ELPT FourStroke', hp: 60, msrp: 11000, modelYear: 2026, category: 'FourStroke' },
        pricing: { msrp: 11000, discount: 1000, promoValue: 250, motorSubtotal: 9750, subtotal: 10800, hst: 1404, totalCashPrice: 12204, savings: 1250 },
        accessoryBreakdown: [],
        purchasePath: 'installed',
        includedCoverageYears: 3,
        paymentMethod: 'standard_financing',
        financing: { monthlyPayment: 233, rate: 5.48, amortizationMonths: 60, contractTermMonths: 60, amountFinanced: 12553, dealerFee: 349 },
      },
      // Contradictory legacy values must not override the exact snapshot.
      pricing: { totalCashPrice: 1, promoValue: 0 },
      monthlyPayment: 1,
      financingRate: 99,
      financingTerm: 1,
    });

    expect(result.total).toBe('12,204.00');
    expect(result.promoSavings).toBe('250.00');
    expect(result.monthlyPayment).toBe(233);
    expect(result.financingTerm).toBe(60);
    expect(result.financingRate).toBe(5.48);
    expect(result.dealerFee).toBe(349);
    expect(result.includesInstallation).toBe(true);
  });

  it('uses the nested financing object for older exact callers', () => {
    const result = buildProfessionalQuotePdfData({
      quoteNumber: 'HBW-654321',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      motor: { model: '20 ELH FourStroke', hp: 20, msrp: 5000 },
      pricing: { msrp: 5000, discount: 500, promoValue: 0, motorSubtotal: 4500, subtotal: 4500, hst: 585, totalCashPrice: 5085, savings: 500 },
      financing: { monthlyPayment: 122, term: 48, rate: 7.99, dealerFee: 349, amountFinanced: 5434, contractTermMonths: 60 },
    });

    expect(result.monthlyPayment).toBe(122);
    expect(result.financingTerm).toBe(48);
    expect(result.financingRate).toBe(7.99);
    expect(result.financingAmount).toBe(5434);
  });

  it('keeps the saved-quote QR code on a cash quote', () => {
    const savedQuoteQr = 'data:image/png;base64,saved-quote-qr';
    const result = buildProfessionalQuotePdfData({
      quoteNumber: 'HBW-CASH-QR',
      customerName: 'Cash Customer',
      customerEmail: 'cash@example.com',
      motor: { model: '9.9 ELH FourStroke', hp: 9.9, msrp: 4895 },
      pricing: { msrp: 4895, discount: 496, promoValue: 0, motorSubtotal: 4399, subtotal: 4578.99, hst: 595.27, totalCashPrice: 5174.26, savings: 496 },
      selectedPaymentMethod: 'cash_purchase',
      financingQrCode: savedQuoteQr,
    });

    expect(result.selectedPaymentMethod).toBe('cash_purchase');
    expect(result.financingQrCode).toBe(savedQuoteQr);
  });
});
