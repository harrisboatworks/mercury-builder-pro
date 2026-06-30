import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';

// Mercury Pro XS 250 landing page — high-intent "Pro XS 250 price Canada" SEO/AEO.
// Page lives at /mercury/pro-xs-250 and is prerendered via static-prerender.mjs.

export const PRO_XS_250_HERO_IMAGE =
  'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/1769028305971-mercury-250-hp-v-8-pro-xs-fs-port-front-3-4-detail-image-1701169513978.jpg';

export interface ProXS250Variant {
  name: string;
  sku: string;
  shaft: string;
  controls: string;
  msrp: number;
  hbwPrice: number;
  availability: 'InStock' | 'BackOrder';
  availabilityLabel: string;
}

export const PRO_XS_250_VARIANTS: ProXS250Variant[] = [
  {
    name: '250 ELPT Pro XS (20-inch Long shaft, mechanical remote)',
    sku: '12500033A',
    shaft: '20 inch (Long)',
    controls: 'Mechanical remote',
    msrp: 38820,
    hbwPrice: 34848,
    availability: 'InStock',
    availabilityLabel: 'In stock',
  },
  {
    name: '250 EXLPT Pro XS (25-inch XL shaft, mechanical remote)',
    sku: '12500034A',
    shaft: '25 inch (XL)',
    controls: 'Mechanical remote',
    msrp: 39710,
    hbwPrice: 35646,
    availability: 'BackOrder',
    availabilityLabel: 'Available to order',
  },
  {
    name: '250 ELPT Pro XS DTS (20-inch Long shaft, Digital Throttle & Shift)',
    sku: '12500094A',
    shaft: '20 inch (Long)',
    controls: 'Digital Throttle & Shift',
    msrp: 41115,
    hbwPrice: 36905,
    availability: 'InStock',
    availabilityLabel: 'In stock',
  },
  {
    name: '250 EXLPT Pro XS DTS (25-inch XL shaft, Digital Throttle & Shift)',
    sku: '12500096A',
    shaft: '25 inch (XL)',
    controls: 'Digital Throttle & Shift',
    msrp: 42045,
    hbwPrice: 37741,
    availability: 'BackOrder',
    availabilityLabel: 'Available to order',
  },
];

export const PRO_XS_250_FAQ = [
  {
    question: 'What does a Mercury Pro XS 250 cost in Canada?',
    answer:
      'At Harris Boat Works, the Pro XS 250 runs from $34,848 CAD for the 250 ELPT Pro XS (20-inch shaft, mechanical remote) to $37,741 CAD for the 250 EXLPT Pro XS DTS (25-inch shaft, Digital Throttle & Shift). Prices are CAD, current pricing, confirm in the quote builder.',
  },
  {
    question: 'Is the Pro XS 250 in stock?',
    answer:
      'The two 20-inch (ELPT) variants are in stock at Gores Landing, Ontario. The 25-inch (EXLPT) variants we bring in to order. Confirm current availability in the quote builder or call us.',
  },
  {
    question: 'What warranty comes with a Pro XS 250?',
    answer:
      'Every new Mercury Pro XS 250 carries the applicable Mercury Marine factory warranty. Bonus warranty promotions come and go through the year. We confirm exact coverage and any active Mercury promotion when we quote you.',
  },
  {
    question: 'Can I finance a Pro XS 250?',
    answer:
      'Yes. Financing is available on approved credit through Mercury Finance. Build a quote and we will show you current rate and monthly options, or call 905-342-2153.',
  },
  {
    question: 'Do you take trade-ins?',
    answer:
      'Yes. We accept trade-ins on Mercury, Yamaha, Honda, Suzuki, and most older outboards. Get a valuation inside the online quote, or call us.',
  },
  {
    question: 'How long does a Pro XS 250 repower take?',
    answer:
      'Most repowers run 2 to 3 weeks from confirmed order to water-ready, depending on rigging. Spring (April and May) runs longer because every shop in Ontario is booked. Plan ahead.',
  },
  {
    question: 'Where are you located?',
    answer:
      '5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0, on Rice Lake. About 30 minutes south of Peterborough and 90 minutes east of Toronto. We serve the GTA, the Kawarthas, Northumberland County, and across Ontario.',
  },
];

const CANONICAL = 'https://www.mercuryrepower.ca/mercury/pro-xs-250';

export function MercuryProXS250SEO() {
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Mercury Pro XS 250 Outboard Motor',
    description:
      'Mercury Pro XS 250 four-stroke V8 outboard motor for repower and new-boat installs. Sold by Mercury Premier Dealer Harris Boat Works on Rice Lake, Ontario.',
    brand: { '@type': 'Brand', name: 'Mercury Marine' },
    category: 'Outboard Motor',
    image: PRO_XS_250_HERO_IMAGE,
    offers: PRO_XS_250_VARIANTS.map((v) => ({
      '@type': 'Offer',
      name: v.name,
      sku: v.sku,
      price: String(v.hbwPrice),
      priceCurrency: 'CAD',
      availability: `https://schema.org/InStoreOnly`,
      itemCondition: "https://schema.org/NewCondition",
      hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", applicableCountry: "CA", returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted" },
      url: CANONICAL,
      seller: {
        '@type': 'AutoDealer',
        name: 'Harris Boat Works',
        url: 'https://www.harrisboatworks.ca',
        ...(v.sku === '12500033A' ? { sameAs: 'https://www.wikidata.org/wiki/Q139910292' } : {}),
      },
    })),
  };

  // FAQ schema — first 5 FAQs only, per spec.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PRO_XS_250_FAQ.slice(0, 5).map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <Helmet>
      <title>Mercury Pro XS 250 Price Canada | From $34,502 CAD | Harris Boat Works</title>
      <meta
        name="description"
        content="Mercury Pro XS 250 from $34,502 CAD at Harris Boat Works, a Mercury Premier Dealer on Rice Lake, Ontario. Real prices, 7-year warranty coverage, in stock. Build your quote in 2 minutes."
      />
      <link rel="canonical" href={CANONICAL} />

      <meta property="og:title" content="Mercury Pro XS 250 Price Canada | From $34,502 CAD" />
      <meta
        property="og:description"
        content="Mercury Pro XS 250 from $34,502 CAD at Harris Boat Works, a Mercury Premier Dealer on Rice Lake, Ontario. Real prices, 7-year warranty coverage, in stock."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={CANONICAL} />
      <meta property="og:image" content={PRO_XS_250_HERO_IMAGE} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Pro XS 250 Price Canada | From $34,502 CAD" />
      <meta
        name="twitter:description"
        content="Real CAD pricing on the Mercury Pro XS 250 at Harris Boat Works, Rice Lake."
      />
      <meta name="twitter:image" content={PRO_XS_250_HERO_IMAGE} />

      <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
    </Helmet>
  );
}
