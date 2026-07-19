import { describe, expect, it } from 'vitest';
import { calculateQuoteOptionsTotal } from './quote-options-total';

describe('calculateQuoteOptionsTotal', () => {
  const options = [
    { id: 'controls', base_price: 132.53, price_override: null, is_included: false },
    { id: 'override', base_price: 200, price_override: 175.25, is_included: false },
    { id: 'included', base_price: 500, price_override: null, is_included: true },
  ];

  it('adds a selected loose-motor battery to the running total', () => {
    expect(calculateQuoteOptionsTotal(options, new Set(), 179.99)).toBeCloseTo(179.99);
    expect(calculateQuoteOptionsTotal(options, new Set(['controls']), 179.99)).toBeCloseTo(312.52);
  });

  it('uses overrides and excludes included options', () => {
    expect(calculateQuoteOptionsTotal(options, new Set(['override', 'included']))).toBeCloseTo(175.25);
  });
});
