import { describe, expect, it } from 'vitest';
import { getQuoteStepNumber } from './quote-progress-steps';

describe('getQuoteStepNumber', () => {
  it('numbers the installed path in the order customers see it', () => {
    const state = { purchasePath: 'installed' as const, motor: { isTiller: false } };
    expect(getQuoteStepNumber(state, '/quote/boat-info')).toBe(4);
    expect(getQuoteStepNumber(state, '/quote/trade-in')).toBe(5);
    expect(getQuoteStepNumber(state, '/quote/installation')).toBe(6);
    expect(getQuoteStepNumber(state, '/quote/promo-selection')).toBe(7);
  });

  it('returns null for a step that is not visible on the selected path', () => {
    const state = { purchasePath: 'loose' as const, motor: { hp: 60, model: '60 ELPT FourStroke' } };
    expect(getQuoteStepNumber(state, '/quote/boat-info')).toBeNull();
    expect(getQuoteStepNumber(state, '/quote/fuel-tank')).toBeNull();
    expect(getQuoteStepNumber(state, '/quote/installation')).toBeNull();
    expect(getQuoteStepNumber(state, '/quote/trade-in')).toBe(4);
    expect(getQuoteStepNumber(state, '/quote/promo-selection')).toBe(5);
  });

  it('keeps fuel-tank choices in Options instead of inventing a duplicate step', () => {
    const state = {
      purchasePath: 'loose' as const,
      motor: { hp: 9.9, model: '9.9ELH FourStroke', type: 'FourStroke' },
    };
    expect(getQuoteStepNumber(state, '/quote/fuel-tank')).toBeNull();
    expect(getQuoteStepNumber(state, '/quote/trade-in')).toBe(4);
    expect(getQuoteStepNumber(state, '/quote/summary')).toBe(6);
  });
});
