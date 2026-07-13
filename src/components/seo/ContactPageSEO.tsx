import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';

export function ContactPageSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": "https://www.mercuryrepower.ca/contact#webpage",
        "url": "https://www.mercuryrepower.ca/contact",
        "name": "Contact Harris Boat Works",
        "description": "Mercury dealer on Rice Lake, phone (905) 342-2153, text (647) 952-2153, email info@harrisboatworks.ca.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA"
      }
    ]
  };

  return (
    <Helmet>
      <title>Contact Harris Boat Works | Mercury Repower Quotes | Gores Landing Ontario</title>
      <meta name="description" content="Get in touch for a Mercury outboard repower quote. Harris Boat Works, 5369 Harris Boat Works Rd, Gores Landing, Ontario. Call 905-342-2153. Family-owned since 1947." />
      <meta name="keywords" content="contact Harris Boat Works, Mercury dealer Ontario, Mercury repower quote, Gores Landing boat dealer, Rice Lake Mercury dealer" />

      {/* Open Graph */}
      <meta property="og:title" content="Contact Harris Boat Works | Mercury Repower Quotes" />
      <meta property="og:description" content="Get in touch for a Mercury outboard repower quote. Family-owned dealer since 1947 on Rice Lake." />
      <meta property="og:type" content="website" />
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
