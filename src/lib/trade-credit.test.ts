import { describe, expect, it } from 'vitest';
import { applyTradeCredit, resolveAppliedTradeValue } from '@/lib/trade-credit';

describe('applyTradeCredit', () => {
  it('caps credit at the pre-trade subtotal and never goes negative', () => {
    const applied = applyTradeCredit({
      preTradeSubtotal: 3000,
      estimatedValue: 8000,
      hasTradeIn: true,
    });
    expect(applied.estimate).toBe(8000);
    expect(applied.credit).toBe(3000);
    expect(applied.subtotal).toBe(0);
    expect(applied.tax).toBe(0);
    expect(applied.total).toBe(0);
    expect(applied.taxSaving).toBeCloseTo(390, 5);
  });

  it('keeps the estimate when hasTradeIn is false', () => {
    const applied = applyTradeCredit({
      preTradeSubtotal: 10000,
      estimatedValue: 5000,
      hasTradeIn: false,
    });
    expect(applied.estimate).toBe(5000);
    expect(applied.credit).toBe(0);
    expect(applied.subtotal).toBe(10000);
  });

  it('reports HST saved on the applied credit', () => {
    const applied = applyTradeCredit({
      preTradeSubtotal: 8240 + 4125,
      estimatedValue: 4125,
      hasTradeIn: true,
    });
    expect(applied.credit).toBe(4125);
    expect(applied.subtotal).toBe(8240);
    expect(applied.taxSaving).toBeCloseTo(536.25, 2);
  });
});

describe('resolveAppliedTradeValue', () => {
  it('returns 0 when trade is switched off', () => {
    expect(resolveAppliedTradeValue({ hasTradeIn: false, estimatedValue: 5000 })).toBe(0);
  });
});
