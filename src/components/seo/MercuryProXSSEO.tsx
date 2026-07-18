import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { getMercuryFinancingFaqAnswer } from '@/components/promotions/TDAlwaysOnOffer';
import { CANONICAL_SKUS } from '@/data/canonical-pricing.generated';

// Static "starting at" CAD prices for JSON-LD Offer (rich-result safe).
// Source: the generated canonical pricing reference, never motor_models.base_price.
// Live inventory is fetched dynamically, but customer-visible price always comes
// from the same canonical dealer-price source used by /pricing-reference.
// Image URLs are required by Google Merchant Listings rich-result eligibility.
// Per-HP Pro XS product photos served from /public/images/seo/ (absolute URLs
// for valid JSON-LD). Fallback constant retained for safety.
const PRO_XS_DEFAULT_IMAGE = `${SITE_URL}/social-share.jpg`;

const PRO_XS_IMAGES: Record<number, string> = {
  115: `${SITE_URL}/images/seo/proxs-115.webp`,
  150: `${SITE_URL}/images/seo/proxs-150.jpg`,
  200: `${SITE_URL}/images/seo/proxs-200.jpg`,
  250: `${SITE_URL}/images/seo/proxs-250.jpeg`,
};

export const PRO_XS_STATIC_OFFERS = [115, 150, 200, 250].map((hp) => {
  const matchingSkus = CANONICAL_SKUS.filter((sku) => sku.family === 'ProXS' && sku.hp === hp);
  const matchingPrices = matchingSkus.map((sku) => sku.dealer);

  if (matchingPrices.length === 0) {
    throw new Error(`Missing canonical Pro XS pricing for ${hp} HP`);
  }

  const startingSku = matchingSkus.reduce((lowest, sku) => sku.dealer < lowest.dealer ? sku : lowest);
  return {
    hp,
    name: `Mercury ${hp} Pro XS`,
    startingAt: Math.min(...matchingPrices),
    image: PRO_XS_IMAGES[hp] ?? PRO_XS_DEFAULT_IMAGE,
    availability: startingSku.status.toLowerCase() === 'in stock'
      ? 'https://schema.org/InStock'
      : 'https://schema.org/PreOrder',
  };
});

export const PRO_XS_FAQ = [
  {
    question: "What is a Mercury Pro XS outboard?",
    answer: "Pro XS is Mercury Marine's high-performance FourStroke outboard line, engineered for tournament-grade acceleration, top speed, and hole-shot. Pro XS models are tuned more aggressively than standard FourStroke motors and ship with performance prop pitches, premium gearcases, and enhanced engine calibration. Available 115 to 300 HP."
  },
  {
    question: "What HP Pro XS models does Harris Boat Works carry?",
    answer: "We list 115 HP, 150 HP, 200 HP, and 250 HP Pro XS options with current CAD pricing online. Inventory status varies by exact model; the quote builder shows the current status and Harris Boat Works completes warranty registration at pickup."
  },
  {
    question: "Pro XS vs FourStroke, which should I buy?",
    answer: "Pro XS for performance: tournament bass, fast bowriders, ski/wake boats, and anyone chasing top-end speed and hole-shot. Standard FourStroke for cruising, fishing, pontoons, and fuel economy. Same Mercury reliability, different tuning. We can walk you through the right choice for your hull at (905) 342-2153 or via the configurator."
  },
  {
    question: "Are Pro XS prices in Canadian dollars?",
    answer: "Yes. Pro XS prices on mercuryrepower.ca are in CAD and show the bare motor price before HST, controls, propeller, rigging, and installation. The quote builder adds the items needed for your boat so you can compare the complete package."
  },
  {
    question: "What's the warranty on a new Pro XS?",
    answer: "Every new Mercury Pro XS comes with the standard 3-year Mercury Marine factory warranty. Bonus warranty extensions are offered from time to time; check mercuryrepower.ca/promotions for current offers. We register the warranty at pickup."
  },
  {
    question: "Can I finance a Pro XS purchase?",
    answer: `Yes, financing is available through DealerPlan and other lenders. Estimated monthly payments are shown alongside each motor at mercuryrepower.ca. ${getMercuryFinancingFaqAnswer()} Minimum financed amount is $5,000.`
  },
  {
    question: "How do I take delivery of a Pro XS from Harris Boat Works?",
    answer: "Pickup only at our Gores Landing location on Rice Lake. Two paths: (1) bring your boat for full installation including controls, prop, and lake test, or (2) pick up the loose motor for self-install. We do not ship motors. Pickup ensures every customer gets a personal walk-through and clean Mercury warranty registration."
  },
  {
    question: "Where can I see current Pro XS inventory and pricing?",
    answer: "Build a quote at mercuryrepower.ca/quote/motor-selection, filter by Pro XS family. Live CAD pricing, in-stock indicators, and monthly payment estimates update directly from our inventory."
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
        "description": "Mercury Pro XS performance outboards 115–250 HP with current CAD bare-motor pricing and model-level availability from Harris Boat Works. Mercury Premier Dealer on Rice Lake, family-owned since 1947, Mercury dealer since 1965.",
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
        "productGroupID": "mercury-pro-xs-outboard-series",
        "name": "Mercury Pro XS Outboard Series",
        "description": "Mercury Pro XS high-performance FourStroke outboard motors, 115–250 HP, available at Harris Boat Works (Mercury Premier Dealer, Ontario).",
        "brand": { "@type": "Brand", "name": "Mercury Marine" },
        "url": `${SITE_URL}/mercury-pro-xs`,
        "variesBy": ["horsepower"],
        "hasVariant": PRO_XS_STATIC_OFFERS.map(v => ({
          "@type": "Product",
          "name": v.name,
          "image": v.image,
          "brand": { "@type": "Brand", "name": "Mercury Marine" },
          "category": "Outboard Motor",
          "inProductGroupWithID": "mercury-pro-xs-outboard-series",
          "offers": {
            "@type": "Offer",
            "priceCurrency": "CAD",
            "price": v.startingAt,
            "priceValidUntil": "2026-12-31",
            "availability": v.availability,
            "itemCondition": "https://schema.org/NewCondition",
            "hasMerchantReturnPolicy": { "@type": "MerchantReturnPolicy", "applicableCountry": "CA", "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted" },
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
      <title>Mercury Pro XS Outboards - 115 to 300 HP Ontario | HBW</title>
      <meta
        name="description"
        content="Mercury Pro XS from 115 to 300 HP with live CAD pricing. The performance line for bass, walleye and speed. Ontario Mercury Premier dealer."
      />
      <meta
        name="keywords"
        content="Mercury Pro XS, Mercury Pro XS Ontario, Mercury Pro XS 115, Mercury Pro XS 150, Mercury Pro XS 200, Mercury Pro XS 250, Pro XS dealer Canada, Mercury performance outboard"
      />

      <meta property="og:title" content="Mercury Pro XS Outboards - 115 to 300 HP Ontario" />
      <meta property="og:description" content="Mercury Pro XS from 115 to 300 HP with live CAD pricing. Ontario Mercury Premier dealer, Rice Lake." />
      <meta property="og:type" content="product.group" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Pro XS Outboards - 115 to 300 HP Ontario" />
      <meta name="twitter:description" content="Mercury Pro XS 115 to 300 HP, live CAD pricing, 3-year factory warranty." />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
