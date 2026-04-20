import { Helmet } from 'react-helmet-async';
import { getAllFAQItems } from '@/data/faqData';

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
        "@type": "LocalBusiness",
        "@id": "https://harrisboatworks.ca/#business",
        "name": "Harris Boat Works",
        "description": "Mercury Certified Repower Center serving Ontario boaters since 1947. Expert outboard motor repowering on Rice Lake.",
        "url": "https://harrisboatworks.ca",
        "telephone": "(905) 342-2153",
        "email": "info@harrisboatworks.ca",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 44.1147,
          "longitude": -78.2564
        },
        "foundingDate": "1947",
        "priceRange": "$$"
      },
      {
        "@type": "Service",
        "@id": "https://harrisboatworks.ca/repower#service",
        "name": "Mercury Outboard Repower Service",
        "serviceType": "Boat Motor Replacement",
        "provider": { "@id": "https://harrisboatworks.ca/#business" },
        "areaServed": ["Rice Lake", "Kawarthas", "Peterborough", "GTA", "Toronto", "Ontario"],
        "description": "Professional Mercury outboard motor repower service. Get 70% of the benefit of a new boat for 30% of the cost. Includes professional installation and lake testing.",
        "offers": {
          "@type": "Offer",
          "priceRange": "$8,000 - $18,000",
          "priceCurrency": "CAD",
          "description": "Typical 60-115 HP repower for 16-18ft boats"
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
        "@id": "https://harrisboatworks.ca/repower#webpage",
        "url": "https://harrisboatworks.ca/repower",
        "name": "Mercury Outboard Repower Ontario | Harris Boat Works",
        "isPartOf": { "@id": "https://harrisboatworks.ca/#website" },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://harrisboatworks.ca/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Repower",
              "item": "https://harrisboatworks.ca/repower"
            }
          ]
        }
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Outboard Repower Ontario | 70% of the Benefit for 30% of the Cost | Harris Boat Works</title>
      <meta name="description" content="Expert Mercury repower in Ontario. Get 70% of a new boat experience for 30% of the cost. 30-40% better fuel economy. Lake tested on Rice Lake. Mercury dealer since 1965. $8,000-$18,000 typical." />
      <meta name="keywords" content="mercury repower ontario, boat repower rice lake, outboard motor replacement, mercury dealer kawarthas, repower cottage boat, mercury four stroke, boat motor upgrade" />
      <link rel="canonical" href="https://mercuryrepower.ca/repower" />
      
      {/* Open Graph */}
      <meta property="og:title" content="Mercury Outboard Repower Ontario | Harris Boat Works" />
      <meta property="og:description" content="70% of the benefit for 30% of the cost. Expert Mercury repowers on Rice Lake since 1965." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://harrisboatworks.ca/repower" />
      <meta property="og:image" content="https://harrisboatworks.ca/repower-assets/hbw-repower-infographic.png" />
      
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
