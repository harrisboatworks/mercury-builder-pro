import { describe, expect, it } from 'vitest';
import {
  calculateFinancingPurchase,
  financingAmountToFinance,
  FINANCING_PRICE_BASIS_ALL_IN_AFTER_TRADE,
} from '@/lib/financing-purchase';

describe('calculateFinancingPurchase', () => {
  it('applies HST savings once for the 60 HP installed quote', () => {
    const purchase = calculateFinancingPurchase({
      afterTradeSubtotal: 8240,
      estimatedValue: 4125,
      hasTradeIn: true,
      dealerFee: 349,
    });
    expect(purchase.motorPrice).toBeCloseTo(9660.2, 2);
    expect(purchase.tradeInValue).toBe(4125);
    expect(purchase.priceBasis).toBe(FINANCING_PRICE_BASIS_ALL_IN_AFTER_TRADE);
  });

  it('does not subtract trade again from an all-in price', () => {
    expect(financingAmountToFinance(9660.2, 0, 4125, FINANCING_PRICE_BASIS_ALL_IN_AFTER_TRADE))
      .toBeCloseTo(9660.2, 2);
  });
});
