import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

export function GlobalSEO() {
  // Site-wide JSON-LD only. Page-level nodes (WebPage, Service, FAQPage, etc.)
  // must come from each route's own SEO component to avoid duplicate @id collisions
  // after hydration (e.g. two "#webpage" nodes on /mercury-pro-xs).
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://mercuryrepower.ca/#website",
        "url": "https://mercuryrepower.ca/",
        "name": "Mercury Repower Quote Builder",
        "publisher": { "@id": "https://mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA"
      },
      {
        "@type": "Organization",
        "@id": "https://mercuryrepower.ca/#organization",
        "name": "Harris Boat Works",
        "alternateName": "HBW",
        "legalName": "Harris Boat Works",
        "url": "https://www.harrisboatworks.ca/",
        "logo": {
          "@type": "ImageObject",
          "@id": "https://mercuryrepower.ca/#logo",
          "url": "https://www.harrisboatworks.ca/logo.png",
          "caption": "Harris Boat Works"
        },
        "foundingDate": "1947",
        "founder": { "@type": "Person", "name": "Harris family" },
        "description": "Third-generation family marina on Rice Lake, Ontario. Mercury Marine Platinum Dealer (since 1965) and Legend Boats dealer.",
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
        "sameAs": [
          "https://www.harrisboatworks.ca/",
          "https://www.facebook.com/harrisboatworks",
          "https://www.instagram.com/harrisboatworks",
          "https://www.youtube.com/@HarrisBoatWorks",
          "https://g.page/harrisboatworks"
        ]
      },
      {
        "@type": ["LocalBusiness", "Store", "AutoRepair"],
        "@id": "https://mercuryrepower.ca/#localbusiness",
        "name": "Harris Boat Works",
        "image": "https://www.harrisboatworks.ca/logo.png",
        "url": "https://www.harrisboatworks.ca/",
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "priceRange": "$$",
        "parentOrganization": { "@id": "https://mercuryrepower.ca/#organization" },
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
          "latitude": 44.1147,
          "longitude": -78.2564
        },
        "areaServed": [
          { "@type": "AdministrativeArea", "name": "Rice Lake" },
          { "@type": "AdministrativeArea", "name": "Kawartha Lakes" },
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" }
        ],
        "makesOffer": [
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Mercury outboard repower" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Mercury & MerCruiser marine repair" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Winterization and spring launch" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Indoor and outdoor boat storage" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "New Legend boat sales" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Boat rentals" } }
        ],
        "brand": [
          { "@type": "Brand", "name": "Mercury Marine" },
          { "@type": "Brand", "name": "Legend Boats" }
        ],
        "award": "Mercury Marine Platinum Dealer"
      }
    ]
  };

  return (
    <Helmet>
      {/* Site-wide structured data: WebSite, Organization, LocalBusiness only.
          Page-level schema (WebPage, FAQPage, ProductGroup, Service) is owned by each route. */}
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
