import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getFinancingGateBeforeTax } from '@/lib/quote-utils';
import { FINANCING_MINIMUM } from '@/lib/finance';

describe('financing gate before-tax amount (post-rebate, post-trade)', () => {
  it('subtracts the factory rebate: $5,200 with a $350 rebate gates at $4,850', () => {
    const gate = getFinancingGateBeforeTax(5200, 350);
    expect(gate).toBe(4850);
    expect(gate < FINANCING_MINIMUM).toBe(true);
  });

  it('stays eligible when the post-rebate subtotal reaches $5,000', () => {
    expect(getFinancingGateBeforeTax(5350, 350)).toBe(5000);
    expect(getFinancingGateBeforeTax(5350, 350) >= FINANCING_MINIMUM).toBe(true);
  });

  it('is unchanged without a price discount and never goes negative', () => {
    expect(getFinancingGateBeforeTax(5200, 0)).toBe(5200);
    expect(getFinancingGateBeforeTax(300, 350)).toBe(0);
    expect(getFinancingGateBeforeTax(Number.NaN, Number.NaN)).toBe(0);
  });

  it('QuoteDisplay gates PromoOptionSelector on the post-rebate amount', () => {
    const source = readFileSync('src/components/quote-builder/QuoteDisplay.tsx', 'utf8');
    expect(source).toContain('getFinancingGateBeforeTax(subtotalBeforeTax, promotionSavings.priceDiscount)');
    expect(source).toContain('beforeTaxAmount={financingGateBeforeTax}');
    expect(source).not.toContain('beforeTaxAmount={subtotalBeforeTax}');
    // Displayed subtotal is unchanged: it still renders subtotalBeforeTax.
    expect(source).toContain('formatCurrency(subtotalBeforeTax)');
    // Only the price discount is subtracted, never total promo value.
    expect(source).not.toContain('getFinancingGateBeforeTax(subtotalBeforeTax, promotionSavings.totalPromoValue)');
  });
});
