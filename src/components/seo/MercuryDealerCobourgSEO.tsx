import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

const COBOURG_FAQ = [
  {
    question: "Where can I buy a Mercury outboard near Cobourg, Ontario?",
    answer: "Harris Boat Works in Gores Landing — about 20 minutes north of Cobourg on Rice Lake — is the closest Mercury Marine Platinum Dealer. Mercury dealer since 1965, family-owned since 1947. Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0."
  },
  {
    question: "How far is Harris Boat Works from Cobourg?",
    answer: "About 20 minutes (25 km) north via County Rd 18 to Gores Landing on the south shore of Rice Lake. Convenient for Cobourg, Port Hope, Grafton, and Northumberland County boaters."
  },
  {
    question: "Do you serve Northumberland County for Mercury repower?",
    answer: "Yes — we regularly repower boats from Cobourg, Port Hope, Grafton, Brighton, and the wider Northumberland region. Bring your boat down for full installation, or pick up a loose Mercury for self-install. Pickup only at Gores Landing."
  },
  {
    question: "Can I get a Mercury quote online from Cobourg?",
    answer: "Yes — build a real Mercury outboard quote in three minutes at mercuryrepower.ca. Live CAD pricing, financing estimates, and trade-in valuations. No phone calls or forms needed to see the price."
  },
  {
    question: "What about Lake Ontario boaters out of Cobourg Harbour?",
    answer: "We work with Cobourg Harbour and Port Hope Harbour boaters on Mercury repowers and service for Lake Ontario use. Mercury Pro XS, FourStroke V8, and SeaPro models are common for the bigger water — talk to us about HP and shaft length for your specific hull."
  }
];

export function MercuryDealerCobourgSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-dealer-cobourg#webpage`,
        "url": `${SITE_URL}/mercury-dealer-cobourg`,
        "name": "Mercury Dealer Cobourg Ontario | Harris Boat Works — 20 Min North",
        "description": "Mercury Marine Platinum Dealer 20 minutes north of Cobourg on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Sales, repower, and service for Cobourg, Port Hope, and Northumberland County.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-dealer-cobourg#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-dealer-cobourg#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-dealer-cobourg#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Dealer Cobourg", "item": `${SITE_URL}/mercury-dealer-cobourg` }
        ]
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/mercury-dealer-cobourg#service`,
        "name": "Mercury Outboard Sales & Repower — Cobourg Area",
        "description": "Mercury outboard sales, repower, and service for Cobourg, Port Hope, Grafton, Brighton, and Northumberland County boaters. Pickup only at Gores Landing on Rice Lake.",
        "provider": { "@id": "https://mercuryrepower.ca/#organization" },
        "areaServed": {
          "@type": "Place",
          "name": "Cobourg, Ontario",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Cobourg",
            "addressRegion": "ON",
            "addressCountry": "CA"
          }
        },
        "serviceType": "Mercury outboard sales and repower",
        "url": `${SITE_URL}/mercury-dealer-cobourg`
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-dealer-cobourg#faqpage`,
        "mainEntity": COBOURG_FAQ.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": { "@type": "Answer", "text": item.answer }
        }))
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Dealer Cobourg Ontario | Harris Boat Works — 20 Min North</title>
      <meta
        name="description"
        content="Mercury Marine Platinum Dealer 20 minutes north of Cobourg on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Sales, repower, and service for Cobourg, Port Hope, and Northumberland County."
      />
      <meta
        name="keywords"
        content="Mercury dealer Cobourg, Mercury outboard Cobourg Ontario, Mercury repower Northumberland, boat motors Port Hope, Mercury Marine Cobourg Harbour"
      />
      <link rel="canonical" href={`${SITE_URL}/mercury-dealer-cobourg`} />

      <meta property="og:title" content="Mercury Dealer Cobourg Ontario | Harris Boat Works" />
      <meta property="og:description" content="Mercury Platinum Dealer 20 min north of Cobourg. Family-owned since 1947." />
      <meta property="og:url" content={`${SITE_URL}/mercury-dealer-cobourg`} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Dealer Cobourg Ontario" />
      <meta name="twitter:description" content="Mercury Platinum Dealer 20 min from Cobourg." />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

export { COBOURG_FAQ };
