import { blogArticles, isArticlePublished } from '../data/blogArticles';

const BASE_URL = 'https://quote.harrisboatworks.ca';

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
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
  
  // Convert blog articles to sitemap entries
  const blogEntries: SitemapEntry[] = publishedArticles.map(article => ({
    loc: `/blog/${article.slug}`,
    lastmod: article.dateModified || article.datePublished,
    changefreq: 'monthly' as const,
    priority: 0.7
  }));
  
  // Combine all entries
  const allEntries = [...getStaticPages(), ...blogEntries];
  
  // Generate XML
  const urlEntries = allEntries.map(entry => `  <url>
    <loc>${BASE_URL}${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
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
