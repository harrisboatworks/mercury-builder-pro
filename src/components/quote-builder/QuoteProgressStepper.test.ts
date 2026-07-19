import { describe, expect, it } from 'vitest';
import { canNavigateQuoteProgress, getVisibleQuoteSteps } from './quote-progress-steps';

describe('quote progress steps', () => {
  it('keeps the visited trade-in page visible before a customer chooses yes or no', () => {
    const steps = getVisibleQuoteSteps({
      hasTradein: false,
      purchasePath: 'installed',
      motor: { hp: 90, model: '90 ELPT FourStroke' },
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

describe('quote progress navigation', () => {
  it('allows revisiting completed steps but never bypassing required future steps', () => {
    const boatIndex = 3;
    expect(canNavigateQuoteProgress(boatIndex, 0)).toBe(true);
    expect(canNavigateQuoteProgress(boatIndex, boatIndex)).toBe(true);
    expect(canNavigateQuoteProgress(boatIndex, 4)).toBe(false);
    expect(canNavigateQuoteProgress(boatIndex, 5)).toBe(false);
  });
});
