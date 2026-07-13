import { Helmet } from '@/lib/helmet';
import { blogArticles } from '@/data/blogArticles';
import { SITE_URL } from '@/lib/site';

export function BlogIndexSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/blog#webpage`,
        "name": "Mercury Motor Guides & Boating Tips | Harris Boat Works Blog",
        "description": "Expert advice on Mercury outboard motors, boat maintenance, and buying guides. Family marina on Rice Lake since 1947, helping Ontario boaters.",
        "url": `${SITE_URL}/blog`,
        "isPartOf": {
          "@id": `${SITE_URL}/#website`
        },
        "about": {
          "@id": `${SITE_URL}/#organization`
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
            }
          ]
        }
      },
      {
        "@type": "ItemList",
        "itemListElement": blogArticles.map((article, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `${SITE_URL}/blog/${article.slug}`,
          "name": article.title
        }))
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Motor Guides & Boating Tips | Harris Boat Works Blog</title>
      <meta name="description" content="Mercury outboard guides, maintenance tips, and repower advice from a family Mercury dealer on Rice Lake, Ontario since 1947. Straight answers." />
      <meta name="keywords" content="mercury outboard tips, boat motor guide, outboard maintenance, mercury dealer blog, boat buying guide ontario" />
      
      {/* Open Graph */}
      <meta property="og:title" content="Mercury Motor Guides & Boating Tips | Harris Boat Works Blog" />
      <meta property="og:description" content="Expert advice on Mercury outboard motors, boat maintenance, and buying guides." />
      <meta property="og:type" content="website" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="Mercury Motor Guides & Boating Tips" />
      <meta name="twitter:description" content="Expert advice from Ontario's trusted Mercury dealer. Family marina on Rice Lake since 1947." />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
