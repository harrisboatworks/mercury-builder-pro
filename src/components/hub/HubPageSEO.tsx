import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { sanitizeForSchema } from '@/lib/strip-markdown';

export interface HubFAQ {
  question: string;
  answer: string;
}

export interface HubPageSEOProps {
  path: string; // e.g. "/repower"
  title: string; // <title>
  metaTitle?: string;
  metaDescription: string;
  h1: string;
  breadcrumbName: string; // e.g. "Mercury Repower"
  faqs: HubFAQ[];
  lastReviewedISO: string; // YYYY-MM-DD
  image?: string; // absolute or root-relative
  extraSchemas?: any[];
  /**
   * Optional canonical override. When set, <link rel="canonical"> points to
   * this path instead of `path`. Used to resolve keyword cannibalization
   * between near-duplicate hub pages and their builder counterpart.
   */
  canonicalPath?: string;
}

export function HubPageSEO({
  path,
  title,
  metaTitle,
  metaDescription,
  h1,
  breadcrumbName,
  faqs,
  lastReviewedISO,
  image,
  extraSchemas,
  canonicalPath,
}: HubPageSEOProps) {
  const url = `${SITE_URL}${path}`;
  const canonicalUrl = canonicalPath ? `${SITE_URL}${canonicalPath}` : url;
  const ogImage = image
    ? (image.startsWith('http') ? image : `${SITE_URL}${image}`)
    : `${SITE_URL}/social-share.jpg`;
  const cleanDesc = sanitizeForSchema(metaDescription);

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: sanitizeForSchema(metaTitle || title),
        headline: sanitizeForSchema(h1),
        description: cleanDesc,
        inLanguage: 'en-CA',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        mainEntityOfPage: url,
        dateModified: lastReviewedISO,
        author: {
          '@type': 'Person',
          name: 'Jay Harris',
          jobTitle: '3rd-Generation Owner',
          worksFor: { '@id': `${SITE_URL}/#organization` },
        },
        breadcrumb: { '@id': `${url}#breadcrumb` },
        primaryImageOfPage: { '@type': 'ImageObject', url: ogImage },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: breadcrumbName, item: url },
        ],
      },
      ...(faqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${url}#faq`,
              mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: sanitizeForSchema(f.question),
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: sanitizeForSchema(f.answer),
                },
              })),
            },
          ]
        : []),
      ...(extraSchemas && extraSchemas.length > 0 ? extraSchemas : []),
    ],
  };

  return (
    <Helmet>
      <title>{metaTitle || title}</title>
      <meta name="description" content={cleanDesc} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={metaTitle || title} />
      <meta property="og:description" content={cleanDesc} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_CA" />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle || title} />
      <meta name="twitter:description" content={cleanDesc} />
      <meta name="twitter:image" content={ogImage} />

      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
}
