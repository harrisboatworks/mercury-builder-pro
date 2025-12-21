import { blogArticles, isArticlePublished } from '@/data/blogArticles';

// RSS Feed generation - this is a static page that generates XML
export default function RssFeed() {
  const publishedArticles = blogArticles
    .filter(article => isArticlePublished(article))
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  const baseUrl = 'https://harrisboatworks.com';
  const feedUrl = `${baseUrl}/rss.xml`;
  const lastBuildDate = publishedArticles[0] 
    ? new Date(publishedArticles[0].publishDate).toUTCString()
    : new Date().toUTCString();

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Harris Boat Works Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Expert advice on Mercury outboard motors from Ontario's trusted dealer since 1965. Guides, tips, and industry insights.</description>
    <language>en-ca</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/lovable-uploads/logo-dark.png</url>
      <title>Harris Boat Works Blog</title>
      <link>${baseUrl}/blog</link>
    </image>
    ${publishedArticles.map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${baseUrl}/blog/${article.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${article.slug}</guid>
      <pubDate>${new Date(article.publishDate).toUTCString()}</pubDate>
      <description><![CDATA[${article.description}]]></description>
      <category>${article.category}</category>
      ${article.image ? `<enclosure url="${article.image.startsWith('/') ? baseUrl + article.image : article.image}" type="image/jpeg"/>` : ''}
    </item>`).join('')}
  </channel>
</rss>`;

  // Return a simple component that shows RSS info - the actual XML is served differently
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-4">RSS Feed</h1>
        <p className="text-muted-foreground mb-4">
          Subscribe to our blog using your favorite RSS reader.
        </p>
        <div className="bg-muted p-4 rounded-lg">
          <code className="text-sm break-all">{feedUrl}</code>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Copy this URL and add it to your RSS reader to get updates when we publish new articles.
        </p>
        <a 
          href="/blog" 
          className="inline-block mt-6 text-primary hover:underline"
        >
          ← Back to Blog
        </a>
      </div>
    </div>
  );
}

// Export the raw RSS XML for use by the edge function or static generation
export function generateRssXml(): string {
  const publishedArticles = blogArticles
    .filter(article => isArticlePublished(article))
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  const baseUrl = 'https://harrisboatworks.com';
  const feedUrl = `${baseUrl}/rss.xml`;
  const lastBuildDate = publishedArticles[0] 
    ? new Date(publishedArticles[0].publishDate).toUTCString()
    : new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Harris Boat Works Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Expert advice on Mercury outboard motors from Ontario's trusted dealer since 1965. Guides, tips, and industry insights.</description>
    <language>en-ca</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/lovable-uploads/logo-dark.png</url>
      <title>Harris Boat Works Blog</title>
      <link>${baseUrl}/blog</link>
    </image>
    ${publishedArticles.map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${baseUrl}/blog/${article.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${article.slug}</guid>
      <pubDate>${new Date(article.publishDate).toUTCString()}</pubDate>
      <description><![CDATA[${article.description}]]></description>
      <category>${article.category}</category>
      ${article.image ? `<enclosure url="${article.image.startsWith('/') ? baseUrl + article.image : article.image}" type="image/jpeg"/>` : ''}
    </item>`).join('')}
  </channel>
</rss>`;
}
