import { Helmet } from 'react-helmet-async';
import { BlogArticle } from '@/data/blogArticles';

interface BlogSEOProps {
  article: BlogArticle;
}

export function BlogSEO({ article }: BlogSEOProps) {
  const url = `https://quote.harrisboatworks.ca/blog/${article.slug}`;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        "headline": article.title,
        "description": article.description,
        "image": `https://quote.harrisboatworks.ca${article.image}`,
        "author": {
          "@type": "Organization",
          "name": "Harris Boat Works",
          "@id": "https://quote.harrisboatworks.ca/#organization"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Harris Boat Works",
          "@id": "https://quote.harrisboatworks.ca/#organization"
        },
        "datePublished": article.datePublished,
        "dateModified": article.dateModified,
        "mainEntityOfPage": url,
        "keywords": article.keywords.join(", ")
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://quote.harrisboatworks.ca"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Blog",
            "item": "https://quote.harrisboatworks.ca/blog"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": article.title,
            "item": url
          }
        ]
      },
      ...(article.faqs ? [{
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
      <meta property="og:image" content={`https://quote.harrisboatworks.ca${article.image}`} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="article" />
      <meta property="article:published_time" content={article.datePublished} />
      <meta property="article:modified_time" content={article.dateModified} />
      <meta property="article:author" content="Harris Boat Works" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={article.title} />
      <meta name="twitter:description" content={article.description} />
      <meta name="twitter:image" content={`https://quote.harrisboatworks.ca${article.image}`} />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
