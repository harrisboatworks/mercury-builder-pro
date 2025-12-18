import { Helmet } from 'react-helmet-async';

interface MotorSelectionSEOProps {
  motorCount?: number;
  minPrice?: number;
  maxPrice?: number;
}

export function MotorSelectionSEO({ 
  motorCount = 128, 
  minPrice = 499, 
  maxPrice = 55000 
}: MotorSelectionSEOProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://quote.harrisboatworks.ca/quote/motor-selection",
        "url": "https://quote.harrisboatworks.ca/quote/motor-selection",
        "name": "Mercury Outboard Motors for Sale | Build Your Quote | Harris Boat Works",
        "description": "Browse our complete inventory of Mercury outboard motors from 2.5HP to 600HP. Configure your motor, compare packages, and get instant pricing online.",
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
              "name": "Motor Selection",
              "item": "https://quote.harrisboatworks.ca/quote/motor-selection"
            }
          ]
        }
      },
      {
        "@type": "ItemList",
        "name": "Mercury Outboard Motor Inventory",
        "description": "Complete selection of Mercury Marine outboard motors available at Harris Boat Works",
        "numberOfItems": motorCount,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "item": {
              "@type": "Product",
              "name": "Mercury FourStroke Outboards",
              "description": "Fuel-efficient four-stroke outboard motors. Available from 2.5HP to 400HP.",
              "brand": {
                "@type": "Brand",
                "name": "Mercury Marine"
              },
              "category": "Outboard Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 499,
                "highPrice": 45000,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": {
                  "@type": "Organization",
                  "name": "Harris Boat Works"
                }
              }
            }
          },
          {
            "@type": "ListItem",
            "position": 2,
            "item": {
              "@type": "Product",
              "name": "Mercury Pro XS Outboards",
              "description": "High-performance outboard motors designed for bass boats and tournament fishing.",
              "brand": {
                "@type": "Brand",
                "name": "Mercury Marine"
              },
              "category": "Performance Outboard Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 8000,
                "highPrice": 35000,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": {
                  "@type": "Organization",
                  "name": "Harris Boat Works"
                }
              }
            }
          },
          {
            "@type": "ListItem",
            "position": 3,
            "item": {
              "@type": "Product",
              "name": "Mercury Verado Outboards",
              "description": "Premium supercharged outboard motors with advanced technology and quiet operation.",
              "brand": {
                "@type": "Brand",
                "name": "Mercury Marine"
              },
              "category": "Premium Outboard Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 20000,
                "highPrice": 55000,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": {
                  "@type": "Organization",
                  "name": "Harris Boat Works"
                }
              }
            }
          },
          {
            "@type": "ListItem",
            "position": 4,
            "item": {
              "@type": "Product",
              "name": "Mercury SeaPro Outboards",
              "description": "Commercial-grade outboard motors built for heavy-duty use and reliability.",
              "brand": {
                "@type": "Brand",
                "name": "Mercury Marine"
              },
              "category": "Commercial Outboard Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 3500,
                "highPrice": 30000,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": {
                  "@type": "Organization",
                  "name": "Harris Boat Works"
                }
              }
            }
          },
          {
            "@type": "ListItem",
            "position": 5,
            "item": {
              "@type": "Product",
              "name": "Mercury ProKicker Outboards",
              "description": "Dedicated trolling and kicker motors for fishing boats.",
              "brand": {
                "@type": "Brand",
                "name": "Mercury Marine"
              },
              "category": "Trolling Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 4500,
                "highPrice": 6500,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": {
                  "@type": "Organization",
                  "name": "Harris Boat Works"
                }
              }
            }
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What size Mercury outboard motor do I need for my boat?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Motor size depends on your boat's length, weight, and intended use. As a general guide: boats under 14ft typically use 2.5-15HP, 14-18ft boats use 15-60HP, 18-22ft boats use 60-150HP, and larger boats may need 150HP+. Use our AI chat assistant for personalized recommendations based on your specific boat."
            }
          },
          {
            "@type": "Question",
            "name": "What is the difference between FourStroke and Pro XS motors?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Mercury FourStroke motors are designed for general recreational use with emphasis on fuel efficiency and reliability. Pro XS motors are performance-oriented with higher RPM ranges, lighter weight, and features optimized for bass fishing and tournament use."
            }
          },
          {
            "@type": "Question",
            "name": "Do you have Mercury motors in stock?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Harris Boat Works maintains extensive Mercury inventory at our Gores Landing, Ontario location. Many popular models are in-stock for immediate pickup. Motors not in local stock are typically available within 1-2 weeks from Mercury's Canadian warehouse."
            }
          },
          {
            "@type": "Question",
            "name": "What warranty comes with Mercury outboard motors?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Mercury outboard motors come with a factory warranty ranging from 3-5 years depending on the model. Many current promotions include the Get 5 Extended Warranty program, providing 5 years of comprehensive coverage at no additional cost."
            }
          }
        ]
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Outboard Motors for Sale Ontario | 2.5HP-600HP | Harris Boat Works</title>
      <meta name="description" content={`Shop ${motorCount}+ Mercury outboard motors from $${minPrice.toLocaleString()} to $${maxPrice.toLocaleString()} CAD. FourStroke, Pro XS, Verado, SeaPro. Configure online, get instant quotes. Ontario's trusted Mercury dealer since 1965.`} />
      <meta name="keywords" content="Mercury outboard motors, Mercury motors for sale, buy Mercury outboard, Mercury dealer Ontario, FourStroke outboard, Pro XS outboard, Verado outboard, boat motors Canada" />
      <link rel="canonical" href="https://quote.harrisboatworks.ca/quote/motor-selection" />
      
      {/* Open Graph */}
      <meta property="og:title" content="Mercury Outboard Motors for Sale | Harris Boat Works" />
      <meta property="og:description" content="Browse our complete Mercury outboard inventory. Configure your motor and get instant pricing online." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://quote.harrisboatworks.ca/quote/motor-selection" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Outboard Motors | Harris Boat Works" />
      <meta name="twitter:description" content="Shop Mercury outboard motors online. FourStroke, Pro XS, Verado, and more." />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
