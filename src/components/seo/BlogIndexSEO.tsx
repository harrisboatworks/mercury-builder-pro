import { Helmet } from 'react-helmet-async';
import { blogArticles } from '@/data/blogArticles';

export function BlogIndexSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://quote.harrisboatworks.ca/blog#webpage",
        "name": "Mercury Motor Guides & Boating Tips | Harris Boat Works Blog",
        "description": "Expert advice on Mercury outboard motors, boat maintenance, and buying guides. 60+ years of dealer expertise helping Ontario boaters.",
        "url": "https://quote.harrisboatworks.ca/blog",
        "isPartOf": {
          "@id": "https://quote.harrisboatworks.ca/#website"
        },
        "about": {
          "@id": "https://quote.harrisboatworks.ca/#organization"
        }
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
          }
        ]
      },
      {
        "@type": "ItemList",
        "itemListElement": blogArticles.map((article, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `https://quote.harrisboatworks.ca/blog/${article.slug}`,
          "name": article.title
        }))
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Motor Guides & Boating Tips | Harris Boat Works Blog</title>
      <meta name="description" content="Expert advice on Mercury outboard motors, boat maintenance, and buying guides. 60+ years of dealer expertise helping Ontario boaters make informed decisions." />
      <meta name="keywords" content="mercury outboard tips, boat motor guide, outboard maintenance, mercury dealer blog, boat buying guide ontario" />
      <link rel="canonical" href="https://quote.harrisboatworks.ca/blog" />
      
      {/* Open Graph */}
      <meta property="og:title" content="Mercury Motor Guides & Boating Tips | Harris Boat Works Blog" />
      <meta property="og:description" content="Expert advice on Mercury outboard motors, boat maintenance, and buying guides." />
      <meta property="og:url" content="https://quote.harrisboatworks.ca/blog" />
      <meta property="og:type" content="website" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="Mercury Motor Guides & Boating Tips" />
      <meta name="twitter:description" content="Expert advice from Ontario's trusted Mercury dealer since 1965." />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
