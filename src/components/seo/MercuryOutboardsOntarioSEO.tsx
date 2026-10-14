import { ONTARIO_BUYING_ANSWER, ONTARIO_LINEUP_ANSWER, ONTARIO_PRICING_ANSWER } from '@/lib/mercury-ontario-facts.js';
import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { BUSINESS_ENTITY_ID } from '@/lib/business-identity.js';
import { MERCURY_OUTBOARDS_ONTARIO_PRODUCTS } from '@/data/mercuryOutboardsOffers.js';
import { getMercuryFinancingFaqAnswer } from '@/components/promotions/TDAlwaysOnOffer';

export const ONTARIO_HUB_FAQ = [
  {
    question: "Where can I buy Mercury outboards in Ontario?",
    answer: ONTARIO_BUYING_ANSWER
  },
  {
    question: "What Mercury motor lines are sold at Harris Boat Works?",
    answer: ONTARIO_LINEUP_ANSWER
  },
  {
    question: "Is Harris Boat Works a Mercury Premier dealer?",
    answer: "Yes. Mercury Marine Premier Dealer status, Mercury's top dealer tier in North America. Awarded for sales volume, technician certification, warranty CSI scores, and parts availability. Re-qualified annually."
  },
  {
    question: "What areas of Ontario does Harris Boat Works serve?",
    answer: "Our location at Gores Landing on Rice Lake (Northumberland County) puts us within easy reach of Peterborough (35 min), Cobourg (20 min), Port Hope, the Kawartha Lakes, the Trent-Severn Waterway, and the Greater Toronto Area (90 min via 401). Customers come from across Ontario including Lake Simcoe, Lake Scugog, Bay of Quinte, and the GTA. Pickup only at our Gores Landing location."
  },
  {
    question: "Are Mercury outboard prices in Canadian dollars?",
    answer: ONTARIO_PRICING_ANSWER
  },
  {
    question: "Can I finance a Mercury outboard purchase?",
    answer: `Yes. Financing is available through DealerPlan and other lenders on purchases of $5,000 or more. Monthly payment estimates appear next to every qualifying motor. ${getMercuryFinancingFaqAnswer()} Apply online at mercuryrepower.ca/financing-application.`
  },
  {
    question: "What warranty comes with a new Mercury motor?",
    answer: "Standard Mercury Marine factory warranty is 3 years. Bonus warranty extensions are offered from time to time at Harris Boat Works; check mercuryrepower.ca/promotions for current offers. We register every warranty at pickup."
  },
  {
    question: "Do you ship Mercury motors across Ontario?",
    answer: "No, pickup only at our Gores Landing location on Rice Lake. This is intentional. Every motor includes a personal walk-through (controls, break-in, warranty registration) and we hold Premier status partly because of that hand-off. Bring your boat for install, or pick up a loose motor for self-install."
  },
  {
    question: "Do you take trade-ins on Mercury outboard purchases?",
    answer: "Yes. We accept trade-ins on Mercury and most other outboard brands. Get an instant trade-in estimate at mercuryrepower.ca/trade-in-value, values are anchored to our actual selling prices, not blue-book guesses. Trade credit applies directly to the new motor quote."
  },
  {
    question: "Is Harris Boat Works near me?",
    answer: "If you're in Ontario, probably yes. Travel times: Peterborough 35 min, Cobourg 20 min, Port Hope 25 min, Lindsay 50 min, Bowmanville 45 min, Oshawa 55 min, Port Perry 50 min, downtown Toronto 90 min via 401. We also serve Northumberland County, Hastings County, the Kawarthas, and the GTA. Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0."
  }
];

export function MercuryOutboardsOntarioSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-outboards-ontario#webpage`,
        "url": `${SITE_URL}/mercury-outboards-ontario`,
        "name": "Mercury Outboards Ontario, Full Lineup at Harris Boat Works | Mercury Dealer Since 1965",
        "description": "Explore Mercury outboard families and current HBW listings in Ontario. Confirm exact models, CAD quotes and special-order availability. Mercury Premier Dealer on Rice Lake, family-owned since 1947.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-outboards-ontario#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-outboards-ontario#service` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-outboards-ontario#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Outboards Ontario", "item": `${SITE_URL}/mercury-outboards-ontario` }
        ]
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/mercury-outboards-ontario#service`,
        "name": "Mercury outboard sales and repower for Ontario buyers",
        "provider": { "@id": BUSINESS_ENTITY_ID },
        "description": "Mercury outboard sales and repower at Harris Boat Works in Gores Landing. Ontario buyers travel to the shop for pickup; no shipping or mobile service.",
        "areaServed": [
          { "@type": "AdministrativeArea", "name": "Ontario, Canada" },
          { "@type": "Place", "name": "Greater Toronto Area" },
          { "@type": "Place", "name": "Peterborough, Ontario" },
          { "@type": "Place", "name": "Cobourg, Ontario" },
          { "@type": "Place", "name": "Kawartha Lakes" },
          { "@type": "Place", "name": "Northumberland County" },
          { "@type": "Place", "name": "Trent-Severn Waterway" },
          { "@type": "Place", "name": "Lake Simcoe" },
          { "@type": "Place", "name": "Lake Scugog" },
          { "@type": "Place", "name": "Rice Lake" }
        ],
        "serviceType": "Mercury outboard sales and repower"
      },
      ...MERCURY_OUTBOARDS_ONTARIO_PRODUCTS,
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-outboards-ontario#faqpage`,
        "mainEntity": ONTARIO_HUB_FAQ.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": { "@type": "Answer", "text": item.answer }
        }))
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Outboards Ontario: Full Lineup & Prices | HBW</title>
      <meta
        name="description"
        content="Compare current Mercury outboard listings and CAD quotes in Ontario. Verado special orders require a dealer quote. Mercury dealer on Rice Lake since 1965."
      />
      <meta
        name="keywords"
        content="Mercury outboards Ontario, Mercury dealer Ontario, Mercury Premier dealer, Mercury Rice Lake, buy Mercury outboard Kawarthas, Mercury dealer GTA, Mercury Cobourg, Mercury Peterborough, Mercury Northumberland"
      />

      <meta property="og:title" content="Mercury Outboards Ontario: Full Lineup & Prices" />
      <meta property="og:description" content="Every Mercury outboard from 2.5 to 600 HP with live CAD pricing. Mercury Premier Dealer on Rice Lake." />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Outboards Ontario: Full Lineup & Prices" />
      <meta name="twitter:description" content="Every Mercury outboard 2.5 to 600 HP with live CAD pricing. Mercury Premier Dealer, Rice Lake." />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
