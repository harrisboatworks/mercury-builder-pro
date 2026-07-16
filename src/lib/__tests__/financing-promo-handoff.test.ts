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
});
