import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { BUSINESS_SAME_AS } from '@/lib/companyInfo';

export function AboutPageSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://www.mercuryrepower.ca/about#webpage",
        "url": "https://www.mercuryrepower.ca/about",
        "name": "About Harris Boat Works",
        "description": "Family-owned Mercury dealer on Rice Lake, Ontario since 1947.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA"
      },
      {
        "@type": "Organization",
        "@id": "https://www.mercuryrepower.ca/#organization",
        "name": "Harris Boat Works",
        "alternateName": "HBW",
        "url": "https://www.harrisboatworks.ca/",
        "logo": "https://www.mercuryrepower.ca/pwa-512x512.png",
        "foundingDate": "1947",
        "founder": { "@type": "Person", "name": "Harris family" },
        "description": "Third-generation family marina established in 1947 on Rice Lake in Gores Landing, Ontario. Mercury Marine dealer since 1965 and current Mercury Marine Premier Dealer. Authorized Legend Boats dealer.",
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
          "Mercury Marine Premier Dealer",
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
        "sameAs": BUSINESS_SAME_AS
      }
    ]
  };

  return (
    <Helmet>
      <title>About Harris Boat Works | Family-Owned Since 1947</title>
      <meta name="description" content="Family-owned Mercury dealer on Rice Lake, Ontario since 1947. Mercury Premier Dealer serving Kawarthas, GTA & Peterborough — real prices, no phone tag." />
      <meta name="keywords" content="Harris Boat Works, Mercury dealer Ontario, Rice Lake boat dealer, Kawartha Lakes marine, boat dealer Peterborough, Mercury repower center, family boat dealer" />

      {/* Open Graph */}
      <meta property="og:title" content="About Harris Boat Works | Family-Owned Since 1947" />
      <meta property="og:description" content="Family-owned Mercury dealer on Rice Lake, Ontario since 1947. Mercury Premier Dealer serving Kawarthas, GTA & Peterborough." />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="About Harris Boat Works | Family-Owned Since 1947" />
      <meta name="twitter:description" content="Family-owned Mercury dealer on Rice Lake, Ontario since 1947. Mercury Premier Dealer serving Kawarthas, GTA & Peterborough." />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
