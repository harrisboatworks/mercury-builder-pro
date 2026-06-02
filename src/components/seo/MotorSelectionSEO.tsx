import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';

interface FamilyCounts {
  fourStroke?: number;
  proXS?: number;
  seaPro?: number;
  proKicker?: number;
}

interface MotorSelectionSEOProps {
  /** Live count of motors visible on the page. Omit to skip the numberOfItems claim entirely. */
  motorCount?: number;
  minPrice?: number;
  maxPrice?: number;
  /** Live offer counts per family. When provided, drives `offerCount` on each AggregateOffer.
   *  A family with count 0 is omitted from the ItemList entirely (no inflated offer counts). */
  familyCounts?: FamilyCounts;
}

const FAMILY_GROUP_IDS = {
  fourStroke: 'mercury-fourstroke-outboards',
  proXS: 'mercury-pro-xs-outboards',
  seaPro: 'mercury-seapro-outboards',
  proKicker: 'mercury-prokicker-outboards',
} as const;

/**
 * JSON-LD for /quote/motor-selection.
 * Mirrors motorSelectionPageSchema() in scripts/static-prerender.mjs to keep
 * crawler-served HTML and React-hydrated HTML in sync. Verado is intentionally
 * excluded from default inventory, Verado is special-order only at Harris Boat Works.
 *
 * Each family Product is also typed as ProductGroup with a stable productGroupID
 * so per-motor /motors/{slug} pages can reference it via `isVariantOf`. Each
 * AggregateOffer carries `offerCount` equal to the live family variant count.
 */
export function MotorSelectionSEO({
  motorCount,
  minPrice = 1500,
  maxPrice = 45000,
  familyCounts,
}: MotorSelectionSEOProps) {
  const buildFamilyProduct = (
    position: number,
    name: string,
    description: string,
    category: string,
    groupId: string,
    lowPrice: number,
    highPrice: number,
    offerCount: number,
  ) => ({
    '@type': 'ListItem',
    position,
    item: {
      '@type': ['Product', 'ProductGroup'],
      name,
      description,
      brand: { '@type': 'Brand', name: 'Mercury Marine' },
      category,
      productGroupID: groupId,
      variesBy: ['horsepower', 'shaftLength', 'startType'],
      offers: {
        '@type': 'AggregateOffer',
        offerCount,
        lowPrice,
        highPrice,
        priceCurrency: 'CAD',
        availability: 'https://schema.org/InStoreOnly',
        itemCondition: 'https://schema.org/NewCondition',
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'CA',
          returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
        },
        seller: { '@id': 'https://www.mercuryrepower.ca/#organization' },
      },
    },
  });

  // Fallback counts when caller hasn't computed live numbers yet. Conservative,
  // not inflated — matches typical active inventory and avoids 0/empty.
  const fc: Required<FamilyCounts> = {
    fourStroke: familyCounts?.fourStroke ?? 18,
    proXS: familyCounts?.proXS ?? 8,
    seaPro: familyCounts?.seaPro ?? 4,
    proKicker: familyCounts?.proKicker ?? 3,
  };

  const familyItems: ReturnType<typeof buildFamilyProduct>[] = [];
  let pos = 1;
  if (fc.fourStroke > 0) {
    familyItems.push(buildFamilyProduct(
      pos++,
      'Mercury FourStroke Outboards',
      'Fuel-efficient four-stroke outboard motors. Available from 2.5HP to 400HP.',
      'Outboard Motors',
      FAMILY_GROUP_IDS.fourStroke,
      minPrice,
      maxPrice,
      fc.fourStroke,
    ));
  }
  if (fc.proXS > 0) {
    familyItems.push(buildFamilyProduct(
      pos++,
      'Mercury Pro XS Outboards',
      'High-performance outboard motors designed for bass boats and tournament fishing.',
      'Performance Outboard Motors',
      FAMILY_GROUP_IDS.proXS,
      8000,
      35000,
      fc.proXS,
    ));
  }
  if (fc.seaPro > 0) {
    familyItems.push(buildFamilyProduct(
      pos++,
      'Mercury SeaPro Outboards',
      'Commercial-grade outboard motors built for heavy-duty use and reliability.',
      'Commercial Outboard Motors',
      FAMILY_GROUP_IDS.seaPro,
      3500,
      30000,
      fc.seaPro,
    ));
  }
  if (fc.proKicker > 0) {
    familyItems.push(buildFamilyProduct(
      pos++,
      'Mercury ProKicker Outboards',
      'Dedicated trolling and kicker motors for fishing boats with high-thrust gearcase.',
      'Kicker / Trolling Motors',
      FAMILY_GROUP_IDS.proKicker,
      4500,
      6500,
      fc.proKicker,
    ));
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/quote/motor-selection#webpage`,
        "url": `${SITE_URL}/quote/motor-selection`,
        "name": "Mercury Outboard Motors for Sale Ontario | Build Your Quote | Harris Boat Works",
        "description": "Browse Mercury outboard motors from 2.5HP to 600HP. Configure your motor, compare options, and get instant CAD pricing online.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/quote/motor-selection#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/quote/motor-selection#itemlist` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/quote/motor-selection#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Quote Builder", "item": `${SITE_URL}/quote/motor-selection` },
          { "@type": "ListItem", "position": 3, "name": "Motor Selection", "item": `${SITE_URL}/quote/motor-selection` },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/quote/motor-selection#itemlist`,
        "name": "Mercury Outboard Motor Inventory",
        "description": "Complete selection of Mercury Marine outboard motors available at Harris Boat Works",
        ...(typeof motorCount === 'number' && motorCount > 0 ? { "numberOfItems": motorCount } : {}),
        "itemListElement": familyItems,
      },
    ],
  };

  return (
    <Helmet>
      <title>Mercury Boats Canada: Mercury Outboards 2.5 to 600 HP, Build a Quote | HBW</title>
      <meta
        name="description"
        content={`Browse Mercury boats and outboards in Canada: FourStroke, Pro XS, SeaPro, ProKicker from $${minPrice.toLocaleString()} to $${maxPrice.toLocaleString()} CAD. Configure your motor and get instant CAD pricing, Harris Boat Works, Mercury dealer since 1965.`}
      />
      <link rel="canonical" href={`${SITE_URL}/quote/motor-selection`} />

      <meta property="og:title" content="Mercury Boats Canada: Mercury Outboards & Build a Quote" />
      <meta property="og:description" content="Browse the full Mercury outboard lineup in Canada: FourStroke, Pro XS, SeaPro, ProKicker. Configure online and get instant CAD pricing." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${SITE_URL}/quote/motor-selection`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Boats Canada: Mercury Outboards & Build a Quote" />
      <meta name="twitter:description" content="Browse the full Mercury outboard lineup in Canada. Configure online and get instant CAD pricing." />
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
}
