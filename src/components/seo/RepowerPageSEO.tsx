import { Helmet } from '@/lib/helmet';
import { BUSINESS_ENTITY_ID } from '@/lib/business-identity.js';
import { getAllFAQItems } from '@/data/faqData';
import { getCurrentMercuryFinancingRate } from '@/components/promotions/TDAlwaysOnOffer';

const CURRENT_RATE = getCurrentMercuryFinancingRate();

// Select the key repower questions for this page's schema
const REPOWER_SCHEMA_QUESTIONS = [
  'What does it mean to repower a boat?',
  'How much does a Mercury repower cost?',
  'How long does a Mercury repower take?',
  'Can I repower a pontoon boat?',
  'Is it worth repowering my boat or should I buy a new boat?',
];

export function RepowerPageSEO() {
  const allItems = getAllFAQItems();
  const schemaFAQItems = REPOWER_SCHEMA_QUESTIONS
    .map(q => allItems.find(item => item.question === q))
    .filter(Boolean);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": "https://www.mercuryrepower.ca/repower#service",
        "name": "Mercury Outboard Repower Service",
        "serviceType": "Boat Motor Replacement",
        "provider": { "@id": BUSINESS_ENTITY_ID },
        "areaServed": ["Rice Lake", "Kawarthas", "Peterborough", "GTA", "Toronto", "Ontario"],
        "description": "Professional Mercury outboard motor repower service. Get 70% of the benefit of a new boat for 30% of the cost. Includes professional installation and lake testing. Pickup only at Gores Landing, no shipping. Valid government-issued photo ID required.",
        "offers": {
          "@type": "Offer",
          "priceRange": "$8,000 - $18,000",
          "priceCurrency": "CAD",
          "description": "Typical 60-115 HP repower for 16-18ft boats. Pickup only.",
          "availableDeliveryMethod": "http://purl.org/goodrelations/v1#DeliveryModePickUp"
        }
      },
      {
        "@type": "HowTo",
        "name": "The Harris Boat Works Repower Process",
        "description": "How we repower your boat with a new Mercury outboard motor",
        "step": [
          {
            "@type": "HowToStep",
            "position": 1,
            "name": "Consultation & Quote",
            "text": "We assess your boat and discuss your needs to recommend the right Mercury motor"
          },
          {
            "@type": "HowToStep",
            "position": 2,
            "name": "Scheduling",
            "text": "Book your installation with the shortest wait times in the area"
          },
          {
            "@type": "HowToStep",
            "position": 3,
            "name": "Professional Installation",
            "text": "Mercury-certified technicians install your new motor in 1-2 days"
          },
          {
            "@type": "HowToStep",
            "position": 4,
            "name": "Lake Test",
            "text": "We lake test on Rice Lake and walk you through every feature of your new motor"
          }
        ]
      },
      {
        "@type": "VideoObject",
        "name": "Mercury Repower at Harris Boat Works",
        "description": "Learn about repowering your boat with a new Mercury outboard at Harris Boat Works on Rice Lake, Ontario.",
        "thumbnailUrl": "https://img.youtube.com/vi/6uhYCYq9cLk/maxresdefault.jpg",
        "uploadDate": "2024-01-01T00:00:00-05:00",
        "contentUrl": "https://www.youtube.com/watch?v=6uhYCYq9cLk",
        "embedUrl": "https://www.youtube.com/embed/6uhYCYq9cLk"
      },
      {
        "@type": "FAQPage",
        "mainEntity": schemaFAQItems.map(item => ({
          "@type": "Question",
          "name": item!.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item!.answer.replace(/<[^>]*>/g, '')
          }
        }))
      },
      {
        "@type": "WebPage",
        "@id": "https://www.mercuryrepower.ca/repower#webpage",
        "url": "https://www.mercuryrepower.ca/repower",
        "name": "Mercury Outboard Repower Ontario | Harris Boat Works",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://www.mercuryrepower.ca/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Repower",
              "item": "https://www.mercuryrepower.ca/repower"
            }
          ]
        }
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Repower Ontario 2026: Cost, Process, Financing | HBW</title>
      <meta name="description" content={`Mercury outboard repower in Ontario: live CAD pricing, the full repower process, and ${CURRENT_RATE.rate} financing at Harris Boat Works. Rice Lake since 1965.`} />
      <meta name="keywords" content="mercury repower ontario, boat repower rice lake, outboard motor replacement, mercury dealer kawarthas, repower cottage boat, mercury four stroke, boat motor upgrade" />
      
      {/* Open Graph */}
      <meta property="og:title" content="Mercury Outboard Repower Ontario | Harris Boat Works" />
      <meta property="og:description" content="70% of the benefit for 30% of the cost. Expert Mercury repowers on Rice Lake since 1965." />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://www.mercuryrepower.ca/social-share.jpg" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Outboard Repower Ontario | Harris Boat Works" />
      <meta name="twitter:description" content="70% of the benefit for 30% of the cost. Expert Mercury repowers on Rice Lake." />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
