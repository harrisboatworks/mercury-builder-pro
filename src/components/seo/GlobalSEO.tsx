import { Helmet } from '@/lib/helmet';
import { BUSINESS_GEO, BUSINESS_SAME_AS } from '@/lib/companyInfo';
import { buildBusinessIdentity } from '@/lib/business-identity.js';
import googlePlaces from '@/data/google-places-cache.json';
import { withSeasonalSundayHours } from '@/lib/shopHours.js';

const LIVE_OPENING_HOURS = withSeasonalSundayHours(
  Array.isArray(googlePlaces.openingHoursSpecification)
    ? googlePlaces.openingHoursSpecification
    : [],
);

export function GlobalSEO() {
  // Site-wide JSON-LD only. Page-level nodes (WebPage, Service, FAQPage, etc.)
  // must come from each route's own SEO component to avoid duplicate @id collisions
  // after hydration (e.g. two "#webpage" nodes on /mercury-pro-xs).
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.mercuryrepower.ca/#website",
        "url": "https://www.mercuryrepower.ca/",
        "name": "Mercury Repower Quote Builder",
        "publisher": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA"
      },
      {
        "@type": "Organization",
        "@id": "https://www.mercuryrepower.ca/#organization",
        "name": "Harris Boat Works",
        "alternateName": "HBW",
        "legalName": "Harris Boat Works",
        "url": "https://www.harrisboatworks.ca/",
        "logo": {
          "@type": "ImageObject",
          "@id": "https://www.mercuryrepower.ca/#logo",
          "url": "https://www.mercuryrepower.ca/pwa-512x512.png",
          "caption": "Harris Boat Works"
        },
        "foundingDate": "1947",
        "founder": { "@type": "Person", "name": "Harris family" },
        "description": "Third-generation family marina on Rice Lake, Ontario. Mercury Marine Premier Dealer (Mercury dealer since 1965) and Legend Boats dealer.",
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
        "sameAs": BUSINESS_SAME_AS
      },
      {
        ...buildBusinessIdentity({ geo: BUSINESS_GEO, openingHoursSpecification: LIVE_OPENING_HOURS, sameAs: BUSINESS_SAME_AS }),
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
    </Helmet>
  );
}
