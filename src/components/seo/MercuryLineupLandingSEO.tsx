import { Helmet } from '@/lib/helmet';
import type { LandingConfig } from '@/data/landing/mercuryLineupLandings';

// Reusable SEO + JSON-LD for /mercury/* lineup landing pages.
// Mirrors the Pro XS 250 pattern (Product schema with one Offer per row +
// FAQPage). InStock vs BackOrder maps from variant.availability.

// Derive a "$X,XXX CAD" string from the same variants array that feeds the
// Product schema. Used to rewrite any hardcoded "$X,XXX CAD" string in
// metaTitle/metaDescription/productDescription so meta tags can never drift
// from the JSON-LD Offer prices (the live-configurator source of truth).
export function formatFromPriceCAD(variants: { hbwPrice: number }[]): string {
  const min = Math.min(...variants.map((v) => v.hbwPrice));
  return `${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(min)} CAD`;
}

export function unifyPriceCopy(text: string, fromPriceStr: string): string {
  // Matches "$34,848 CAD" or "$34,848CAD" — only the primary "from" price
  // in title/description strings, not every dollar figure in long body copy.
  return text.replace(/\$[\d,]+(?=\s*CAD\b)/g, fromPriceStr.replace(/\s*CAD\s*$/, ''));
}

export function MercuryLineupLandingSEO({ config }: { config: LandingConfig }) {
  const fromPriceStr = formatFromPriceCAD(config.variants);
  const metaTitle = unifyPriceCopy(config.metaTitle, fromPriceStr);
  const metaDescription = unifyPriceCopy(config.metaDescription, fromPriceStr);
  const productDescription = unifyPriceCopy(config.productDescription, fromPriceStr);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: config.productName,
    description: productDescription,
    brand: { '@type': 'Brand', name: 'Mercury Marine' },
    category: 'Outboard Motor',
    image: config.ogImage,
    offers: config.variants.map((v) => ({
      '@type': 'Offer',
      name: v.name,
      ...(v.sku ? { sku: v.sku } : {}),
      price: String(v.hbwPrice),
      priceCurrency: 'CAD',
      availability: `https://schema.org/InStoreOnly`,
      itemCondition: "https://schema.org/NewCondition",
      hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", applicableCountry: "CA", returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted" },
      url: config.canonical,
      seller: {
        '@type': 'AutoDealer',
        name: 'Harris Boat Works',
        url: 'https://www.harrisboatworks.ca',
      },
    })),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={config.canonical} />

      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={config.canonical} />
      <meta property="og:image" content={config.ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={config.ogImage} />

      <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
    </Helmet>
  );
}
