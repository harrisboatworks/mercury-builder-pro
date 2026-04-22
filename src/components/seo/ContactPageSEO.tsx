import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

export function ContactPageSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": "https://mercuryrepower.ca/contact#webpage",
        "url": "https://mercuryrepower.ca/contact",
        "name": "Contact Harris Boat Works",
        "description": "Mercury dealer on Rice Lake — phone (905) 342-2153, text (647) 952-2153, email info@harrisboatworks.ca.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA"
      },
      {
        "@type": ["LocalBusiness", "Store", "AutoRepair"],
        "@id": "https://mercuryrepower.ca/#localbusiness",
        "name": "Harris Boat Works",
        "image": "https://www.harrisboatworks.ca/logo.png",
        "url": "https://www.harrisboatworks.ca/",
        "priceRange": "$$",
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
          "latitude": 44.1147,
          "longitude": -78.2564
        },
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "contactType": "sales",
            "telephone": "+1-905-342-2153",
            "email": "info@harrisboatworks.ca",
            "areaServed": "CA",
            "availableLanguage": "English"
          },
          {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "telephone": "+1-647-952-2153",
            "contactOption": "TollFree",
            "areaServed": "CA",
            "availableLanguage": "English"
          }
        ],
        "areaServed": [
          { "@type": "AdministrativeArea", "name": "Rice Lake" },
          { "@type": "AdministrativeArea", "name": "Kawartha Lakes" },
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" }
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
      <title>Contact Harris Boat Works | Mercury Repower Quotes | Gores Landing Ontario</title>
      <meta name="description" content="Get in touch for a Mercury outboard repower quote. Harris Boat Works, 5369 Harris Boat Works Rd, Gores Landing, Ontario. Call 905-342-2153. Family-owned since 1947." />
      <meta name="keywords" content="contact Harris Boat Works, Mercury dealer Ontario, Mercury repower quote, Gores Landing boat dealer, Rice Lake Mercury dealer" />
      <link rel="canonical" href={`${SITE_URL}/contact`} />

      {/* Open Graph */}
      <meta property="og:title" content="Contact Harris Boat Works | Mercury Repower Quotes" />
      <meta property="og:description" content="Get in touch for a Mercury outboard repower quote. Family-owned dealer since 1947 on Rice Lake." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${SITE_URL}/contact`} />
      <meta property="og:image" content={`${SITE_URL}/social-share.jpg`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Contact Harris Boat Works" />
      <meta name="twitter:description" content="Mercury repower quotes and service inquiries. Gores Landing, Ontario." />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
