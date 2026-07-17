import { describe, expect, it } from 'vitest';
import { MERCURY_PLATINUM_RATES } from '@/data/mercuryProductProtection';
import {
  buildMercuryProductProtectionCustomerAnswer,
  MERCURY_PLATINUM_PRODUCT_PROTECTION_RATES,
} from '../../../supabase/functions/_shared/mercury-product-protection-rates';

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

  it('answers an explicit HP and plan-term question instead of routing to motor pricing', () => {
    expect(buildMercuryProductProtectionCustomerAnswer(
      'How much is a 4-year Mercury Platinum Product Protection plan for a 115 HP motor in Canada before tax?',
    )).toContain('$1,748 CAD before HST');
  });

  it('returns every exact plan price when no term is specified', () => {
    const answer = buildMercuryProductProtectionCustomerAnswer(
      'What are the Mercury Platinum Product Protection prices for 150 HP?',
    );

    expect(answer).toContain('1 year: $753');
    expect(answer).toContain('5 years: $2,900');
  });

  it('fails closed for unsupported horsepower and does not intercept ordinary motor pricing', () => {
    expect(buildMercuryProductProtectionCustomerAnswer(
      'How much is a 1-year Platinum Product Protection plan for 1000 HP?',
    )).toContain("won't guess");
    expect(buildMercuryProductProtectionCustomerAnswer('How much is a 115 HP outboard?')).toBeNull();
  });
});
