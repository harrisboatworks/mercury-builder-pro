import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

const GTA_FAQ = [
  {
    question: "Is there a Mercury dealer that serves the GTA?",
    answer: "Harris Boat Works on Rice Lake serves GTA boaters from across the Greater Toronto Area. We're 90 minutes east of Toronto via Highway 401 — closer than most GTA boaters realize for a Mercury Marine Platinum Dealer. Family-owned since 1947, Mercury dealer since 1965."
  },
  {
    question: "How do GTA customers handle pickup?",
    answer: "Two ways: bring your boat down to Gores Landing for full installation, or pick up a loose Mercury motor and install it yourself (or with your local mechanic). We do not ship motors and we do not deliver — pickup only at our Rice Lake location, which keeps pricing transparent and warranty registration clean."
  },
  {
    question: "Is it worth driving from Toronto for a Mercury outboard?",
    answer: "GTA boaters tell us yes — for three reasons. (1) Real CAD pricing online with no \"call for price\" runaround. (2) Mercury Platinum Dealer status (top tier in North America). (3) Family-owned, so the same people quote, install, and service the motor. Combined with a one-hour easy run on the 401, the math usually works out better than buying in the GTA."
  },
  {
    question: "Do you handle Lake Simcoe and Lake Scugog Mercury repowers?",
    answer: "Yes — Lake Simcoe (Barrie, Orillia, Innisfil), Lake Scugog (Port Perry), and the Trent-Severn Waterway are core Mercury repower markets for us. Common configurations: Pro XS 150–250 for performance hulls, FourStroke 90–150 with Command Thrust for pontoons, FourStroke V8 250–300 for larger Lake Simcoe boats."
  },
  {
    question: "How long does a GTA Mercury repower take?",
    answer: "Typical timeline once you've picked the motor: 1–3 weeks for in-stock motors (longer for special orders), about 1 day in the shop for the install, then a lake-test before pickup. Plan one trip down for drop-off and one for pickup — or one trip total if you're picking up a loose motor for self-install."
  }
];

export function MercuryDealerGTASEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-dealer-gta#webpage`,
        "url": `${SITE_URL}/mercury-dealer-gta`,
        "name": "Mercury Dealer for the GTA | Harris Boat Works — 90 Min East of Toronto",
        "description": "Mercury Marine Platinum Dealer 90 minutes east of Toronto on Rice Lake. Real CAD pricing online, family-owned since 1947, Mercury dealer since 1965. Serving GTA, Lake Simcoe, and Lake Scugog Mercury repowers.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-dealer-gta#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-dealer-gta#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-dealer-gta#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Dealer GTA", "item": `${SITE_URL}/mercury-dealer-gta` }
        ]
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/mercury-dealer-gta#service`,
        "name": "Mercury Outboard Sales & Repower — GTA",
        "description": "Mercury outboard sales, repower, and service for the Greater Toronto Area, Lake Simcoe, Lake Scugog, and the Trent-Severn Waterway. Bring boat for install or pick up loose motor for self-install. Pickup only at Gores Landing.",
        "provider": { "@id": "https://mercuryrepower.ca/#organization" },
        "areaServed": [
          {
            "@type": "Place",
            "name": "Greater Toronto Area",
            "address": { "@type": "PostalAddress", "addressLocality": "Toronto", "addressRegion": "ON", "addressCountry": "CA" }
          },
          {
            "@type": "Place",
            "name": "Lake Simcoe",
            "address": { "@type": "PostalAddress", "addressLocality": "Barrie", "addressRegion": "ON", "addressCountry": "CA" }
          },
          {
            "@type": "Place",
            "name": "Lake Scugog",
            "address": { "@type": "PostalAddress", "addressLocality": "Port Perry", "addressRegion": "ON", "addressCountry": "CA" }
          }
        ],
        "serviceType": "Mercury outboard sales and repower",
        "url": `${SITE_URL}/mercury-dealer-gta`
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-dealer-gta#faqpage`,
        "mainEntity": GTA_FAQ.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": { "@type": "Answer", "text": item.answer }
        }))
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Dealer for the GTA | Harris Boat Works — 90 Min East of Toronto</title>
      <meta
        name="description"
        content="Mercury Marine Platinum Dealer 90 minutes east of Toronto on Rice Lake. Real CAD pricing online, family-owned since 1947, Mercury dealer since 1965. Serving GTA, Lake Simcoe, and Lake Scugog Mercury repowers."
      />
      <meta
        name="keywords"
        content="Mercury dealer GTA, Mercury dealer Toronto, Mercury outboard Lake Simcoe, Mercury repower Lake Scugog, Mercury Marine Greater Toronto Area, Mercury dealer near Toronto"
      />
      <link rel="canonical" href={`${SITE_URL}/mercury-dealer-gta`} />

      <meta property="og:title" content="Mercury Dealer for the GTA | Harris Boat Works" />
      <meta property="og:description" content="Mercury Platinum Dealer 90 min east of Toronto. Real CAD pricing, family-owned since 1947." />
      <meta property="og:url" content={`${SITE_URL}/mercury-dealer-gta`} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Dealer for the GTA" />
      <meta name="twitter:description" content="Mercury Platinum Dealer 90 min east of Toronto." />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

export { GTA_FAQ };
