// One physical shop, shared by crawler HTML and hydrated page schemas.
export const BUSINESS_ENTITY_ID = 'https://www.mercuryrepower.ca/#localbusiness';

/** @param {{ geo: { latitude: number, longitude: number }, openingHoursSpecification?: object[], sameAs?: readonly string[] }} options */
export function buildBusinessIdentity({ geo, openingHoursSpecification = [], sameAs = [] }) {
  return {
    '@type': ['LocalBusiness', 'Store', 'AutoRepair'],
    '@id': BUSINESS_ENTITY_ID,
    name: 'Harris Boat Works',
    url: 'https://www.harrisboatworks.ca/',
    image: 'https://www.mercuryrepower.ca/pwa-512x512.png',
    telephone: '+1-905-342-2153',
    email: 'info@harrisboatworks.ca',
    parentOrganization: { '@id': 'https://www.mercuryrepower.ca/#organization' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '5369 Harris Boat Works Rd',
      addressLocality: 'Gores Landing',
      addressRegion: 'ON',
      postalCode: 'K0K 2E0',
      addressCountry: 'CA',
    },
    geo: { '@type': 'GeoCoordinates', ...geo },
    openingHoursSpecification,
    sameAs,
  };
}

/** @param {{ url: string, region: string, latitude?: number, longitude?: number }} options */
export function buildPickupAreaNodes({ url, region, latitude, longitude }) {
  return [
    {
      '@type': 'Place',
      '@id': `${url}#place`,
      name: region,
      ...(Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { geo: { '@type': 'GeoCoordinates', latitude, longitude } } : {}),
      containedInPlace: { '@type': 'AdministrativeArea', name: 'Ontario, Canada' },
    },
    {
      '@type': 'Service',
      '@id': `${url}#service`,
      name: `Mercury outboards for ${region} buyers`,
      serviceType: 'Mercury outboard sales and repower',
      provider: { '@id': BUSINESS_ENTITY_ID },
      areaServed: { '@id': `${url}#place` },
      description: 'Buyer catchment only. Customers travel to Harris Boat Works in Gores Landing for pickup. All work happens at the shop; no mobile service or delivery.',
    },
  ];
}
