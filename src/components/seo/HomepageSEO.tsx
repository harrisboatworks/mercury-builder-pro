import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

export function HomepageSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        "url": SITE_URL,
        "name": "Mercury Repower Quotes Online — Real Prices, No Forms | Harris Boat Works",
        "description": "Build a real Mercury outboard quote in 3 minutes. Live CAD pricing, financing, trade-in. Mercury Platinum Dealer on Rice Lake — family-owned since 1947, Mercury dealer since 1965.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["h1", "h2", ".hero-description"]
        },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": SITE_URL
            }
          ]
        }
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/#quote-service`,
        "name": "Mercury Outboard Online Quote Builder",
        "serviceType": "Online Motor Quote",
        "provider": { "@id": `${SITE_URL}/#organization` },
        "description": "Build a custom Mercury outboard motor quote online with instant pricing, package options, trade-in estimates, and financing calculations.",
        "areaServed": [
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" }
        ],
        "availableChannel": {
          "@type": "ServiceChannel",
          "serviceUrl": `${SITE_URL}/quote/motor-selection`,
          "serviceSmsNumber": "+1-647-952-2153",
          "servicePhone": {
            "@type": "ContactPoint",
            "telephone": "+1-905-342-2153"
          }
        }
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Repower Quotes Online — Real Prices, No Forms | Harris Boat Works</title>
      <meta name="description" content="Build a real Mercury outboard quote in 3 minutes. Live CAD pricing, financing, trade-in. Mercury Platinum Dealer on Rice Lake — family-owned since 1947, Mercury dealer since 1965." />
      <meta name="keywords" content="Mercury outboard quote, Mercury repower Ontario, Mercury dealer Toronto, Harris Boat Works, Rice Lake Mercury dealer, outboard motor pricing, Mercury FourStroke, Mercury Pro XS" />
      <link rel="canonical" href={SITE_URL} />

      {/* Open Graph */}
      <meta property="og:title" content="Mercury Repower Quotes Online — Real Prices, No Forms" />
      <meta property="og:description" content="Build a real Mercury outboard quote in 3 minutes. Live CAD pricing, financing, trade-in. Family-owned since 1947, Mercury dealer since 1965." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={SITE_URL} />
      <meta property="og:image" content={`${SITE_URL}/social-share.jpg`} />
      <meta property="og:locale" content="en_CA" />
      <meta property="og:site_name" content="Harris Boat Works" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Repower Quotes Online — Real Prices, No Forms" />
      <meta name="twitter:description" content="Instant Mercury outboard quotes. Family-owned since 1947." />
      <meta name="twitter:image" content={`${SITE_URL}/social-share.jpg`} />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
