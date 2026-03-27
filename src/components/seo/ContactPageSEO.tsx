import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

export function ContactPageSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/contact#webpage`,
        "url": `${SITE_URL}/contact`,
        "name": "Contact Harris Boat Works | Mercury Repower Quotes | Gores Landing Ontario",
        "description": "Get in touch for a Mercury outboard repower quote. Harris Boat Works, 25 Dobbins Lane, Gores Landing, Ontario. Call 905-342-2153. Family-owned since 1947.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["h1", ".contact-info"]
        },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": SITE_URL
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Contact",
              "item": `${SITE_URL}/contact`
            }
          ]
        }
      },
      {
        "@type": "ContactPage",
        "name": "Contact Harris Boat Works",
        "description": "Reach Harris Boat Works for Mercury outboard quotes, service inquiries, and parts orders.",
        "url": `${SITE_URL}/contact`,
        "mainEntity": {
          "@type": "LocalBusiness",
          "@id": `${SITE_URL}/#localbusiness`,
          "name": "Harris Boat Works",
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
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
              "opens": "08:00",
              "closes": "17:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": "Saturday",
              "opens": "09:00",
              "closes": "14:00"
            }
          ]
        }
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
