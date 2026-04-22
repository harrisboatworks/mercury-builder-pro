import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';

/**
 * JSON-LD for /quote/boat-info (BoatInformation step).
 * Mirrors boatInfoPageSchema() in scripts/static-prerender.mjs.
 */
export function BoatInfoPageSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/quote/boat-info#webpage`,
        "url": `${SITE_URL}/quote/boat-info`,
        "name": "Boat Information — Mercury Quote Builder | Harris Boat Works",
        "description": "Tell us about your boat so we can confirm motor compatibility, shaft length, controls, and rigging requirements for your Mercury outboard quote.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/quote/boat-info#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/quote/boat-info#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Motor Selection", "item": `${SITE_URL}/quote/motor-selection` },
          { "@type": "ListItem", "position": 3, "name": "Boat Information", "item": `${SITE_URL}/quote/boat-info` },
        ],
      },
      {
        "@type": "HowTo",
        "@id": `${SITE_URL}/quote/boat-info#howto`,
        "name": "Build a Mercury Outboard Quote at Harris Boat Works",
        "description": "Three-step online configurator for a real Mercury outboard quote with live CAD pricing.",
        "step": [
          {
            "@type": "HowToStep",
            "position": 1,
            "name": "Select your Mercury motor",
            "text": "Choose horsepower, shaft length, start type, and controls.",
            "url": `${SITE_URL}/quote/motor-selection`,
          },
          {
            "@type": "HowToStep",
            "position": 2,
            "name": "Tell us about your boat",
            "text": "Provide boat make, model, length, current motor, and rigging details so we can confirm compatibility.",
            "url": `${SITE_URL}/quote/boat-info`,
          },
          {
            "@type": "HowToStep",
            "position": 3,
            "name": "Review your quote",
            "text": "Get itemized CAD pricing, financing estimates, trade-in value, and active promotions.",
            "url": `${SITE_URL}/quote/summary`,
          },
        ],
      },
    ],
  };

  return (
    <Helmet>
      <title>Boat Information — Mercury Quote Builder | Harris Boat Works</title>
      <meta
        name="description"
        content="Tell us about your boat to confirm motor compatibility, shaft length, controls, and rigging for your Mercury outboard quote. Step 2 of the Harris Boat Works quote builder."
      />
      <link rel="canonical" href={`${SITE_URL}/quote/boat-info`} />

      <meta property="og:title" content="Boat Information — Mercury Quote Builder" />
      <meta property="og:description" content="Confirm Mercury motor compatibility for your boat — shaft length, controls, and rigging." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${SITE_URL}/quote/boat-info`} />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="Boat Information — Mercury Quote Builder" />
      <meta name="twitter:description" content="Confirm Mercury motor compatibility for your boat in the Harris Boat Works quote builder." />

      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
}
