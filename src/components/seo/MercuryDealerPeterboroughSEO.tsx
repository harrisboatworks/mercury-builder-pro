import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

const PETERBOROUGH_FAQ = [
  {
    question: "Is there a Mercury dealer near Peterborough, Ontario?",
    answer: "Yes — Harris Boat Works is the closest Mercury Marine Platinum Dealer to Peterborough, located about 35 minutes south on Rice Lake at 5369 Harris Boat Works Rd, Gores Landing, ON. Mercury dealer since 1965, family-owned since 1947."
  },
  {
    question: "Do you serve Peterborough customers for Mercury repower and service?",
    answer: "Yes. We regularly repower boats from Peterborough, Lakefield, Bridgenorth, Buckhorn, and the wider Kawartha Lakes region. Customers tow boats down to Gores Landing, or pick up loose motors for self-installation. Pickup only — no delivery or shipping."
  },
  {
    question: "How far is Harris Boat Works from downtown Peterborough?",
    answer: "About 35 minutes (45 km) via County Rd 28 south to Gores Landing on the south shore of Rice Lake. Easy run for Peterborough, Trent University, and Lakefield-area boaters."
  },
  {
    question: "Can I get Mercury financing as a Peterborough customer?",
    answer: "Yes — Mercury financing through DealerPlan is available to all Ontario residents. Build a quote at mercuryrepower.ca to see live monthly payment estimates (8.99% under $10K total / 7.99% over $10K), then complete the financing application online. Minimum financed amount $5,000."
  },
  {
    question: "What Mercury motors do you stock for Peterborough-area boaters?",
    answer: "The full Mercury outboard lineup: portable FourStroke (2.5–20hp), mid-range FourStroke (25–115hp), Command Thrust (40–150hp for pontoons), Pro XS performance (115–300hp), SeaPro commercial, ProKicker trolling motors (9.9hp/15hp), and FourStroke V8 (250–300hp). Live inventory and CAD pricing at mercuryrepower.ca."
  }
];

export function MercuryDealerPeterboroughSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-dealer-peterborough#webpage`,
        "url": `${SITE_URL}/mercury-dealer-peterborough`,
        "name": "Mercury Dealer Peterborough Ontario | Harris Boat Works — 35 Min South",
        "description": "Mercury Marine Platinum Dealer 35 minutes from Peterborough on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Repower, sales, parts, service for Peterborough and Kawartha Lakes boaters.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-dealer-peterborough#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-dealer-peterborough#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-dealer-peterborough#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Dealer Peterborough", "item": `${SITE_URL}/mercury-dealer-peterborough` }
        ]
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/mercury-dealer-peterborough#service`,
        "name": "Mercury Outboard Sales & Repower — Peterborough Area",
        "description": "Mercury outboard sales, repower, and service for Peterborough, Lakefield, Bridgenorth, Buckhorn, and Kawartha Lakes boaters. Pickup only at Gores Landing on Rice Lake.",
        "provider": { "@id": "https://mercuryrepower.ca/#organization" },
        "areaServed": {
          "@type": "Place",
          "name": "Peterborough, Ontario",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Peterborough",
            "addressRegion": "ON",
            "addressCountry": "CA"
          }
        },
        "serviceType": "Mercury outboard sales and repower",
        "url": `${SITE_URL}/mercury-dealer-peterborough`
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-dealer-peterborough#faqpage`,
        "mainEntity": PETERBOROUGH_FAQ.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": { "@type": "Answer", "text": item.answer }
        }))
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Dealer Peterborough Ontario | Harris Boat Works — 35 Min South</title>
      <meta
        name="description"
        content="Mercury Marine Platinum Dealer 35 minutes from Peterborough on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Repower, sales, parts, service for Peterborough and Kawartha Lakes boaters."
      />
      <meta
        name="keywords"
        content="Mercury dealer Peterborough, Mercury outboard Peterborough Ontario, Mercury repower Kawartha Lakes, boat motors Peterborough, Mercury Marine Lakefield"
      />
      <link rel="canonical" href={`${SITE_URL}/mercury-dealer-peterborough`} />

      <meta property="og:title" content="Mercury Dealer Peterborough Ontario | Harris Boat Works" />
      <meta property="og:description" content="Mercury Platinum Dealer 35 min south of Peterborough on Rice Lake. Family-owned since 1947." />
      <meta property="og:url" content={`${SITE_URL}/mercury-dealer-peterborough`} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Dealer Peterborough Ontario" />
      <meta name="twitter:description" content="Mercury Platinum Dealer 35 min from Peterborough." />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

export { PETERBOROUGH_FAQ };
