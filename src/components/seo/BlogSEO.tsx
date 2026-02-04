import { Helmet } from 'react-helmet-async';
import { BlogArticle } from '@/data/blogArticles';
import { SITE_URL } from '@/lib/site';

interface BlogSEOProps {
  article: BlogArticle;
}

export function BlogSEO({ article }: BlogSEOProps) {
  const url = `${SITE_URL}/blog/${article.slug}`;
  
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
        "description": article.description,
        "image": `${SITE_URL}${article.image}`,
        "author": {
          "@type": "Organization",
          "name": "Harris Boat Works",
          "@id": `${SITE_URL}/#organization`
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
        }
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
      },
      // HowTo schema for instructional articles
      ...(article.howToSteps && article.howToSteps.length > 0 ? [{
        "@type": "HowTo",
        "@id": `${url}#howto`,
        "name": article.title,
        "description": article.description,
        "totalTime": `PT${readTimeMinutes}M`,
        "step": article.howToSteps.map((step, index) => ({
          "@type": "HowToStep",
          "position": index + 1,
          "name": step.name,
          "text": step.text,
          ...(step.image ? { "image": `${SITE_URL}${step.image}` } : {})
        }))
      }] : []),
      // FAQ schema
      ...(article.faqs && article.faqs.length > 0 ? [{
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        "mainEntity": article.faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }] : [])
    ]
  };

  return (
    <Helmet>
      <title>{article.title} | Harris Boat Works Blog</title>
      <meta name="description" content={article.description} />
      <meta name="keywords" content={article.keywords.join(", ")} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={article.title} />
      <meta property="og:description" content={article.description} />
      <meta property="og:image" content={`${SITE_URL}${article.image}`} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="article" />
      <meta property="og:locale" content="en_CA" />
      <meta property="article:published_time" content={article.datePublished} />
      <meta property="article:modified_time" content={article.dateModified} />
      <meta property="article:author" content="Harris Boat Works" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={article.title} />
      <meta name="twitter:description" content={article.description} />
      <meta name="twitter:image" content={`${SITE_URL}${article.image}`} />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
