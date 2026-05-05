import { Helmet } from '@/lib/helmet';
import { BlogArticle } from '@/data/blogArticles';
import { SITE_URL } from '@/lib/site';
import { getCleanDescription, sanitizeForSchema } from '@/lib/strip-markdown';

interface BlogSEOProps {
  article: BlogArticle;
}

export function BlogSEO({ article }: BlogSEOProps) {
  const url = `${SITE_URL}/blog/${article.slug}`;
  const cleanDescription = getCleanDescription(article);

  // Calculate word count from content
  const wordCount = article.content.trim().split(/\s+/).length;
  
  // Parse read time to minutes for timeRequired (e.g., "8 min read" -> 8)
  const readTimeMinutes = parseInt(article.readTime) || 5;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        "headline": article.title,
        "description": cleanDescription,
        "image": `${SITE_URL}${article.image}`,
        "author": {
          "@type": "Person",
          "name": "Jay Harris",
          "jobTitle": "3rd-Generation Owner",
          "worksFor": {
            "@type": "Organization",
            "name": "Harris Boat Works",
            "@id": `${SITE_URL}/#organization`
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
          { "@type": "Organization", "name": "Mercury Marine" }
        ]
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        "url": url,
        "name": article.title,
        "inLanguage": "en-CA",
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": [".article-intro", ".faq-answer", "h1", "h2"]
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
      }] : [])
    ]
  };

  return (
    <Helmet>
      <title>{article.title} | Harris Boat Works Blog</title>
      <meta name="description" content={cleanDescription} />
      <meta name="keywords" content={article.keywords.join(", ")} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={article.title} />
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
      <meta name="twitter:title" content={article.title} />
      <meta name="twitter:description" content={cleanDescription} />
      <meta name="twitter:image" content={`${SITE_URL}${article.image}`} />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
