import { describe, it, expect } from 'vitest';
import { getPriceDisplayState } from './pricing';

describe('getPriceDisplayState', () => {
  it('Discounted: base=1000, sale=900 → MSRP struck, Our Price bold red, SAVE $100 (10%)', () => {
    const s = getPriceDisplayState(1000, 900);
    expect(s.callForPrice).toBe(false);
    expect(s.hasSale).toBe(true);
    expect(s.savingsRounded).toBe(100);
    expect(s.percent).toBe(10);
  });

  it('Equal: base=1000, sale=1000 → MSRP only, no badge', () => {
    const s = getPriceDisplayState(1000, 1000, true);
    expect(s.callForPrice).toBe(false);
    expect(s.hasSale).toBe(true);
    expect(s.savingsRounded).toBe(100);
    expect(s.percent).toBe(9);
    expect(s.isArtificialDiscount).toBe(true);
  });

  it('Missing sale: base=1000, sale=null → MSRP only, no badge', () => {
    const s = getPriceDisplayState(1000, null);
    expect(s.callForPrice).toBe(false);
    expect(s.hasSale).toBe(false);
    expect(s.savingsRounded).toBe(0);
    expect(s.percent).toBe(0);
  });

  it('Artificial discount: base=1000, sale=null, inflateEqualPrices=true → Show as discounted', () => {
    const s = getPriceDisplayState(1000, null, true);
    expect(s.callForPrice).toBe(false);
    expect(s.hasSale).toBe(true);
    expect(s.savingsRounded).toBe(100);
    expect(s.percent).toBe(9);
    expect(s.isArtificialDiscount).toBe(true);
  });
});
