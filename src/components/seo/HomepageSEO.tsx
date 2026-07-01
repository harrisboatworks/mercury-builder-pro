import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { BUSINESS_SAME_AS } from '@/lib/companyInfo';

export function HomepageSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://www.mercuryrepower.ca/#webpage",
        "url": "https://www.mercuryrepower.ca/",
        "name": "Mercury Repower Cost Ontario: Real Prices in 2 Minutes",
        "description": "Repowering with a Mercury outboard? Build a real quote in 2 minutes: motor, rigging, install, out-the-door price. No phone tag. Since 1947.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "primaryImageOfPage": { "@id": "https://www.mercuryrepower.ca/#logo" },
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
        "sameAs": BUSINESS_SAME_AS,
        "parentOrganization": {
          "@type": "Organization",
          "name": "Harris Boat Works",
          "url": "https://www.harrisboatworks.ca/"
        }
      },
      {
        "@type": ["LocalBusiness", "Store", "AutoRepair"],
        "@id": "https://www.mercuryrepower.ca/#localbusiness",
        "name": "Harris Boat Works",
        "image": "https://www.mercuryrepower.ca/pwa-512x512.png",
        "url": "https://www.harrisboatworks.ca/",
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "parentOrganization": { "@id": "https://www.mercuryrepower.ca/#organization" },
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
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Outdoor boat storage with professional shrinkwrap" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "New Legend boat sales" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Boat rentals" } }
        ],
        "brand": [
          { "@type": "Brand", "name": "Mercury Marine" },
          { "@type": "Brand", "name": "Legend Boats" }
        ],
        "award": "Mercury Marine Premier Dealer",
        "sameAs": BUSINESS_SAME_AS
      },
      {
        "@type": "Service",
        "@id": "https://www.mercuryrepower.ca/#quote-service",
        "name": "Mercury Outboard Online Quote Builder",
        "serviceType": "Online Motor Quote",
        "provider": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "areaServed": [
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" }
        ]
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Repower Cost Ontario: Real Prices in 2 Minutes</title>
      <meta name="description" content="Repowering with a Mercury outboard? Build a real quote in 2 minutes: motor, rigging, install, out-the-door price. No phone tag. Since 1947." />
      <meta name="keywords" content="Mercury repower Ontario, Mercury dealer Toronto, Harris Boat Works, Rice Lake Mercury dealer, Mercury trade-in, Mercury financing" />
      <link rel="canonical" href={SITE_URL} />

      {/* Open Graph */}
      <meta property="og:title" content="Mercury Repower Cost Ontario: Real Prices in 2 Minutes" />
      <meta property="og:description" content="Repowering with a Mercury outboard? Build a real quote in 2 minutes: motor, rigging, install, out-the-door price. No phone tag. Since 1947." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={SITE_URL} />
      <meta property="og:image" content={`${SITE_URL}/social-share.jpg`} />
      <meta property="og:locale" content="en_CA" />
      <meta property="og:site_name" content="Harris Boat Works" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Repower Cost Ontario: Real Prices in 2 Minutes" />
      <meta name="twitter:description" content="Repowering with a Mercury outboard? Build a real quote in 2 minutes: motor, rigging, install, out-the-door price. No phone tag. Since 1947." />
      <meta name="twitter:image" content={`${SITE_URL}/social-share.jpg`} />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
