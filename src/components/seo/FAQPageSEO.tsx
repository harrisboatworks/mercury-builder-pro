import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { getAllFAQItems } from '@/data/faqData';

export function FAQPageSEO() {
  const allItems = getAllFAQItems();

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/faq#faqpage`,
        "name": "Mercury Outboard Repower FAQ — Harris Boat Works",
        "description": "Comprehensive answers to the most common Mercury outboard repower questions. Choosing, buying, financing, and installing — expert advice from Ontario's Mercury Marine Platinum Dealer.",
        "url": `${SITE_URL}/faq`,
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["#faq-hero-title", "#faq-hero-description"]
        },
        "mainEntity": allItems.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer.replace(/<[^>]*>/g, '')
          }
        }))
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/faq#webpage`,
        "url": `${SITE_URL}/faq`,
        "name": "Mercury Outboard Repower FAQ | Harris Boat Works",
        "description": "Answers to 24 common Mercury outboard repower questions — from choosing the right HP to warranty coverage, financing, trade-ins, and installation process.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
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
              "name": "FAQ",
              "item": `${SITE_URL}/faq`
            }
          ]
        },
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["#faq-hero-title", "#faq-hero-description"]
        }
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Outboard Repower FAQ — Harris Boat Works | mercuryrepower.ca</title>
      <meta
        name="description"
        content="Get expert answers to 24 Mercury outboard repower questions. Choosing the right HP, SmartCraft Connect, repower costs, financing, pontoon repowers, winterization — from Ontario's Mercury Marine Platinum Dealer since 1947."
      />
      <meta
        name="keywords"
        content="Mercury repower FAQ, Mercury outboard repower, boat repower Ontario, Mercury repower cost, Mercury outboard financing, Mercury dealer FAQ, repower vs new boat, Mercury Command Thrust, Mercury ProKicker, Harris Boat Works"
      />
      <link rel="canonical" href={`${SITE_URL}/faq`} />

      {/* Open Graph */}
      <meta property="og:title" content="Mercury Outboard Repower FAQ — Harris Boat Works" />
      <meta property="og:description" content="Expert answers to 24 Mercury outboard repower questions from Ontario's Mercury Marine Platinum Dealer since 1947." />
      <meta property="og:url" content={`${SITE_URL}/faq`} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${SITE_URL}/social-share.jpg`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Outboard Repower FAQ — Harris Boat Works" />
      <meta name="twitter:description" content="24 expert answers about Mercury outboard repowers — choosing, buying, financing, and installing." />
      <meta name="twitter:image" content={`${SITE_URL}/social-share.jpg`} />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
