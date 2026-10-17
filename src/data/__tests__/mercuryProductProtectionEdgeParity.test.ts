import { describe, expect, it } from 'vitest';
import { MERCURY_PLATINUM_RATES } from '@/data/mercuryProductProtection';
import {
  calculateMercuryPlatinumCoverageCost as edgeCoverageCost,
  MERCURY_GOLD_TO_PLATINUM_UPGRADE_PRICES,
} from '../../../supabase/functions/_shared/mercury-platinum-coverage';
import { buildMercuryProductProtectionCustomerAnswer, MERCURY_PLATINUM_PRODUCT_PROTECTION_RATES } from '../../../supabase/functions/_shared/mercury-product-protection-rates';
import { calculateMercuryPlatinumCoverageCost } from '@/data/mercuryProductProtection';

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

  it('keeps Gold upgrade rates and full promo coverage cost identical to canonical', () => {
    for (const band of MERCURY_PLATINUM_RATES) {
      const expected = band.goldUpgradePrices ? [1,2,3,4,5].map((y) => band.goldUpgradePrices![y as 1|2|3|4|5]) : null;
      expect(MERCURY_GOLD_TO_PLATINUM_UPGRADE_PRICES[band.label]).toEqual(expected);
    }
    expect(edgeCoverageCost(60, 5, 8)).toMatchObject({ goldUpgradePrice: 153, platinumExtensionPrice: 904, totalPrice: 1057 });
    expect(edgeCoverageCost(115, 5, 8)?.totalPrice).toBe(calculateMercuryPlatinumCoverageCost(115, 5, 8)?.totalPrice);
    expect(edgeCoverageCost(500, 5, 8)).toBeNull();
  });

  it('matches frontend totals for every band, promo count and target', () => {
    const reps = [9.9, 25, 60, 115, 175, 250, 350, 400, 425, 500, 600];
    for (const hp of reps) {
      for (let included = 3; included <= 8; included++) {
        for (let target = included; target <= 8; target++) {
          expect(edgeCoverageCost(hp, included, target)?.totalPrice ?? null, `${hp}HP ${included}->${target}`)
            .toBe(calculateMercuryPlatinumCoverageCost(hp, included, target)?.totalPrice ?? null);
        }
      }
    }
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
