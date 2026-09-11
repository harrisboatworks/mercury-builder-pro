import { describe, it, expect } from 'vitest';
import { formatPricingAsOf, substituteLiveRateTokens } from './finance';

describe('formatPricingAsOf', () => {
  it('formats an ISO date as month and year', () => {
    expect(formatPricingAsOf('2026-07-14')).toBe('July 2026');
    expect(formatPricingAsOf('2026-09-02')).toBe('September 2026');
  });

  it('formats first-of-month dates without timezone drift', () => {
    expect(formatPricingAsOf('2026-01-01')).toBe('January 2026');
    expect(formatPricingAsOf('2026-12-31')).toBe('December 2026');
  });

  it('passes non-ISO input through unchanged', () => {
    expect(formatPricingAsOf('July 2026')).toBe('July 2026');
    expect(formatPricingAsOf('')).toBe('');
  });
});

describe('substituteLiveRateTokens PRICING_ASOF', () => {
  it('resolves the token when a dateModified is supplied', () => {
    expect(
      substituteLiveRateTokens('planning figures as of {{PRICING_ASOF}}.', {
        dateModified: '2026-08-07',
      }),
    ).toBe('planning figures as of August 2026.');
  });

  it('leaves the token alone when no dateModified is supplied', () => {
    expect(substituteLiveRateTokens('as of {{PRICING_ASOF}}')).toBe('as of {{PRICING_ASOF}}');
  });
});
