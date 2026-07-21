import { describe, expect, it } from 'vitest';
import {
  financingTermsLine,
  mercuryFamilyLabel,
  motorMetaLine,
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
      .toBe('5.48% APR | 60-month contract | payment based on 72-month amortization');
  });

  it('keeps equal contract and amortization terms concise', () => {
    expect(financingTermsLine(5.48, 60, 60))
      .toBe('5.48% APR | 60-month contract and amortization');
  });
});
