import { Helmet } from 'react-helmet-async';
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
        "name": "Mercury Outboard FAQ — Harris Boat Works",
        "description": "Comprehensive answers to the most common Mercury outboard motor questions. Choosing, buying, maintaining, and repowering — expert advice from Ontario's trusted Mercury dealer.",
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
            "text": item.answer.replace(/<[^>]*>/g, '') // Strip HTML for schema
          }
        }))
      },
      {
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
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/faq#webpage`,
        "url": `${SITE_URL}/faq`,
        "name": "Mercury Outboard FAQ | Harris Boat Works",
        "description": "Answers to 50+ common Mercury outboard motor questions — from choosing the right HP to warranty coverage, maintenance schedules, repowering, and financing.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "breadcrumb": { "@id": `${SITE_URL}/faq#breadcrumblist` },
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["#faq-hero-title", "#faq-hero-description"]
        }
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Outboard FAQ — Answers from Ontario's Trusted Dealer | Harris Boat Works</title>
      <meta
        name="description"
        content="Get expert answers to 50+ Mercury outboard motor questions. Choosing the right HP, repower costs, maintenance schedules, warranty coverage, financing — from a Mercury dealer since 1965."
      />
      <meta
        name="keywords"
        content="Mercury outboard FAQ, Mercury motor questions, boat motor FAQ Ontario, Mercury repower FAQ, Mercury outboard maintenance, Mercury warranty, Mercury dealer FAQ, buy Mercury outboard Canada"
      />
      <link rel="canonical" href={`${SITE_URL}/faq`} />

      {/* Open Graph */}
      <meta property="og:title" content="Mercury Outboard FAQ — Harris Boat Works" />
      <meta property="og:description" content="Expert answers to 50+ Mercury outboard motor questions from Ontario's trusted dealer since 1965." />
      <meta property="og:url" content={`${SITE_URL}/faq`} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${SITE_URL}/social-share.jpg`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Outboard FAQ — Harris Boat Works" />
      <meta name="twitter:description" content="50+ expert answers about Mercury outboard motors — choosing, buying, maintaining, and financing." />
      <meta name="twitter:image" content={`${SITE_URL}/social-share.jpg`} />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
