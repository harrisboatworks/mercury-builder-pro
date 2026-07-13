import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { MERCURY_PROMO_APR, formatFinancingRate } from '@/lib/finance';

interface PromotionsPageSEOProps {
  promotions?: Array<{
    name: string;
    discount_percentage?: number;
    discount_fixed_amount?: number;
    warranty_extra_years?: number;
    end_date?: string;
    promo_options?: any;
  }>;
}

/**
 * Promotions page SEO is intentionally promo-neutral so it cannot go stale
 * when a specific manufacturer or dealer offer ends. Do NOT hardcode a
 * particular warranty length, rebate, or bonus offer here. Individual
 * promotions render inside the page body from the `promotions` DB table
 * (and expire automatically). The static <head> stays evergreen.
 */
export function PromotionsPageSEO(_props: PromotionsPageSEOProps) {
  const RATE = formatFinancingRate(MERCURY_PROMO_APR);

  const title = 'Mercury Outboard Promotions & Financing Offers | Harris Boat Works';
  const description =
    'Current Mercury outboard promotions, rebates, and financing offers from Harris Boat Works, Mercury Premier Dealer on Rice Lake. Updated as offers change.';

  const graph: any[] = [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/promotions`,
      url: `${SITE_URL}/promotions`,
      name: title,
      description,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Promotions', item: `${SITE_URL}/promotions` },
        ],
      },
    },
    {
      '@type': ['Service', 'FinancialProduct'],
      name: "Mercury TD 'Always On' Financing",
      description: `Low-rate TD Auto Finance program on a new Mercury repower at Harris Boat Works: ${RATE} with amortization terms up to 240 months. On approved credit.`,
      category: 'Boat Financing',
      provider: { '@type': 'Organization', name: 'Harris Boat Works', url: SITE_URL },
      areaServed: { '@type': 'Country', name: 'Canada' },
      interestRate: {
        '@type': 'QuantitativeValue',
        value: MERCURY_PROMO_APR,
        unitText: 'PERCENT_PER_YEAR',
      },
      termsOfService:
        "On approved credit through TD Auto Finance. Not all customers will qualify. Offer available through December 31, 2026.",
      offers: {
        '@type': 'Offer',
        name: `${RATE} Mercury Repower Financing`,
        description: `${RATE} up to 240-month amortization on a new eligible Mercury outboard (OAC).`,
        priceCurrency: 'CAD',
        price: '0',
        availability: 'https://schema.org/InStock',
        validFrom: '2026-05-26',
        priceValidUntil: '2026-12-31',
        url: `${SITE_URL}/financing-application`,
        seller: { '@type': 'Organization', name: 'Harris Boat Works' },
        eligibleRegion: { '@type': 'Country', name: 'Canada' },
      },
    },
  ];

  const structuredData = { '@context': 'https://schema.org', '@graph': graph };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
}
