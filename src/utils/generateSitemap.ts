import { blogArticles, isArticlePublished } from '../data/blogArticles';

const BASE_URL = 'https://quote.harrisboatworks.ca';

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  image?: {
    url: string;
    title?: string;
  };
}

// Static pages with their metadata
const getStaticPages = (): SitemapEntry[] => {
  const today = new Date().toISOString().split('T')[0];
  return [
    { loc: '/', lastmod: today, changefreq: 'daily', priority: 1.0 },
    { loc: '/quote/motor-selection', lastmod: today, changefreq: 'daily', priority: 0.9 },
    { loc: '/promotions', lastmod: today, changefreq: 'weekly', priority: 0.8 },
    { loc: '/repower', lastmod: today, changefreq: 'monthly', priority: 0.9 },
    { loc: '/financing-application', lastmod: today, changefreq: 'monthly', priority: 0.7 },
    { loc: '/finance-calculator', lastmod: today, changefreq: 'monthly', priority: 0.7 },
    { loc: '/contact', lastmod: today, changefreq: 'monthly', priority: 0.6 },
    { loc: '/about', lastmod: today, changefreq: 'monthly', priority: 0.8 },
    { loc: '/blog', lastmod: today, changefreq: 'weekly', priority: 0.8 },
  ];
};

export function generateSitemapXML(): string {
  // Get published blog articles
  const publishedArticles = blogArticles.filter(isArticlePublished);
  
  // Convert blog articles to sitemap entries with images
  const blogEntries: SitemapEntry[] = publishedArticles.map(article => ({
    loc: `/blog/${article.slug}`,
    lastmod: article.dateModified || article.datePublished,
    changefreq: 'monthly' as const,
    priority: 0.7,
    image: article.image ? {
      url: article.image.startsWith('/') ? `${BASE_URL}${article.image}` : article.image,
      title: article.title
    } : undefined
  }));
  
  // Combine all entries
  const allEntries = [...getStaticPages(), ...blogEntries];
  
  // Generate XML with image namespace
  const urlEntries = allEntries.map(entry => {
    let xml = `  <url>
    <loc>${BASE_URL}${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>`;
    
    if (entry.image) {
      xml += `
    <image:image>
      <image:loc>${entry.image.url}</image:loc>
      ${entry.image.title ? `<image:title><![CDATA[${entry.image.title}]]></image:title>` : ''}
    </image:image>`;
    }
    
    xml += `
  </url>`;
    return xml;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
}

// Generate RSS feed XML
export function generateRssXML(): string {
  const publishedArticles = blogArticles
    .filter(isArticlePublished)
    .sort((a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime());

  const lastBuildDate = publishedArticles[0] 
    ? new Date(publishedArticles[0].dateModified || publishedArticles[0].datePublished).toUTCString()
    : new Date().toUTCString();

  const items = publishedArticles.map(article => {
    const imageUrl = article.image.startsWith('/') 
      ? `${BASE_URL}${article.image}` 
      : article.image;
    
    return `    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${BASE_URL}/blog/${article.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${article.slug}</guid>
      <pubDate>${new Date(article.datePublished).toUTCString()}</pubDate>
      <description><![CDATA[${article.description}]]></description>
      <category>${article.category}</category>
      <enclosure url="${imageUrl}" type="image/png"/>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Harris Boat Works Blog</title>
    <link>${BASE_URL}/blog</link>
    <description>Expert advice on Mercury outboard motors from Ontario's trusted dealer since 1965. Guides, tips, and industry insights.</description>
    <language>en-ca</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/lovable-uploads/logo-dark.png</url>
      <title>Harris Boat Works Blog</title>
      <link>${BASE_URL}/blog</link>
    </image>
${items}
  </channel>
</rss>`;
}

// Export for use in components if needed
export function getSitemapEntries() {
  const publishedArticles = blogArticles.filter(isArticlePublished);
  return {
    staticPages: getStaticPages(),
    blogPages: publishedArticles.map(article => ({
      loc: `/blog/${article.slug}`,
      lastmod: article.dateModified || article.datePublished,
      title: article.title
    }))
  };
}
