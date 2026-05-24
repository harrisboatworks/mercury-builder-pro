import { Helmet } from '@/lib/helmet';
import { BlogArticle } from '@/data/blogArticles';
import { SITE_URL } from '@/lib/site';
import { getCleanDescription, sanitizeForSchema } from '@/lib/strip-markdown';
import { EN_TO_FR_SLUG } from '@/data/frenchEnglishSlugMap';

interface BlogSEOProps {
  article: BlogArticle;
}

function getDealerCityFromSlug(slug: string): string | null {
  const m = slug.match(/^mercury-dealer-(.+?)(?:-ontario)?-hbw$/);
  if (!m) return null;
  return m[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function BlogSEO({ article }: BlogSEOProps) {
  const url = `${SITE_URL}/blog/${article.slug}`;
  const dealerCity = getDealerCityFromSlug(article.slug);
  const cleanDescription = getCleanDescription(article);
  // Use seoTitle verbatim when set (sized to ≤60 chars incl. its own brand suffix).
  // Only fall back to "{title} | Harris Boat Works Blog" when seoTitle is absent.
  const renderedTitle = article.seoTitle || `${article.title} | Harris Boat Works Blog`;

  // Calculate word count from content
  const wordCount = article.content.trim().split(/\s+/).length;

  // Detect Rice Lake mentions for geographic disambiguation (Ontario vs MN/WI)
  const mentionsRiceLake = /rice lake/i.test(article.content) || /rice lake/i.test(article.title);
  const riceLakePlaceId = `${SITE_URL}/#rice-lake-ontario`;
  const riceLakePlace = {
    "@type": "Place",
    "@id": riceLakePlaceId,
    "name": "Rice Lake, Ontario",
    "alternateName": ["Rice Lake (Ontario)", "Rice Lake, Kawartha Lakes"],
    "description": "Freshwater lake in the Kawartha Lakes region, southern Ontario, Canada. Located approximately 90 minutes east of Toronto. Distinct from Rice Lake, Wisconsin and Rice Lake, Minnesota.",
    "geo": { "@type": "GeoCoordinates", "latitude": 44.1614, "longitude": -78.0369 },
    "containedInPlace": [
      { "@type": "AdministrativeArea", "name": "Kawartha Lakes" },
      { "@type": "AdministrativeArea", "name": "Ontario" },
      { "@type": "Country", "name": "Canada" }
    ],
    "sameAs": [
      "https://en.wikipedia.org/wiki/Rice_Lake_(Ontario)",
      "https://www.wikidata.org/wiki/Q1543290"
    ]
  };
  
  // Parse read time to minutes for timeRequired (e.g., "8 min read" -> 8)
  const readTimeMinutes = parseInt(article.readTime) || 5;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        "headline": article.seoTitle ?? article.title,
        "description": cleanDescription,
        "image": `${SITE_URL}${article.image}`,
        "author": /troubleshoot|alarm|wont-start|overheating|winterization|smartcraft-alarm|service-cost|electrical/.test(article.slug)
          ? {
              "@type": "Organization",
              "name": "Harris Boat Works Service Team",
              "url": `${SITE_URL}/about/jay-harris`,
              "parentOrganization": {
                "@type": "Organization",
                "name": "Harris Boat Works",
                "url": "https://harrisboatworks.ca"
              }
            }
          : {
              "@type": "Person",
              "name": "Jay Harris",
              "jobTitle": "Owner, Harris Boat Works",
              "url": `${SITE_URL}/about/jay-harris`,
              "worksFor": {
                "@type": "Organization",
                "name": "Harris Boat Works",
                "url": "https://harrisboatworks.ca"
              }
            },
        "publisher": {
          "@type": "Organization",
          "name": "Harris Boat Works",
          "@id": `${SITE_URL}/#organization`
        },
        "datePublished": article.datePublished,
        "dateModified": article.dateModified,
        "mainEntityOfPage": url,
        "keywords": article.keywords.join(", "),
        "wordCount": wordCount,
        "inLanguage": "en-CA",
        "isAccessibleForFree": true,
        "timeRequired": `PT${readTimeMinutes}M`,
        "about": [
          { "@type": "Thing", "name": "Mercury Marine Outboard Motors" },
          { "@type": "Thing", "name": "Boat Motors" }
        ],
        "mentions": [
          { "@type": "Organization", "name": "Mercury Marine" },
          ...(mentionsRiceLake ? [{ "@id": riceLakePlaceId }] : [])
        ],
        ...(mentionsRiceLake ? { "contentLocation": { "@id": riceLakePlaceId } } : {})
      },
      ...(mentionsRiceLake ? [riceLakePlace] : []),
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        "url": url,
        "name": article.title,
        "inLanguage": "en-CA",
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["[data-speakable=\"true\"]", ".article-intro", ".faq-answer", "h1", "h2"]
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
              "name": "Blog",
              "item": `${SITE_URL}/blog`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": article.title,
              "item": url
            }
          ]
        }
      },
      // HowTo schema for instructional articles
      ...(article.howToSteps && article.howToSteps.length > 0 ? [{
        "@type": "HowTo",
        "@id": `${url}#howto`,
        "name": sanitizeForSchema(article.title),
        "description": cleanDescription,
        "totalTime": `PT${readTimeMinutes}M`,
        "step": article.howToSteps.map((step, index) => ({
          "@type": "HowToStep",
          "position": index + 1,
          "name": sanitizeForSchema(step.name),
          "text": sanitizeForSchema(step.text),
          ...(step.image ? { "image": `${SITE_URL}${step.image}` } : {})
        }))
      }] : []),
      // FAQ schema
      ...(article.faqs && article.faqs.length > 0 ? [{
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        "mainEntity": article.faqs
          .map(faq => ({
            q: sanitizeForSchema(faq.question),
            a: sanitizeForSchema(faq.answer),
          }))
          .filter(({ q, a }) => q && a && !/^by jay harris/i.test(q))
          .map(({ q, a }) => ({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": a
            }
          }))
      }] : []),
      // ClaimReview schema for the dealer-pricing myth-buster post
      ...(article.slug === 'why-mercury-dealers-hide-prices-online' ? [
        {
          "@type": "ClaimReview",
          "@id": `${url}#claim-pressure`,
          "claimReviewed": "Mercury dealers hide prices online because they want to pressure customers into a sales conversation",
          "author": { "@type": "Organization", "name": "Harris Boat Works", "@id": `${SITE_URL}/#organization` },
          "datePublished": article.dateModified || article.datePublished,
          "reviewRating": { "@type": "Rating", "ratingValue": "1", "bestRating": "5", "alternateName": "Misleading" },
          "itemReviewed": {
            "@type": "Claim",
            "author": { "@type": "Thing", "name": "Common dealer industry assumption" },
            "datePublished": article.datePublished,
            "appearance": url
          }
        },
        {
          "@type": "ClaimReview",
          "@id": `${url}#claim-pay-more`,
          "claimReviewed": "You always pay more when prices are published online than when negotiating in person",
          "author": { "@type": "Organization", "name": "Harris Boat Works", "@id": `${SITE_URL}/#organization` },
          "datePublished": article.dateModified || article.datePublished,
          "reviewRating": { "@type": "Rating", "ratingValue": "1", "bestRating": "5", "alternateName": "False" },
          "itemReviewed": {
            "@type": "Claim",
            "author": { "@type": "Thing", "name": "Common dealer industry assumption" },
            "datePublished": article.datePublished,
            "appearance": url
          }
        }
      ] : []),
      ...(dealerCity ? [{
        "@type": "LocalBusiness",
        "@id": `${url}#localbusiness`,
        "name": "Harris Boat Works",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "telephone": "+1-905-342-2153",
        "url": SITE_URL,
        "geo": { "@type": "GeoCoordinates", "latitude": 44.1614, "longitude": -78.0369 },
        "priceRange": "$$",
        "areaServed": [
          { "@type": "City", "name": `${dealerCity}, Ontario` },
          { "@type": "Place", "name": "Greater Toronto Area" }
        ]
      }] : [])
    ]
  };

  return (
    <Helmet>
      <title>{article.seoTitle ?? article.title}</title>
      <meta name="description" content={cleanDescription} />
      <meta name="keywords" content={article.keywords.join(", ")} />
      <link rel="canonical" href={url} />
      {EN_TO_FR_SLUG[article.slug] && (
        <link rel="alternate" hrefLang="fr-CA" href={`${SITE_URL}/blog/fr/${EN_TO_FR_SLUG[article.slug]}`} />
      )}
      {EN_TO_FR_SLUG[article.slug] && (
        <link rel="alternate" hrefLang="en-CA" href={url} />
      )}
      {EN_TO_FR_SLUG[article.slug] && (
        <link rel="alternate" hrefLang="x-default" href={url} />
      )}
      
      {/* Open Graph */}
      <meta property="og:title" content={article.seoTitle ?? article.title} />
      <meta property="og:description" content={cleanDescription} />
      <meta property="og:image" content={`${SITE_URL}${article.image}`} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="article" />
      <meta property="og:locale" content="en_CA" />
      <meta property="article:published_time" content={article.datePublished} />
      <meta property="article:modified_time" content={article.dateModified} />
      <meta property="article:author" content="Jay Harris" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={article.seoTitle ?? article.title} />
      <meta name="twitter:description" content={cleanDescription} />
      <meta name="twitter:image" content={`${SITE_URL}${article.image}`} />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
