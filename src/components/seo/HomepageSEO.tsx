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
        "name": "Mercury Outboard Repower Quote | Harris Boat Works | Ontario Mercury Dealer",
        "description": "Get an instant Mercury outboard repower quote online. Harris Boat Works — family-owned Mercury dealer since 1947 on Rice Lake. Serving Toronto, Peterborough & Kawartha Lakes. 2.5–300 HP.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["h1", "h2", ".hero-description"]
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/#breadcrumblist`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": SITE_URL
          }
        ]
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
      <title>Mercury Outboard Repower Quote | Harris Boat Works | Ontario Mercury Dealer</title>
      <meta name="description" content="Get an instant Mercury outboard repower quote online. Harris Boat Works — family-owned Mercury dealer since 1947 on Rice Lake. Serving Toronto, Peterborough & Kawartha Lakes. 2.5–300 HP." />
      <meta name="keywords" content="Mercury outboard quote, Mercury repower, Mercury dealer Ontario, Harris Boat Works, Rice Lake Mercury dealer, outboard motor quote, Mercury FourStroke, Mercury Pro XS" />
      <link rel="canonical" href={SITE_URL} />

      {/* Open Graph */}
      <meta property="og:title" content="Mercury Outboard Repower Quote | Harris Boat Works" />
      <meta property="og:description" content="Get an instant Mercury outboard repower quote online. Family-owned Mercury dealer since 1947 on Rice Lake, Ontario." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={SITE_URL} />
      <meta property="og:image" content={`${SITE_URL}/social-share.jpg`} />
      <meta property="og:locale" content="en_CA" />
      <meta property="og:site_name" content="Harris Boat Works" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Outboard Repower Quote | Harris Boat Works" />
      <meta name="twitter:description" content="Instant Mercury outboard quotes. Family-owned dealer since 1947." />
      <meta name="twitter:image" content={`${SITE_URL}/social-share.jpg`} />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
