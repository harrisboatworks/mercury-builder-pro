// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CANONICAL_LAST_UPDATED, CANONICAL_SKUS } from './canonical-pricing.generated';
import { buildMercuryProXSOffers } from './mercuryProXSOffers.js';

describe('buildMercuryProXSOffers', () => {
  it('uses the canonical pricing snapshot date for all four Merchant listing offers', () => {
    const offers = buildMercuryProXSOffers({
      skus: CANONICAL_SKUS,
      lastUpdated: CANONICAL_LAST_UPDATED,
      siteUrl: 'https://www.mercuryrepower.ca',
    });

    expect(offers.map((offer) => offer.name)).toEqual([
      'Mercury 115 Pro XS',
      'Mercury 150 Pro XS',
      'Mercury 200 Pro XS',
      'Mercury 250 Pro XS',
    ]);
    expect(offers.every((offer) => offer.validFrom === CANONICAL_LAST_UPDATED)).toBe(true);
    expect(offers.every((offer) => Number.isFinite(offer.startingAt))).toBe(true);
  });

  it('fails closed when the canonical pricing snapshot has no valid date', () => {
    expect(() => buildMercuryProXSOffers({
      skus: CANONICAL_SKUS,
      lastUpdated: '',
      siteUrl: 'https://www.mercuryrepower.ca',
    })).toThrow('Invalid canonical pricing last_updated date');
  });
});
