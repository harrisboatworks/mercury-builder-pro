import { describe, expect, it } from 'vitest';
import { DEALERPLAN_FEE } from './finance';
import { getFinancingApplicationUrl } from './financingApplicationLink';

describe('getFinancingApplicationUrl', () => {
  it('hands the application a clearly named all-in amount', () => {
    const url = new URL(
      getFinancingApplicationUrl(
        {
          price: 12_345.67,
          motorModel: '20 EH FourStroke',
        },
        DEALERPLAN_FEE,
      ),
      'https://www.mercuryrepower.ca',
    );

    expect(url.pathname).toBe('/financing-application');
    expect(url.searchParams.get('motorModel')).toBe('20 EH FourStroke');
    expect(url.searchParams.get('motorPrice')).toBe('14299.61');
    expect(url.searchParams.has('motor')).toBe(false);
    expect(url.searchParams.has('price')).toBe(false);
  });

  it('does not invent a financed amount when no price is available', () => {
    const url = new URL(
      getFinancingApplicationUrl({ price: 0 }, DEALERPLAN_FEE),
      'https://www.mercuryrepower.ca',
    );

    expect(url.pathname).toBe('/financing-application');
    expect(url.search).toBe('');
  });
});
