import { describe, expect, it } from 'vitest';
import {
  FINANCING_ESTIMATE_DISCLAIMER,
  financingTermsLine,
  mercuryFamilyLabel,
  motorMetaLine,
  quoteInspectionCaveat,
  type QuotePDFProps,
} from './ProfessionalQuotePDF';

describe('professional quote PDF display copy', () => {
  it.each([
    ['9.9 MH FourStroke', '9.9HP', 'portable'],
    ['90 ELPT FourStroke', '90HP', 'mid-range'],
    ['115 Pro XS', '115HP', 'high-performance'],
    ['250 XL Verado', '250HP', 'premium'],
  ])('maps %s to the correct Mercury family', (productName, horsepower, expected) => {
    expect(mercuryFamilyLabel(productName, horsepower, 'high-performance')).toBe(expected);
  });

  it('does not invent a model year for a Mercury outboard', () => {
    const quoteData = {
      productName: '90 ELPT FourStroke',
      horsepower: '90HP',
      category: 'high-performance',
      modelYear: 2025,
    } as QuotePDFProps['quoteData'];

    expect(motorMetaLine(quoteData, [
      '90 = horsepower',
      'E = electric start',
      'L = 20-inch shaft',
      'PT = Power Trim and Tilt',
    ])).toBe('Mercury mid-range | 90HP | electric start | 20-inch shaft | Power Trim and Tilt');
  });

  it('explains 60/72 financing without making the terms look contradictory', () => {
    expect(financingTermsLine(5.48, 60, 72))
      .toBe('5.48% APR | up to 60-month contract | payment based on 72-month amortization');
  });

  it('keeps equal contract and amortization terms concise', () => {
    expect(financingTermsLine(5.48, 60, 60))
      .toBe('5.48% APR | up to 60-month contract and amortization');
  });

  it('prints a selected 24-month promotion as the exact contract and amortization', () => {
    expect(financingTermsLine(2.99, 24, 24, true))
      .toBe('2.99% APR | 24-month contract and amortization');
  });

  it('keeps the financing estimate protection explicit', () => {
    expect(FINANCING_ESTIMATE_DISCLAIMER)
      .toBe('Payment figures are estimates and may change with the final financed amount, rate, term or lender approval.');
  });

  it.each([
    [
      { accessoryBreakdown: [], tradeInValue: undefined },
      null,
    ],
    [
      { accessoryBreakdown: [{ name: 'Propeller Allowance', price: 350 }], tradeInValue: undefined },
      'Propeller fit remains subject to final inspection and water testing.',
    ],
    [
      { accessoryBreakdown: [], tradeInValue: 2500 },
      'Final trade-in value remains subject to final inspection and verification.',
    ],
    [
      { accessoryBreakdown: [{ name: 'Propeller Allowance', price: 350 }], tradeInValue: 2500 },
      'Final trade-in value and propeller fit remain subject to final inspection and water testing.',
    ],
  ])('shows only the applicable final-inspection caveat', (quoteData, expected) => {
    expect(quoteInspectionCaveat(quoteData)).toBe(expected);
  });
});
