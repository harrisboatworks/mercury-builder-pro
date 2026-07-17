import { describe, expect, it } from 'vitest';
import { MERCURY_PLATINUM_RATES } from '@/data/mercuryProductProtection';
import { MERCURY_PLATINUM_PRODUCT_PROTECTION_RATES } from '../../../supabase/functions/_shared/mercury-product-protection-rates';

describe('Product Protection edge prompt parity', () => {
  it('keeps every AI chat rate identical to the canonical site rate card', () => {
    const canonical = MERCURY_PLATINUM_RATES.map((band) => ({
      label: band.label,
      hpMin: band.hpMin,
      hpMax: band.hpMax,
      prices: [1, 2, 3, 4, 5].map((year) => band.prices[year as 1 | 2 | 3 | 4 | 5]),
    }));

    expect(MERCURY_PLATINUM_PRODUCT_PROTECTION_RATES).toEqual(canonical);
  });
});
