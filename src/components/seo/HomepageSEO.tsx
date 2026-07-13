import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';

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

      {/* Open Graph */}
      <meta property="og:title" content="Mercury Repower Cost Ontario: Real Prices in 2 Minutes" />
      <meta property="og:description" content="Repowering with a Mercury outboard? Build a real quote in 2 minutes: motor, rigging, install, out-the-door price. No phone tag. Since 1947." />
      <meta property="og:type" content="website" />
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
