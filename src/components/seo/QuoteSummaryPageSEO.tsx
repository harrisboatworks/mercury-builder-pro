import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

/**
 * JSON-LD for /quote/summary (QuoteEstimate step).
 * Mirrors quoteSummaryPageSchema() in scripts/static-prerender.mjs.
 */
export function QuoteSummaryPageSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/quote/summary#webpage`,
        "url": `${SITE_URL}/quote/summary`,
        "name": "Your Mercury Outboard Quote Estimate | Harris Boat Works",
        "description": "Itemized Mercury outboard quote with live CAD pricing, financing estimates, trade-in credit, and current promotional savings.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/quote/summary#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/quote/summary#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Motor Selection", "item": `${SITE_URL}/quote/motor-selection` },
          { "@type": "ListItem", "position": 3, "name": "Boat Information", "item": `${SITE_URL}/quote/boat-info` },
          { "@type": "ListItem", "position": 4, "name": "Quote Summary", "item": `${SITE_URL}/quote/summary` },
        ],
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/quote/summary#estimate-service`,
        "name": "Mercury Outboard Quote Estimate",
        "serviceType": "Online Motor Quote Estimate",
        "provider": { "@id": "https://mercuryrepower.ca/#organization" },
        "areaServed": [
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" },
        ],
        "offers": {
          "@type": "Offer",
          "priceCurrency": "CAD",
          "availability": "https://schema.org/InStock",
          "seller": { "@id": "https://mercuryrepower.ca/#organization" },
        },
      },
    ],
  };

  return (
    <Helmet>
      <title>Your Mercury Outboard Quote Estimate | Harris Boat Works</title>
      <meta
        name="description"
        content="Review your itemized Mercury outboard quote with live CAD pricing, financing estimates, trade-in credit, and current promotions. Harris Boat Works — Mercury dealer since 1965."
      />
      <link rel="canonical" href={`${SITE_URL}/quote/summary`} />

      <meta property="og:title" content="Your Mercury Outboard Quote Estimate" />
      <meta property="og:description" content="Itemized Mercury outboard quote — live CAD pricing, financing, trade-in, and current promotions." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${SITE_URL}/quote/summary`} />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="Your Mercury Outboard Quote Estimate" />
      <meta name="twitter:description" content="Itemized Mercury outboard quote with live CAD pricing and financing estimates." />

      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
}
