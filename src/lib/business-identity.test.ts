import { describe, expect, it } from 'vitest';
import { buildBusinessIdentity, buildPickupAreaNodes, BUSINESS_ENTITY_ID } from './business-identity.js';
import { BUSINESS_GEO } from './companyInfo';
import { locations } from '@/data/locations';

describe('one Ontario shop identity', () => {
  it('uses the existing shop pin, address and stable entity id', () => {
    expect(buildBusinessIdentity({ geo: BUSINESS_GEO })).toMatchObject({
      '@id': BUSINESS_ENTITY_ID, name: 'Harris Boat Works',
      address: { addressLocality: 'Gores Landing', streetAddress: '5369 Harris Boat Works Rd' },
      geo: { latitude: BUSINESS_GEO.latitude, longitude: BUSINESS_GEO.longitude },
    });
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
