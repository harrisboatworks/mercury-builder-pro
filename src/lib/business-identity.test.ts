import { describe, expect, it } from 'vitest';
import { buildBusinessIdentity, buildPickupAreaNodes, BUSINESS_ENTITY_ID } from './business-identity.js';
import { BUSINESS_GEO } from './companyInfo';
import { locations } from '@/data/locations';
import { MERCURY_OUTBOARDS_ONTARIO_OFFERS } from '@/data/mercuryOutboardsOffers.js';

describe('one Ontario shop identity', () => {
  it('uses the existing shop pin, address and stable entity id', () => {
    expect(buildBusinessIdentity({ geo: BUSINESS_GEO })).toMatchObject({
      '@id': BUSINESS_ENTITY_ID, name: 'Harris Boat Works',
      address: { addressLocality: 'Gores Landing', streetAddress: '5369 Harris Boat Works Rd' },
      geo: { latitude: BUSINESS_GEO.latitude, longitude: BUSINESS_GEO.longitude },
    });
  });
  it('resolves every Ontario product seller to the same physical shop', () => {
    let sellers = 0;
    function walk(value: unknown) {
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.forEach(walk); return; }
      const record = value as Record<string, any>;
      if (record.seller) {
        expect(record.seller).toEqual({ '@id': BUSINESS_ENTITY_ID });
        sellers++;
      }
      Object.values(record).forEach(walk);
    }
    walk(MERCURY_OUTBOARDS_ONTARIO_OFFERS);
    expect(sellers).toBe(12);
    const shop = buildBusinessIdentity({ geo: BUSINESS_GEO });
    expect(shop).toMatchObject({ award: 'Mercury Marine Premier Dealer', brand: [{ '@type': 'Brand', name: 'Mercury Marine' }, { '@type': 'Brand', name: 'Legend Boats' }] });
    expect(shop.areaServed[0]).toMatchObject({ '@id': 'https://www.mercuryrepower.ca/#rice-lake-ontario' });
  });
  it.each(locations.map(location => [location.slug, location] as const))('represents %s as a catchment served by the same shop', (_slug, location) => {
    const [place, service] = buildPickupAreaNodes({ url: `https://www.mercuryrepower.ca/locations/${location.slug}`, region: location.region, latitude: location.longForm?.lat, longitude: location.longForm?.lng });
    expect(place['@type']).toBe('Place');
    expect(service['@type']).toBe('Service');
    expect(service.provider).toEqual({ '@id': BUSINESS_ENTITY_ID });
    expect(service.areaServed).toEqual({ '@id': place['@id'] });
    expect(service.description).toContain('no mobile service or delivery');
    expect(service).not.toHaveProperty('address');
    expect(service).not.toHaveProperty('geo');
  });
});
