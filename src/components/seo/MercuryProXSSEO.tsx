import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

// Static "starting at" CAD prices for JSON-LD Offer (rich-result safe).
// Source: motor_models.base_price (snapshot from inventory at build time).
// Live in-page pricing is fetched dynamically — these only feed schema.
export const PRO_XS_STATIC_OFFERS = [
  { hp: 115, name: 'Mercury 115 Pro XS', startingAt: 14450 },
  { hp: 150, name: 'Mercury 150 Pro XS', startingAt: 18300 },
  { hp: 200, name: 'Mercury 200 Pro XS', startingAt: 23800 },
  { hp: 250, name: 'Mercury 250 Pro XS', startingAt: 29300 },
];

export const PRO_XS_FAQ = [
  {
    question: "What is a Mercury Pro XS outboard?",
    answer: "Pro XS is Mercury Marine's high-performance FourStroke outboard line, engineered for tournament-grade acceleration, top speed, and hole-shot. Pro XS models are tuned more aggressively than standard FourStroke motors and ship with performance prop pitches, premium gearcases, and enhanced engine calibration. Available 115 to 300 HP."
  },
  {
    question: "What HP Pro XS models does Harris Boat Works carry?",
    answer: "We stock the full Pro XS lineup in CAD pricing: 115 HP (ELPT and EXLPT), 150 HP (ELPT and EXLPT), 200 HP (ELPT), and 250 HP (ELPT). All in stock, real prices online. Mercury Platinum Dealer — full warranty registration at pickup."
  },
  {
    question: "Pro XS vs FourStroke — which should I buy?",
    answer: "Pro XS for performance: tournament bass, fast bowriders, ski/wake boats, and anyone chasing top-end speed and hole-shot. Standard FourStroke for cruising, fishing, pontoons, and fuel economy. Same Mercury reliability, different tuning. We can walk you through the right choice for your hull at (905) 342-2153 or via the configurator."
  },
  {
    question: "Are Pro XS prices in Canadian dollars?",
    answer: "Yes — every price on mercuryrepower.ca is in CAD, all-in (plus HST). No US conversions, no \"call for price\" games. The configurator shows real out-the-door pricing including standard rigging."
  },
  {
    question: "What's the warranty on a new Pro XS?",
    answer: "Standard Mercury warranty is 3 years. Right now Harris Boat Works includes 7 years of full Mercury factory-backed coverage on new Pro XS purchases — straight from Mercury Marine, not third-party insurance. We register the warranty at pickup."
  },
  {
    question: "Can I finance a Pro XS purchase?",
    answer: "Yes — financing is available through DealerPlan and other lenders. Estimated monthly payments are shown alongside each motor at mercuryrepower.ca (8.99% under $10K total / 7.99% over $10K total). Minimum financed amount is $5,000."
  },
  {
    question: "How do I take delivery of a Pro XS from Harris Boat Works?",
    answer: "Pickup only at our Gores Landing location on Rice Lake. Two paths: (1) bring your boat for full installation including controls, prop, and lake test, or (2) pick up the loose motor for self-install. We do not ship motors. Pickup ensures every customer gets a personal walk-through and clean Mercury warranty registration."
  },
  {
    question: "Where can I see current Pro XS inventory and pricing?",
    answer: "Build a quote at mercuryrepower.ca/quote/motor-selection — filter by Pro XS family. Live CAD pricing, in-stock indicators, and monthly payment estimates update directly from our inventory."
  }
];

export function MercuryProXSSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-pro-xs#webpage`,
        "url": `${SITE_URL}/mercury-pro-xs`,
        "name": "Mercury Pro XS Outboards in Ontario | 115–250 HP, Real CAD Pricing | Harris Boat Works",
        "description": "Mercury Pro XS performance outboards 115–250 HP in stock at Harris Boat Works. Real CAD pricing, 7-year warranty, financing. Mercury Platinum Dealer on Rice Lake — family-owned since 1947, Mercury dealer since 1965.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-pro-xs#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-pro-xs#productgroup` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-pro-xs#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Pro XS", "item": `${SITE_URL}/mercury-pro-xs` }
        ]
      },
      {
        "@type": "ProductGroup",
        "@id": `${SITE_URL}/mercury-pro-xs#productgroup`,
        "name": "Mercury Pro XS Outboard Series",
        "description": "Mercury Pro XS high-performance FourStroke outboard motors, 115–250 HP, available at Harris Boat Works (Mercury Platinum Dealer, Ontario).",
        "brand": { "@type": "Brand", "name": "Mercury Marine" },
        "url": `${SITE_URL}/mercury-pro-xs`,
        "variesBy": ["horsepower"],
        "hasVariant": PRO_XS_STATIC_OFFERS.map(v => ({
          "@type": "Product",
          "name": v.name,
          "brand": { "@type": "Brand", "name": "Mercury Marine" },
          "category": "Outboard Motor",
          "offers": {
            "@type": "Offer",
            "priceCurrency": "CAD",
            "price": v.startingAt,
            "availability": "https://schema.org/InStock",
            "seller": { "@id": `${SITE_URL}/#organization` },
            "url": `${SITE_URL}/quote/motor-selection`
          }
        }))
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-pro-xs#faqpage`,
        "mainEntity": PRO_XS_FAQ.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": { "@type": "Answer", "text": item.answer }
        }))
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Pro XS Outboards in Ontario | 115–250 HP, Real CAD Pricing | Harris Boat Works</title>
      <meta
        name="description"
        content="Mercury Pro XS performance outboards 115–250 HP in stock. Real CAD pricing, 7-year warranty, financing. Mercury Platinum Dealer on Rice Lake — family-owned since 1947, Mercury dealer since 1965."
      />
      <meta
        name="keywords"
        content="Mercury Pro XS, Mercury Pro XS Ontario, Mercury Pro XS 115, Mercury Pro XS 150, Mercury Pro XS 200, Mercury Pro XS 250, Pro XS dealer Canada, Mercury performance outboard"
      />
      <link rel="canonical" href={`${SITE_URL}/mercury-pro-xs`} />

      <meta property="og:title" content="Mercury Pro XS Outboards 115–250 HP — Real CAD Pricing" />
      <meta property="og:description" content="Pro XS performance lineup at Harris Boat Works. Mercury Platinum Dealer, Rice Lake." />
      <meta property="og:url" content={`${SITE_URL}/mercury-pro-xs`} />
      <meta property="og:type" content="product.group" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Pro XS Outboards in Ontario" />
      <meta name="twitter:description" content="115–250 HP Pro XS, real CAD pricing, 7-year warranty." />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
