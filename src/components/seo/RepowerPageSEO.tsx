import { Helmet } from 'react-helmet-async';

export function RepowerPageSEO() {
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
        "uploadDate": "2024-01-01",
        "contentUrl": "https://www.youtube.com/watch?v=6uhYCYq9cLk",
        "embedUrl": "https://www.youtube.com/embed/6uhYCYq9cLk"
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What does '70% of the benefit for 30% of the cost' mean?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "This means you get most of the experience of owning a new boat—modern technology, reliability, better fuel economy, quieter operation—for a fraction of what a new boat would cost."
            }
          },
          {
            "@type": "Question",
            "name": "How much does a Mercury repower cost?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "For a typical Rice Lake cottage boat (16-18ft with 60-115 HP), expect to invest $8,000-$18,000 all-in, including motor, rigging, and professional installation."
            }
          },
          {
            "@type": "Question",
            "name": "What are signs my outboard motor needs replacing?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Watch for hard starting or stalling, excessive smoke, loss of power, and frequent repairs that keep adding up."
            }
          },
          {
            "@type": "Question",
            "name": "Why should I repower in winter?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Winter offers best availability (first pick before spring rush), no wait for installation during our quietest shop time, and you'll be ready for launch day when ice comes off."
            }
          },
          {
            "@type": "Question",
            "name": "How long does a repower take?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Professional installation typically takes 1-2 days, including a lake test on Rice Lake."
            }
          }
        ]
      },
      {
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
    ]
  };

  return (
    <Helmet>
      <title>Mercury Outboard Repower Ontario | 70% of the Benefit for 30% of the Cost | Harris Boat Works</title>
      <meta name="description" content="Expert Mercury repower in Ontario. Get 70% of a new boat experience for 30% of the cost. 30-40% better fuel economy. Lake tested on Rice Lake. Mercury dealer since 1965. $8,000-$18,000 typical." />
      <meta name="keywords" content="mercury repower ontario, boat repower rice lake, outboard motor replacement, mercury dealer kawarthas, repower cottage boat, mercury four stroke, boat motor upgrade" />
      <link rel="canonical" href="https://harrisboatworks.ca/repower" />
      
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
