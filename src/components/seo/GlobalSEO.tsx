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
