import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { BUSINESS_SAME_AS } from '@/lib/companyInfo';
import { MERCURY_OUTBOARDS_ONTARIO_OFFERS } from '@/data/mercuryOutboardsOffers.js';
import { getMercuryFinancingFaqAnswer } from '@/components/promotions/TDAlwaysOnOffer';

export const ONTARIO_HUB_FAQ = [
  {
    question: "Where can I buy Mercury outboards in Ontario?",
    answer: "Harris Boat Works is a Mercury Marine Premier Dealer on Rice Lake in Gores Landing, Ontario, family-owned since 1947, Mercury dealer since 1965. We carry the Mercury outboard lineup with real CAD pricing online: portable FourStroke 2.5–20 HP, mid-range FourStroke 25–115 HP, Pro XS 115–250 HP, Command Thrust, SeaPro commercial, and ProKicker trolling motors. Build a quote at mercuryrepower.ca/quote/motor-selection."
  },
  {
    question: "What Mercury motor lines are sold at Harris Boat Works?",
    answer: "Full lineup: portable FourStroke (2.5–20 HP) for tenders and small tillers, mid-range FourStroke (25–115 HP) for fishing and pontoon, Pro XS (115–250 HP) for performance and tournament use, Command Thrust (40–150 HP) for heavy hulls and pontoons, SeaPro for commercial duty, and ProKicker (9.9 / 15 HP) for trolling. Mercury FourStroke V8 (250–300 HP) and Mercury Verado are available by special order, contact us directly for a quote."
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
    answer: "Yes, every price on mercuryrepower.ca is in CAD, all-in (plus HST). No US conversions, no hidden fees, no \"call for price\" games. The configurator shows live pricing direct from inventory plus financing payment estimates."
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
        "description": "Mercury Marine outboards in Ontario, full lineup (portable, FourStroke, Pro XS, Command Thrust, SeaPro, ProKicker, V8). Real CAD pricing online. Mercury Premier Dealer on Rice Lake, family-owned since 1947.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-outboards-ontario#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-outboards-ontario#localbusiness` }
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
        "@type": ["LocalBusiness", "AutomotiveBusiness"],
        "@id": `${SITE_URL}/mercury-outboards-ontario#localbusiness`,
        "name": "Harris Boat Works, Mercury Premier Dealer",
        "description": "Mercury Marine Premier Dealer serving Ontario. Full Mercury outboard lineup, real CAD pricing online, repower specialists. Family-owned since 1947, Mercury dealer since 1965.",
        "url": `${SITE_URL}/mercury-outboards-ontario`,
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "image": `${SITE_URL}/lovable-uploads/logo-dark.png`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "geo": { "@type": "GeoCoordinates", "latitude": 44.1456, "longitude": -78.2542 },
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
        "award": [
          "Mercury Marine Premier Dealer",
          "Authorized Legend Boats Dealer"
        ],
        "knowsAbout": [
          "Mercury FourStroke outboards",
          "Mercury Pro XS outboards",
          "Mercury Command Thrust",
          "Mercury SeaPro commercial outboards",
          "Mercury ProKicker trolling motors",
          "Marine repower"
        ],
        "makesOffer": MERCURY_OUTBOARDS_ONTARIO_OFFERS,
        "sameAs": BUSINESS_SAME_AS
      },
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
      <title>Mercury Outboards Ontario, Full Lineup at Harris Boat Works | Mercury Dealer Since 1965</title>
      <meta
        name="description"
        content="Mercury Marine outboards in Ontario, full lineup (FourStroke, Pro XS, Command Thrust, SeaPro, ProKicker, V8). Real CAD pricing online. Mercury Premier Dealer on Rice Lake, family-owned since 1947."
      />
      <meta
        name="keywords"
        content="Mercury outboards Ontario, Mercury dealer Ontario, Mercury Premier dealer, Mercury Rice Lake, buy Mercury outboard Kawarthas, Mercury dealer GTA, Mercury Cobourg, Mercury Peterborough, Mercury Northumberland"
      />
      <link rel="canonical" href={`${SITE_URL}/mercury-outboards-ontario`} />

      <meta property="og:title" content="Mercury Outboards Ontario, Full Lineup at Harris Boat Works" />
      <meta property="og:description" content="Mercury Premier Dealer on Rice Lake. Full lineup, real CAD pricing online." />
      <meta property="og:url" content={`${SITE_URL}/mercury-outboards-ontario`} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Outboards Ontario" />
      <meta name="twitter:description" content="Full Mercury lineup, real CAD pricing, Premier Dealer." />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
