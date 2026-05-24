import { Helmet } from '@/lib/helmet';
import type { LandingConfig } from '@/data/landing/mercuryLineupLandings';

// Reusable SEO + JSON-LD for /mercury/* lineup landing pages.
// Mirrors the Pro XS 250 pattern (Product schema with one Offer per row +
// FAQPage). InStock vs BackOrder maps from variant.availability.

export function MercuryLineupLandingSEO({ config }: { config: LandingConfig }) {
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: config.productName,
    description: config.productDescription,
    brand: { '@type': 'Brand', name: 'Mercury Marine' },
    category: 'Outboard Motor',
    image: config.ogImage,
    offers: config.variants.map((v) => ({
      '@type': 'Offer',
      name: v.name,
      ...(v.sku ? { sku: v.sku } : {}),
      price: String(v.hbwPrice),
      priceCurrency: 'CAD',
      availability: `https://schema.org/${v.availability}`,
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
      <title>{config.metaTitle}</title>
      <meta name="description" content={config.metaDescription} />
      <link rel="canonical" href={config.canonical} />

      <meta property="og:title" content={config.metaTitle} />
      <meta property="og:description" content={config.metaDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={config.canonical} />
      <meta property="og:image" content={config.ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={config.metaTitle} />
      <meta name="twitter:description" content={config.metaDescription} />
      <meta name="twitter:image" content={config.ogImage} />

      <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
    </Helmet>
  );
}
