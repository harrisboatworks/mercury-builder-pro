import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';

const PONTOON_FAQ = [
  {
    question: "What size Mercury outboard do I need for a pontoon?",
    answer: "It depends on tube count, length, and load. As a rule of thumb: 16–18 ft single-tube pontoons run well on 40–60 HP Command Thrust; 20–22 ft two-tube pontoons typically want 90–115 HP Command Thrust; 22–25 ft tri-toon (three tubes) pontoons take 150 HP and up. Heavier loads, water sports, or rougher water push you to the higher end. Build a quote at mercuryrepower.ca and we'll confirm the right HP for your specific hull."
  },
  {
    question: "What is Mercury Command Thrust and why does it matter for pontoons?",
    answer: "Command Thrust (CT) is a Mercury option that pairs the engine with a larger gearcase, lower gear ratio, and a bigger high-thrust prop. The result is more grunt at low RPM — better hole shot with a heavy pontoon load, more pushing power at slow speeds, and better handling in wind. For pontoons, Command Thrust is almost always the right call over the standard gearcase."
  },
  {
    question: "Do I need a long shaft (20 in) or extra-long shaft (25 in) for my pontoon?",
    answer: "Most pontoons want a long shaft (20 in / 'L') because the transom on a pontoon log is taller than a typical aluminum tin boat. Some larger tri-toon platforms with a higher transom take an extra-long shaft (25 in / 'XL'). Measure from the top of the transom to the bottom of the hull at the centerline. If you're not sure, send us a photo through the contact page and we'll confirm before you buy."
  },
  {
    question: "Will a Mercury Command Thrust fit my Legend, Princecraft, or Sylvan pontoon?",
    answer: "Yes — Mercury Command Thrust 40–150 HP is a common factory option on Legend, Princecraft, Sylvan, Manitou, Sunchaser, and Bennington pontoons. Harris Boat Works is an authorized Legend Boats dealer, so we know those rigging packages well. For other brands, we'll confirm bolt pattern, controls, and harness compatibility when you build your quote."
  },
  {
    question: "How much does a pontoon repower cost in Ontario?",
    answer: "Most pontoon repowers run $9,000 to $18,000 CAD installed, depending on horsepower (90–150 HP Command Thrust is the typical range), controls (mechanical vs digital), and rigging. That's motor + new controls/cables + propeller + install + lake test + warranty registration. Build a quote at mercuryrepower.ca for live CAD pricing. Pickup only at Gores Landing on Rice Lake."
  }
];

export function MercuryPontoonOutboardsSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-pontoon-outboards#webpage`,
        "url": `${SITE_URL}/mercury-pontoon-outboards`,
        "name": "Mercury Outboards for Pontoon Boats — Command Thrust, Big Tiller & High-Thrust Options | Harris Boat Works",
        "description": "Mercury Command Thrust outboards for pontoon boats — 40 to 150 HP. HP sizing, shaft length, and Legend/Princecraft pairings. Mercury Platinum Dealer on Rice Lake serving Kawarthas, GTA, and Ontario.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-pontoon-outboards#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-pontoon-outboards#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-pontoon-outboards#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Outboards for Pontoon Boats", "item": `${SITE_URL}/mercury-pontoon-outboards` }
        ]
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/mercury-pontoon-outboards#service`,
        "name": "Mercury Pontoon Outboard Sales & Repower",
        "description": "Mercury Command Thrust outboards (40–150 HP) and high-thrust repower service for pontoon boats. Legend, Princecraft, Sylvan, Manitou, Sunchaser, and Bennington compatible.",
        "provider": { "@id": `${SITE_URL}/#organization` },
        "areaServed": [
          { "@type": "Place", "name": "Rice Lake, Ontario" },
          { "@type": "Place", "name": "Kawartha Lakes" },
          { "@type": "Place", "name": "Trent-Severn Waterway" },
          { "@type": "Place", "name": "Greater Toronto Area" },
          { "@type": "AdministrativeArea", "name": "Ontario, Canada" }
        ],
        "serviceType": "Pontoon outboard repower",
        "url": `${SITE_URL}/mercury-pontoon-outboards`
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-pontoon-outboards#faqpage`,
        "mainEntity": PONTOON_FAQ.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": { "@type": "Answer", "text": item.answer }
        }))
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Outboards for Pontoon Boats — Command Thrust, Big Tiller & High-Thrust Options | Harris Boat Works</title>
      <meta
        name="description"
        content="Mercury Command Thrust outboards for pontoon boats — 40 to 150 HP. HP sizing, shaft length, and Legend/Princecraft pairings. Mercury Platinum Dealer on Rice Lake."
      />
      <meta
        name="keywords"
        content="Mercury pontoon outboard, Mercury Command Thrust, pontoon repower Ontario, Mercury 90 Command Thrust, Mercury 115 Command Thrust, Legend pontoon Mercury, Princecraft pontoon outboard, pontoon motor Kawarthas"
      />
      <link rel="canonical" href={`${SITE_URL}/mercury-pontoon-outboards`} />

      <meta property="og:title" content="Mercury Outboards for Pontoon Boats — Command Thrust & High-Thrust Options" />
      <meta property="og:description" content="Mercury Command Thrust 40–150 HP for pontoon boats. Mercury Platinum Dealer on Rice Lake." />
      <meta property="og:url" content={`${SITE_URL}/mercury-pontoon-outboards`} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Outboards for Pontoon Boats" />
      <meta name="twitter:description" content="Command Thrust 40–150 HP for pontoons — Mercury Platinum Dealer." />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

export { PONTOON_FAQ };
