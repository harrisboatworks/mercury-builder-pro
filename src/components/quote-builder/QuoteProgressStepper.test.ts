import { describe, expect, it } from 'vitest';
import { getVisibleQuoteSteps } from './quote-progress-steps';

describe('quote progress steps', () => {
  it('keeps the visited trade-in page visible before a customer chooses yes or no', () => {
    const steps = getVisibleQuoteSteps({
      hasTradein: false,
      purchasePath: 'installed',
      motor: { isTiller: false },
    });

    expect(steps.map((step) => step.path)).toEqual([
      '/quote/motor-selection',
      '/quote/options',
      '/quote/purchase-path',
      '/quote/boat-info',
      '/quote/trade-in',
      '/quote/installation',
      '/quote/promo-selection',
      '/quote/summary',
    ]);
    expect(steps.findIndex((step) => step.path === '/quote/trade-in')).toBe(4);
  });
});
