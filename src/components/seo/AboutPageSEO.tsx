import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';

export function AboutPageSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://mercuryrepower.ca/about#webpage",
        "url": "https://mercuryrepower.ca/about",
        "name": "About Harris Boat Works",
        "description": "Family-owned Mercury dealer on Rice Lake, Ontario since 1947.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA"
      },
      {
        "@type": "Organization",
        "@id": "https://mercuryrepower.ca/#organization",
        "name": "Harris Boat Works",
        "alternateName": "HBW",
        "url": "https://www.harrisboatworks.ca/",
        "logo": "https://www.harrisboatworks.ca/logo.png",
        "foundingDate": "1947",
        "founder": { "@type": "Person", "name": "Harris family" },
        "description": "Third-generation family marina established in 1947 on Rice Lake in Gores Landing, Ontario. Mercury Marine dealer since 1965 and current Mercury Marine Platinum Dealer. Authorized Legend Boats dealer.",
        "slogan": "Real prices. Family-owned. Since 1947.",
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
        "award": [
          "Mercury Marine Platinum Dealer",
          "Authorized Legend Boats Dealer"
        ],
        "knowsAbout": [
          "Mercury outboard motors",
          "MerCruiser sterndrives",
          "Marine repower",
          "Boat winterization",
          "Boat storage",
          "Legend Boats"
        ],
        "sameAs": [
          "https://www.harrisboatworks.ca/",
          "https://www.facebook.com/harrisboatworks",
          "https://www.instagram.com/harrisboatworks",
          "https://www.youtube.com/@HarrisBoatWorks",
          "https://g.page/harrisboatworks"
        ]
      }
    ]
  };

  return (
    <Helmet>
      <title>About Harris Boat Works | Family-Owned Since 1947 | Mercury Dealer Ontario</title>
      <meta name="description" content="Harris Boat Works: family-owned since 1947, Mercury dealer since 1965. CSI Award-winning service on Rice Lake, Ontario. 79 years of marine expertise serving the Kawarthas, Toronto, and Peterborough." />
      <meta name="keywords" content="Harris Boat Works, Mercury dealer Ontario, Rice Lake boat dealer, Kawartha Lakes marine, boat dealer Peterborough, Mercury repower center, family boat dealer" />
      <link rel="canonical" href={`${SITE_URL}/about`} />
      
      {/* Open Graph */}
      <meta property="og:title" content="About Harris Boat Works | Mercury Dealer Since 1965" />
      <meta property="og:description" content="Family-owned marine dealership on Rice Lake. 79 years serving Ontario boaters." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${SITE_URL}/about`} />
      
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
