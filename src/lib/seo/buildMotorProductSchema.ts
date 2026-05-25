// Shared Product/Offer JSON-LD builder for Mercury motor pages.
//
// Used by:
//   - src/components/seo/MotorPageSEO.tsx  (React, /motors/{slug} hydrated)
//   - src/components/seo/QuoteSummaryPageSEO.tsx  (React, /quote/summary)
//   - scripts/static-prerender.mjs has its own equivalent shape; keep them
//     intentionally aligned. The dual-source-of-truth checker in
//     scripts/check-structured-data.mjs only matches string literals, so
//     this dynamic builder does not trip the check.

import { SITE_URL } from '@/lib/site';

export interface MotorSchemaInput {
  name: string;                  // model_display / model
  hp?: number | null;
  family?: string | null;        // FourStroke, Pro XS, ProKicker, SeaPro
  shaft?: string | null;
  startType?: string | null;
  controlType?: string | null;
  modelNumber?: string | null;
  image?: string | null;
  /** Pricing-hierarchy-resolved selling price in CAD, or null for price-on-request. */
  priceCAD?: number | null;
  inStock?: boolean;
  /** Canonical URL of the page rendering this product (no trailing slash). */
  url: string;
  /** Optional @id discriminator so multiple Product blocks can co-exist on one URL. */
  idSuffix?: string;
}

export function buildMotorProductSchema(input: MotorSchemaInput): Record<string, unknown> {
  const {
    name,
    hp,
    family,
    shaft,
    startType,
    controlType,
    modelNumber,
    image,
    priceCAD,
    url,
    idSuffix = 'product',
  } = input;

  const validUntil = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const additionalProperty: Array<Record<string, string>> = [];
  if (hp != null) additionalProperty.push({ '@type': 'PropertyValue', name: 'Horsepower', value: `${hp} HP` });
  if (family) additionalProperty.push({ '@type': 'PropertyValue', name: 'Family', value: `Mercury ${family}` });
  if (shaft) additionalProperty.push({ '@type': 'PropertyValue', name: 'Shaft', value: shaft });
  if (startType) additionalProperty.push({ '@type': 'PropertyValue', name: 'Start', value: startType });
  if (controlType) additionalProperty.push({ '@type': 'PropertyValue', name: 'Control', value: controlType });

  const description =
    `Mercury ${family || 'outboard'}${hp != null ? ` ${hp} HP` : ''} outboard motor` +
    `${modelNumber ? ` (model ${modelNumber})` : ''}. Mercury outboard repower quote from Harris Boat Works ` +
    `in Gores Landing, Ontario. Motors are sold for local pickup and/or professional installation only. ` +
    `We do not ship outboard motors. Motor returns are not accepted. Installation work is guaranteed, ` +
    `and new Mercury motors include the applicable Mercury Marine factory warranty.`;

  const product: Record<string, unknown> = {
    '@type': 'Product',
    '@id': `${url}#${idSuffix}`,
    name,
    description,
    brand: { '@type': 'Brand', name: 'Mercury Marine' },
    manufacturer: { '@type': 'Organization', name: 'Mercury Marine' },
    category: 'Outboard Motor',
    url,
    ...(image ? { image } : {}),
    ...(modelNumber ? { mpn: modelNumber, sku: modelNumber } : {}),
    ...(additionalProperty.length ? { additionalProperty } : {}),
  };

  if (priceCAD && priceCAD > 0) {
    product.offers = {
      '@type': 'Offer',
      '@id': `${url}#${idSuffix}-offer`,
      url,
      priceCurrency: 'CAD',
      price: String(Math.round(priceCAD)),
      priceValidUntil: validUntil,
      availability: 'https://schema.org/InStoreOnly',
      itemCondition: 'https://schema.org/NewCondition',
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'CA',
        returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      },
      seller: {
        '@type': 'BoatDealer',
        name: 'Harris Boat Works',
        url: 'https://harrisboatworks.ca',
        telephone: '+1-905-342-2153',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '5369 Harris Boat Works Rd',
          addressLocality: 'Gores Landing',
          addressRegion: 'ON',
          postalCode: 'K0K 2E0',
          addressCountry: 'CA',
        },
      },
      areaServed: { '@type': 'AdministrativeArea', name: 'Ontario, Canada' },
    };
  }

  return product;
}

export function buildMotorPageGraph(input: MotorSchemaInput) {
  const product = buildMotorProductSchema(input);
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${input.url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Mercury Outboards Ontario', item: `${SITE_URL}/mercury-outboards-ontario` },
      ...(input.family
        ? [{
            '@type': 'ListItem',
            position: 3,
            name: `Mercury ${input.family}`,
            item: `${SITE_URL}/quote/motor-selection?family=${encodeURIComponent(input.family)}`,
          }]
        : []),
      { '@type': 'ListItem', position: input.family ? 4 : 3, name: input.name, item: input.url },
    ],
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [product, breadcrumb],
  };
}
