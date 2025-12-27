import { Helmet } from 'react-helmet-async';

export function GlobalSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://quote.harrisboatworks.ca/#organization",
        "name": "Harris Boat Works",
        "url": "https://quote.harrisboatworks.ca",
        "logo": {
          "@type": "ImageObject",
          "url": "https://quote.harrisboatworks.ca/assets/harris-logo-black.png",
          "width": 300,
          "height": 100
        },
        "foundingDate": "1947",
        "description": "Family-owned Mercury Marine dealer serving Ontario boaters since 1947. Authorized Mercury dealer since 1965. CSI Award-winning service team.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "+1-905-342-2153",
            "contactType": "sales",
            "availableLanguage": ["English"]
          },
          {
            "@type": "ContactPoint",
            "telephone": "+1-647-952-2153",
            "contactType": "customer service",
            "availableLanguage": ["English"]
          }
        ],
        "email": "info@harrisboatworks.ca",
        "areaServed": [
          {
            "@type": "GeoCircle",
            "geoMidpoint": {
              "@type": "GeoCoordinates",
              "latitude": 44.1167,
              "longitude": -78.2500
            },
            "geoRadius": "150000"
          }
        ],
        "knowsAbout": [
          "Mercury Marine Outboard Motors",
          "Boat Repowering",
          "Marine Engine Service",
          "Mercury Parts and Accessories"
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://quote.harrisboatworks.ca/#localbusiness",
        "name": "Harris Boat Works",
        "image": "https://quote.harrisboatworks.ca/assets/harris-logo-black.png",
        "priceRange": "$$$",
        "telephone": "+1-905-342-2153",
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
          "latitude": 44.1167,
          "longitude": -78.2500
        },
        "url": "https://quote.harrisboatworks.ca",
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "08:00",
            "closes": "17:00"
          },
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Saturday",
            "opens": "09:00",
            "closes": "14:00"
          }
        ],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Mercury Outboard Motors",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Product",
                "name": "Mercury FourStroke Outboards",
                "description": "Fuel-efficient four-stroke outboard motors from 2.5HP to 400HP"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Product",
                "name": "Mercury Pro XS Outboards",
                "description": "High-performance bass boat and tournament fishing motors"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Product",
                "name": "Mercury Verado Outboards",
                "description": "Premium supercharged outboard motors with advanced features"
              }
            }
          ]
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "reviewCount": "127",
          "bestRating": "5",
          "worstRating": "1"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://quote.harrisboatworks.ca/#website",
        "url": "https://quote.harrisboatworks.ca",
        "name": "Harris Boat Works Mercury Quote Builder",
        "description": "Build your Mercury outboard motor quote online. Configure engines, compare packages, and get instant pricing.",
        "publisher": {
          "@id": "https://quote.harrisboatworks.ca/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://quote.harrisboatworks.ca/quote/motor-selection?search={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://quote.harrisboatworks.ca/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What types of Mercury motors do you carry?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We carry the full Mercury Marine lineup including FourStroke (2.5-150HP), Pro XS (115-400HP), Verado (175-600HP), and SeaPro commercial motors. Our inventory includes over 120 models with various shaft lengths and configurations."
            }
          },
          {
            "@type": "Question",
            "name": "How does the online quote builder work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Our quote builder lets you select a Mercury motor, customize your package with accessories and warranty options, and see instant pricing. You can save your quote, apply for financing, or contact us directly—all online with no pressure."
            }
          },
          {
            "@type": "Question",
            "name": "Can I finance a Mercury motor?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! We offer competitive financing through Dealerplan with rates starting from 6.99% APR* on purchases over $10,000. Apply online in minutes and get pre-approved before your visit. *Promotional rates subject to availability."
            }
          },
          {
            "@type": "Question",
            "name": "Do you offer motor installation?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, we provide professional installation on Rice Lake including rigging, controls setup, propeller selection, and lake testing. Our Mercury-certified technicians ensure your motor is set up perfectly."
            }
          },
          {
            "@type": "Question",
            "name": "What areas do you serve?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We serve boaters throughout Central Ontario including Peterborough, Cobourg, Port Hope, Lindsay, and the Kawarthas. We're located on Rice Lake in Gores Landing, easily accessible from the GTA."
            }
          }
        ]
      }
    ]
  };

  return (
    <Helmet>
      {/* Global structured data for organization recognition */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
