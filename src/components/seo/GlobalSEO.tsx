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
          "latitude": 44.1167,
          "longitude": -78.2500
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
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Mercury Outboard Repower",
                "description": "Complete outboard motor replacement with new Mercury engine, rigging, controls, and professional installation"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Mercury Outboard Service & Repair",
                "description": "Certified Mercury outboard maintenance, diagnostics, and repair by factory-trained technicians"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Winterization & Storage",
                "description": "Full outboard winterization service and indoor/outdoor boat storage on Rice Lake"
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
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
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
          },
          {
            "@type": "Question",
            "name": "How do I reserve a Mercury motor?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You can reserve any Mercury motor with a deposit through our online quote builder. Deposit amounts are based on horsepower: $200 for motors 0-25HP, $500 for 30-115HP, and $1,000 for 150HP and up. The deposit locks in your price and holds the motor until pickup. Deposits on in-stock motors are fully refundable before pickup."
            }
          },
          {
            "@type": "Question",
            "name": "What payment methods do you accept for deposits?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Our checkout supports Apple Pay, Google Pay, Link (Stripe one-click), and all major credit cards. Mobile payment options make it quick and easy to secure your motor from your phone."
            }
          },
          {
            "@type": "Question",
            "name": "Are motor deposits refundable?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Deposits on in-stock motors are fully refundable if you change your mind before pickup. Deposits on special-order motors may be non-refundable once the order has been placed with Mercury, as these units are ordered specifically for you. We'll always confirm whether a motor is in-stock or special-order before you place your deposit."
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
