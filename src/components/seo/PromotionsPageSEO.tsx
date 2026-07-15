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
  /**
   * When true, render Summer Savings-specific title/description/og:image.
   * When false, fall back to evergreen promotions metadata so nothing goes
   * stale after the promo expires (no redeploy required).
   */
  isSummerSavingsActive?: boolean;
}

export function PromotionsPageSEO({ isSummerSavingsActive = false }: PromotionsPageSEOProps) {
  const RATE = formatFinancingRate(MERCURY_PROMO_APR);

  const title = isSummerSavingsActive
    ? 'Mercury Summer Savings Rebate + Financing | HBW'
    : 'Mercury Outboard Promotions & Financing | HBW';

  const description = isSummerSavingsActive
    ? 'Mercury Summer Savings Rebate: save up to $700 CAD on eligible new Mercury FourStroke repower outboards, plus financing as low as 2.99% for 24 months (OAC). Ends August 31, 2026 at Harris Boat Works on Rice Lake.'
    : `Current Mercury outboard promotions and low-rate financing at Harris Boat Works on Rice Lake. TD Auto Finance repower program from ${RATE} (OAC), Canada-wide pricing in CAD.`;

  const ogImage = isSummerSavingsActive
    ? `${SITE_URL}/lovable-uploads/mercury-summer-savings-rebate-2026-square-1x1.jpg`
    : null;

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
      {ogImage && (
        <>
          <meta property="og:image" content={ogImage} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="1200" />
          <meta property="og:image:alt" content="Mercury Summer Savings Rebate: save up to $700 CAD plus financing as low as 2.99%, ends August 31, 2026" />
        </>
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
}
