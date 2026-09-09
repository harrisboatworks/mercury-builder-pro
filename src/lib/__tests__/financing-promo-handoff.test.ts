import { describe, expect, it } from 'vitest';
import { purchaseDetailsSchema } from '@/lib/financingValidation';

describe('financing promotion handoff', () => {
  it('preserves the layered rebate and promotional financing as separate facts', () => {
    const purchaseDetails = purchaseDetailsSchema.parse({
      motorModel: '60 ELPT FourStroke (Essential)',
      motorPrice: 14_866,
      downPayment: 0,
      tradeInValue: 0,
      amountToFinance: 14_866,
      preferredTerm: '24',
      promoOption: 'special_financing',
      promoRate: 2.99,
      promoTerm: 24,
      promoValue: '2.99% APR for 24 months',
      promoName: 'Mercury Summer Savings',
      promoSavings: 250,
      promoCombinationMode: 'layered',
    });

    expect(purchaseDetails).toMatchObject({
      promoOption: 'special_financing',
      promoRate: 2.99,
      promoTerm: 24,
      promoName: 'Mercury Summer Savings',
      promoSavings: 250,
      promoCombinationMode: 'layered',
    });
  });

  it('preserves a genuine 0% promotional rate', () => {
    const purchaseDetails = purchaseDetailsSchema.parse({
      motorModel: '150 FourStroke',
      motorPrice: 20112.7,
      downPayment: 0,
      tradeInValue: 0,
      amountToFinance: 20112.7,
      preferredTerm: '60',
      promoOption: 'special_financing',
      promoRate: 0,
      promoTerm: 60,
      promoValue: '0% APR for 60 months',
    });

    expect(purchaseDetails.promoRate).toBe(0);
    expect(purchaseDetails.promoTerm).toBe(60);
  });
});
