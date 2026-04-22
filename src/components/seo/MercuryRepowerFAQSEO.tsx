import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';
import { getAllFAQItems } from '@/data/faqData';

export function MercuryRepowerFAQSEO() {
  const allItems = getAllFAQItems();

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-repower-faq#webpage`,
        "url": `${SITE_URL}/mercury-repower-faq`,
        "name": "Mercury Outboard Repower FAQ — Every Question Answered | Harris Boat Works",
        "description": "Comprehensive Mercury repower FAQ covering 20+ buying, financing, installation, and warranty questions. Family-owned Mercury Marine Platinum Dealer on Rice Lake since 1947, Mercury dealer since 1965.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-repower-faq#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-repower-faq#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-repower-faq#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Repower FAQ", "item": `${SITE_URL}/mercury-repower-faq` }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-repower-faq#faqpage`,
        "name": "Mercury Outboard Repower FAQ",
        "url": `${SITE_URL}/mercury-repower-faq`,
        "mainEntity": allItems.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer.replace(/<[^>]*>/g, '')
          }
        }))
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Outboard Repower FAQ — Every Question Answered | Harris Boat Works</title>
      <meta
        name="description"
        content="20+ Mercury repower questions answered: cost, financing, pontoon repowers, shaft length, Pro XS vs FourStroke, warranty, trade-ins. Mercury Platinum Dealer since 1965 on Rice Lake, Ontario."
      />
      <meta
        name="keywords"
        content="Mercury repower FAQ, Mercury outboard FAQ, repower cost Ontario, pontoon repower, Mercury financing, Pro XS vs FourStroke, Command Thrust, ProKicker, SmartCraft Connect, Mercury warranty"
      />
      <link rel="canonical" href={`${SITE_URL}/mercury-repower-faq`} />

      <meta property="og:title" content="Mercury Outboard Repower FAQ — Every Question Answered" />
      <meta property="og:description" content="20+ Mercury repower questions answered by Ontario's Mercury Platinum Dealer since 1965." />
      <meta property="og:url" content={`${SITE_URL}/mercury-repower-faq`} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Outboard Repower FAQ" />
      <meta name="twitter:description" content="Every Mercury repower question answered. Family-owned since 1947." />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
