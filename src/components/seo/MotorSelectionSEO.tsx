import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

interface MotorSelectionSEOProps {
  motorCount?: number;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * JSON-LD for /quote/motor-selection.
 * Mirrors motorSelectionPageSchema() in scripts/static-prerender.mjs to keep
 * crawler-served HTML and React-hydrated HTML in sync. Verado is intentionally
 * excluded — Harris Boat Works does not sell or service Verado motors.
 */
export function MotorSelectionSEO({
  motorCount = 128,
  minPrice = 1500,
  maxPrice = 45000,
}: MotorSelectionSEOProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/quote/motor-selection#webpage`,
        "url": `${SITE_URL}/quote/motor-selection`,
        "name": "Mercury Outboard Motors for Sale Ontario | Build Your Quote | Harris Boat Works",
        "description": "Browse Mercury outboard motors from 2.5HP to 600HP. Configure your motor, compare options, and get instant CAD pricing online.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#localbusiness" },
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
        "numberOfItems": motorCount,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "item": {
              "@type": "Product",
              "name": "Mercury FourStroke Outboards",
              "description": "Fuel-efficient four-stroke outboard motors. Available from 2.5HP to 400HP.",
              "brand": { "@type": "Brand", "name": "Mercury Marine" },
              "category": "Outboard Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": minPrice,
                "highPrice": maxPrice,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": { "@id": "https://mercuryrepower.ca/#organization" },
              },
            },
          },
          {
            "@type": "ListItem",
            "position": 2,
            "item": {
              "@type": "Product",
              "name": "Mercury Pro XS Outboards",
              "description": "High-performance outboard motors designed for bass boats and tournament fishing.",
              "brand": { "@type": "Brand", "name": "Mercury Marine" },
              "category": "Performance Outboard Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 8000,
                "highPrice": 35000,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": { "@id": "https://mercuryrepower.ca/#organization" },
              },
            },
          },
          {
            "@type": "ListItem",
            "position": 3,
            "item": {
              "@type": "Product",
              "name": "Mercury SeaPro Outboards",
              "description": "Commercial-grade outboard motors built for heavy-duty use and reliability.",
              "brand": { "@type": "Brand", "name": "Mercury Marine" },
              "category": "Commercial Outboard Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 3500,
                "highPrice": 30000,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": { "@id": "https://mercuryrepower.ca/#organization" },
              },
            },
          },
          {
            "@type": "ListItem",
            "position": 4,
            "item": {
              "@type": "Product",
              "name": "Mercury ProKicker Outboards",
              "description": "Dedicated trolling and kicker motors for fishing boats with high-thrust gearcase.",
              "brand": { "@type": "Brand", "name": "Mercury Marine" },
              "category": "Kicker / Trolling Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 4500,
                "highPrice": 6500,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": { "@id": "https://mercuryrepower.ca/#organization" },
              },
            },
          },
        ],
      },
    ],
  };

  return (
    <Helmet>
      <title>Mercury Outboard Motors for Sale Ontario | 2.5HP-600HP | Harris Boat Works</title>
      <meta
        name="description"
        content={`Browse Mercury outboard motors from $${minPrice.toLocaleString()} to $${maxPrice.toLocaleString()} CAD. FourStroke, Pro XS, SeaPro, ProKicker. Configure online and get instant CAD pricing — Harris Boat Works since 1965.`}
      />
      <link rel="canonical" href={`${SITE_URL}/quote/motor-selection`} />

      <meta property="og:title" content="Mercury Outboard Motors for Sale | Harris Boat Works" />
      <meta property="og:description" content="Browse our complete Mercury outboard inventory. Configure your motor and get instant pricing online." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${SITE_URL}/quote/motor-selection`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Outboard Motors | Harris Boat Works" />
      <meta name="twitter:description" content="Shop Mercury outboard motors online. FourStroke, Pro XS, SeaPro, ProKicker." />

      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
}
