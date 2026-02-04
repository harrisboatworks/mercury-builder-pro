import { Helmet } from 'react-helmet-async';

export function AboutPageSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://quote.harrisboatworks.ca/about",
        "url": "https://quote.harrisboatworks.ca/about",
        "name": "About Harris Boat Works | Family-Owned Since 1947 | Mercury Dealer",
        "description": "Learn about Harris Boat Works' 77-year history serving Ontario boaters. Mercury Marine dealer since 1965. CSI Award-winning service on Rice Lake.",
        "isPartOf": {
          "@id": "https://quote.harrisboatworks.ca/#website"
        },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://quote.harrisboatworks.ca"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "About Us",
              "item": "https://quote.harrisboatworks.ca/about"
            }
          ]
        }
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://quote.harrisboatworks.ca/about#localbusiness",
        "name": "Harris Boat Works",
        "image": "https://quote.harrisboatworks.ca/assets/harris-logo-black.png",
        "description": "Family-owned marine dealership serving Ontario boaters since 1947. Authorized Mercury Marine dealer since 1965. CSI Award-winning service team specializing in outboard sales, service, and repowering.",
        "foundingDate": "1947",
        "foundingLocation": {
          "@type": "Place",
          "name": "Gores Landing, Ontario"
        },
        "slogan": "Serving Boaters Since 1947",
        "priceRange": "$$$",
        "currenciesAccepted": "CAD",
        "paymentAccepted": "Cash, Credit Card, Debit, Financing",
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
        "hasMap": "https://www.google.com/maps/dir/?api=1&destination=5369+Harris+Boat+Works+Rd+Gores+Landing+ON+K0K+2E0",
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
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "reviewCount": "127",
          "bestRating": "5",
          "worstRating": "1"
        },
        "award": [
          "Mercury CSI Award Winner",
          "Mercury Certified Repower Center"
        ],
        "knowsAbout": [
          "Mercury Marine Outboard Motors",
          "Boat Engine Repowering",
          "Marine Engine Service and Repair",
          "Mercury Parts and Accessories",
          "Boat Storage"
        ],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Services",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Mercury Outboard Sales",
                "description": "New Mercury outboard motor sales from 2.5HP to 600HP"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Boat Repowering",
                "description": "Professional engine replacement and installation services"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Marine Service & Repair",
                "description": "Factory-trained technicians for all Mercury service needs"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Parts & Accessories",
                "description": "Genuine Mercury parts and marine accessories"
              }
            }
          ]
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How long has Harris Boat Works been in business?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Harris Boat Works was founded in 1947, making us a family-owned business serving Ontario boaters for over 79 years. We've been an authorized Mercury Marine dealer since 1965 - over 60 years of Mercury expertise."
            }
          },
          {
            "@type": "Question",
            "name": "Where is Harris Boat Works located?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We're located at 5369 Harris Boat Works Rd in Gores Landing, Ontario (K0K 2E0), right on the shores of Rice Lake. We're easily accessible from Toronto (about 1.5 hours), Peterborough (30 minutes), and the Kawartha Lakes region."
            }
          },
          {
            "@type": "Question",
            "name": "What brands does Harris Boat Works carry?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We are an authorized Mercury Marine dealer, carrying the full line of Mercury outboard motors including FourStroke, Pro XS, Verado, SeaPro, and ProKicker models. We also stock genuine Mercury parts and accessories."
            }
          },
          {
            "@type": "Question",
            "name": "What services does Harris Boat Works offer?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We offer new Mercury motor sales, professional repower installations, factory-authorized service and repair, parts and accessories, and seasonal boat storage. Our technicians are Mercury-certified and trained at Mercury Marine facilities."
            }
          },
          {
            "@type": "Question",
            "name": "Is Harris Boat Works a certified Mercury dealer?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, we are a Mercury Premier Dealer, Mercury Certified Repower Center, and CSI Award winner. These certifications reflect our commitment to sales excellence, service quality, and customer satisfaction."
            }
          }
        ]
      }
    ]
  };

  return (
    <Helmet>
      <title>About Harris Boat Works | Family-Owned Since 1947 | Mercury Dealer Ontario</title>
      <meta name="description" content="Harris Boat Works: family-owned since 1947, Mercury dealer since 1965. CSI Award-winning service on Rice Lake, Ontario. 79 years of marine expertise serving the Kawarthas, Toronto, and Peterborough." />
      <meta name="keywords" content="Harris Boat Works, Mercury dealer Ontario, Rice Lake boat dealer, Kawartha Lakes marine, boat dealer Peterborough, Mercury repower center, family boat dealer" />
      <link rel="canonical" href="https://quote.harrisboatworks.ca/about" />
      
      {/* Open Graph */}
      <meta property="og:title" content="About Harris Boat Works | Mercury Dealer Since 1965" />
      <meta property="og:description" content="Family-owned marine dealership on Rice Lake. 79 years serving Ontario boaters." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://quote.harrisboatworks.ca/about" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="About Harris Boat Works" />
      <meta name="twitter:description" content="Family-owned Mercury dealer since 1947. CSI Award-winning service." />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
