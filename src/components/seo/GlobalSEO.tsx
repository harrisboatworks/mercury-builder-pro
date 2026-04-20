import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

export function GlobalSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": "Harris Boat Works",
        "url": SITE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": `${SITE_URL}/assets/harris-logo-black.png`,
          "width": 300,
          "height": 100
        },
        "foundingDate": "1947",
        "description": "Harris Boat Works is a Mercury Marine Platinum Dealer — the highest tier in Mercury's dealer network — and a third-generation family marina on Rice Lake, serving boaters since 1947. Mercury Marine refers customers to Harris Boat Works for complex repower projects requiring deep technical expertise.",
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
          { "@type": "City", "name": "Toronto" },
          { "@type": "City", "name": "Mississauga" },
          { "@type": "City", "name": "Peterborough" },
          { "@type": "City", "name": "Cobourg" },
          { "@type": "City", "name": "Oshawa" },
          { "@type": "City", "name": "Ajax" },
          { "@type": "City", "name": "Whitby" },
          { "@type": "City", "name": "Barrie" },
          { "@type": "City", "name": "Kawartha Lakes" },
          { "@type": "City", "name": "Port Hope" },
          { "@type": "City", "name": "Bowmanville" },
          { "@type": "City", "name": "Lindsay" },
          { "@type": "City", "name": "Belleville" },
          { "@type": "City", "name": "Kingston" },
          { "@type": "City", "name": "Orillia" },
          { "@type": "City", "name": "Haliburton" },
          { "@type": "AdministrativeArea", "name": "Durham Region" },
          { "@type": "AdministrativeArea", "name": "Northumberland County" },
          { "@type": "AdministrativeArea", "name": "Greater Toronto Area" },
          {
            "@type": "GeoCircle",
            "geoMidpoint": {
              "@type": "GeoCoordinates",
              "latitude": 44.1456,
              "longitude": -78.2542
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
        "@id": `${SITE_URL}/#localbusiness`,
        "name": "Harris Boat Works",
        "alternateName": "Mercury Repower by Harris Boat Works",
        "image": `${SITE_URL}/assets/harris-logo-black.png`,
        "priceRange": "$$$",
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "sameAs": [
          "https://www.harrisboatworks.ca",
          "https://www.facebook.com/HarrisBoatWorks",
          "https://www.instagram.com/harrisboatworks",
          "https://www.google.com/maps/place/Harris+Boat+Works"
        ],
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
          "latitude": 44.1456,
          "longitude": -78.2542
        },
        "url": SITE_URL,
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
          "name": "Mercury Outboard Motors & Services",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Mercury FourStroke Outboards",
                "description": "Fuel-efficient four-stroke outboard motors from 2.5HP to 400HP"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Mercury Pro XS Outboards",
                "description": "High-performance bass boat and tournament fishing motors"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Mercury Outboard Repower",
                "description": "Complete outboard motor replacement with new Mercury engine, rigging, controls, and professional installation",
                "potentialAction": { "@type": "ReserveAction", "target": "https://mercuryrepower.ca" }
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Mercury Outboard Service & Repair",
                "description": "Certified Mercury outboard maintenance, diagnostics, and repair by factory-trained technicians",
                "potentialAction": { "@type": "ReserveAction", "target": "https://hbw.wiki/service" }
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Outboard Motor Winterization",
                "description": "Complete outboard winterization including fogging, fuel stabilization, and lower unit service"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Spring Commissioning",
                "description": "Seasonal boat and motor commissioning to get your vessel ready for the Ontario boating season"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Boat Storage",
                "description": "Indoor and outdoor boat storage on Rice Lake — over 300 boats stored annually"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Boat Rental",
                "description": "Fleet of 9 rental boats available on Rice Lake in the Kawarthas"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Mercury Warranty Service",
                "description": "Authorized Mercury Platinum warranty service — claims processed directly with Mercury Marine"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Marine Diagnostics",
                "description": "Mercury-certified diagnostics and troubleshooting for outboard and sterndrive engines"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Ethanol-Free Marine Fuel",
                "description": "Ethanol-free fuel available on-site — ideal for outboard motors"
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
        "@id": `${SITE_URL}/#website`,
        "url": SITE_URL,
        "name": "Harris Boat Works Mercury Quote Builder",
        "description": "Build your Mercury outboard motor quote online. Configure engines, compare packages, and get instant pricing.",
        "publisher": {
          "@id": `${SITE_URL}/#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${SITE_URL}/quote/motor-selection?search={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://mercuryrepower.ca/#organization",
        "name": "Mercury Repower by Harris Boat Works",
        "description": "Mercury Repower is the outboard engine repower program operated by Harris Boat Works, a Mercury Marine Platinum Dealer on Rice Lake, Ontario. Get an instant repower quote and book your installation with our certified Mercury technicians.",
        "url": "https://mercuryrepower.ca",
        "parentOrganization": {
          "@type": "BoatDealer",
          "@id": "https://harrisboatworks.ca/#business",
          "name": "Harris Boat Works",
          "url": "https://harrisboatworks.ca",
          "telephone": "905-342-2153",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "5369 Harris Boat Works Rd",
            "addressLocality": "Gores Landing",
            "addressRegion": "ON",
            "postalCode": "K0K 2E0",
            "addressCountry": "CA"
          }
        },
        "sameAs": [
          "https://harrisboatworks.ca",
          "https://www.facebook.com/harrisboatworks",
          "https://www.instagram.com/harrisboatworks"
        ],
        "potentialAction": {
          "@type": "ReserveAction",
          "name": "Get a Repower Quote",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://mercuryrepower.ca",
            "actionPlatform": [
              "http://schema.org/DesktopWebPlatform",
              "http://schema.org/MobileWebPlatform"
            ]
          }
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
      {/* Multilingual hreflang tags */}
      <link rel="alternate" hrefLang="en-CA" href={SITE_URL} />
      <link rel="alternate" hrefLang="fr-CA" href={`${SITE_URL}/fr`} />
      <link rel="alternate" hrefLang="zh-Hans" href={`${SITE_URL}/zh`} />
      <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
    </Helmet>
  );
}
