import { blogArticles, isArticlePublished, isArticleSitemapEligible } from '../data/blogArticles';
import { frenchBlogArticles } from '../data/frenchBlogArticles';
import { koreanBlogArticles } from '../data/koreanBlogArticles';
import { mandarinBlogArticles } from '../data/mandarinBlogArticles';
import { spanishBlogArticles } from '../data/spanishBlogArticles';
import { caseStudies } from '../data/caseStudies';
import { locations } from '../data/locations';

// Multilingual blog index pages and standalone hardcoded translated posts.
// Translated posts are emitted at /blog/{lang}/{slug} with a lower priority than
// English (English is the canonical surface; translated posts are alternates).
const MULTILINGUAL_PRIORITY = 0.6;

// Hardcoded translated pages list intentionally empty — every translated
// post is enumerated via the *BlogArticles data sources below. Adding
// the same slug here caused duplicate <url> entries in sitemap.xml.
const HARDCODED_TRANSLATED_PAGES: Array<{ loc: string }> = [];

function buildMultilingualBlogEntries(today: string): SitemapEntry[] {
  const sets: Array<{ lang: string; articles: typeof blogArticles }> = [
    { lang: 'fr', articles: frenchBlogArticles },
    { lang: 'ko', articles: koreanBlogArticles },
    { lang: 'zh', articles: mandarinBlogArticles },
    { lang: 'es', articles: spanishBlogArticles },
  ];
  const entries: SitemapEntry[] = sets.flatMap(({ lang, articles }) =>
    articles.map((a) => ({
      loc: `/blog/${lang}/${a.slug}`,
      lastmod:
        a.publishDate ||
        a.dateModified ||
        a.datePublished ||
        today,
      changefreq: 'monthly' as const,
      priority: MULTILINGUAL_PRIORITY,
    })),
  );
  for (const page of HARDCODED_TRANSLATED_PAGES) {
    entries.push({
      loc: page.loc,
      lastmod: today,
      changefreq: 'monthly',
      priority: MULTILINGUAL_PRIORITY,
    });
  }
  return entries;
}

const BASE_URL = 'https://www.mercuryrepower.ca';

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

// Read vercel.json redirect-source pathnames so the sitemap can exclude any
// URL that immediately 301s. GSC flags those as "Sitemap URLs that redirect".
// Only runs at build/dev time (Node context). Wildcards / host-scoped entries
// are skipped since they don't represent concrete page paths.
let _redirectSources: Set<string> | null = null;
function getRedirectSourcePaths(): Set<string> {
  if (_redirectSources) return _redirectSources;
  const set = new Set<string>();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const raw = fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf8');
    const cfg = JSON.parse(raw) as { redirects?: Array<{ source: string; has?: unknown }> };
    for (const r of cfg.redirects ?? []) {
      if (!r.source || r.has) continue; // skip host-scoped rules
      if (r.source.includes(':') || r.source.includes('*')) continue; // skip patterns
      set.add(r.source);
    }
  } catch {
    // running outside Node (shouldn't happen) — return empty set, no filtering
  }
  _redirectSources = set;
  return set;
}

function notRedirected(entry: SitemapEntry): boolean {
  return !getRedirectSourcePaths().has(entry.loc);
}


// Static pages with their metadata
const getStaticPages = (): SitemapEntry[] => {
  const today = new Date().toISOString().split('T')[0];
  return [
    { loc: '/', lastmod: today, changefreq: 'daily', priority: 1.0 },
    { loc: '/quote/motor-selection', lastmod: today, changefreq: 'daily', priority: 0.9 },
    { loc: '/promotions', lastmod: today, changefreq: 'weekly', priority: 0.8 },
    { loc: '/repower', lastmod: today, changefreq: 'monthly', priority: 0.9 },
    { loc: '/repower/cost', lastmod: today, changefreq: 'monthly', priority: 0.85 },
    { loc: '/repower/process', lastmod: today, changefreq: 'monthly', priority: 0.85 },
    { loc: '/repower/financing', lastmod: today, changefreq: 'monthly', priority: 0.85 },
    { loc: '/repower/trade-in', lastmod: today, changefreq: 'monthly', priority: 0.85 },
    { loc: '/trade-in-value', lastmod: today, changefreq: 'weekly', priority: 0.8 },
    { loc: '/accessories', lastmod: today, changefreq: 'weekly', priority: 0.7 },
    { loc: '/compare', lastmod: today, changefreq: 'weekly', priority: 0.7 },
    { loc: '/faq', lastmod: today, changefreq: 'monthly', priority: 0.8 },
    { loc: '/financing-application', lastmod: today, changefreq: 'monthly', priority: 0.7 },
    { loc: '/finance-calculator', lastmod: today, changefreq: 'monthly', priority: 0.7 },
    { loc: '/contact', lastmod: today, changefreq: 'monthly', priority: 0.6 },
    { loc: '/about', lastmod: today, changefreq: 'monthly', priority: 0.8 },
    { loc: '/about/jay-harris', lastmod: '2026-05-10', changefreq: 'yearly', priority: 0.7 },
    { loc: '/tools', lastmod: '2026-05-10', changefreq: 'monthly', priority: 0.8 },
    { loc: '/blog', lastmod: today, changefreq: 'weekly', priority: 0.8 },
    // Pilot SEO landing pages: Batch 1
    { loc: '/mercury-repower-faq', lastmod: today, changefreq: 'monthly', priority: 0.8 },
    { loc: '/how-to-repower-a-boat', lastmod: today, changefreq: 'monthly', priority: 0.8 },
    { loc: '/mercury-dealer-canada-faq', lastmod: today, changefreq: 'monthly', priority: 0.8 },
    // Geo landing pages now live under /locations/:slug, see locationEntries below.
    // Old /mercury-dealer-* URLs are kept as redirects in App.tsx (not in sitemap).
    // Pilot SEO landing pages: Batch 3 (Product hub + lineup)
    { loc: '/mercury-pro-xs', lastmod: today, changefreq: 'weekly', priority: 0.85 },
    { loc: '/mercury/pro-xs-250', lastmod: today, changefreq: 'weekly', priority: 0.85 },
    { loc: '/mercury/portable-9-20hp', lastmod: today, changefreq: 'weekly', priority: 0.85 },
    { loc: '/mercury/mid-range-40-60hp', lastmod: today, changefreq: 'weekly', priority: 0.85 },
    { loc: '/mercury/mid-power-90-115hp', lastmod: today, changefreq: 'weekly', priority: 0.85 },
    { loc: '/mercury-outboards-ontario', lastmod: today, changefreq: 'weekly', priority: 0.85 },
    // Pilot SEO landing pages: Batch 4 (Pontoon)
    { loc: '/mercury-pontoon-outboards', lastmod: today, changefreq: 'monthly', priority: 0.8 },
    // AI agent integration landing page
    { loc: '/agents', lastmod: today, changefreq: 'monthly', priority: 0.8 },
    { loc: '/privacy', lastmod: today, changefreq: 'yearly', priority: 0.3 },
    { loc: '/terms', lastmod: today, changefreq: 'yearly', priority: 0.3 },
  ];
};

export function generateSitemapXML(): string {
  // Include scheduled posts so Google discovers them ahead of publish date.
  // Page-level visibility gate (parseLocalDate) handles 200/404 at request time.
  const allArticles = blogArticles.filter(isArticleSitemapEligible);

  const blogEntries: SitemapEntry[] = allArticles.map(article => ({
    loc: `/blog/${article.slug}`,
    lastmod: article.publishDate || article.dateModified || article.datePublished,
    changefreq: 'monthly' as const,
    priority: 0.7,
    image: article.image ? {
      url: article.image.startsWith('/') ? `${BASE_URL}${article.image}` : article.image,
      title: article.title
    } : undefined
  }));
  
  const today = new Date().toISOString().split('T')[0];
  const multilingualEntries = buildMultilingualBlogEntries(today);

  const allEntries = [...getStaticPages(), ...blogEntries, ...multilingualEntries].filter(notRedirected);
  
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

// Build slug from model_key (same logic as ShareLinkButton)
function buildSlug(source: string): string {
  return source
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Fetch motor slugs from Supabase for sitemap generation.
// Mirrors the gate used by /motors/:slug (MotorPage.tsx): rows with
// availability='Exclude' return 404, so they must NOT appear in the sitemap.
// Also requires model_display so the rendered page has something to show
// (avoids redirect/empty pages).
export async function getMotorSitemapEntries(): Promise<SitemapEntry[]> {
  try {
    const { supabase } = await import('../integrations/supabase/client');
    const { data: motors, error } = await supabase
      .from('motor_models')
      .select('model_key, model, model_display, updated_at, horsepower, availability')
      .not('model_key', 'is', null)
      .neq('availability', 'Exclude')
      .order('horsepower', { ascending: true });

    if (error || !motors) {
      console.warn('Failed to fetch motors for sitemap:', error);
      return [];
    }

    const today = new Date().toISOString().split('T')[0];

    return motors
      .filter(m => m.model_key && m.model_key.trim() !== '' && (m.model_display || m.model))
      .map(m => ({
        loc: `/motors/${buildSlug(m.model_key!)}`,
        lastmod: m.updated_at ? m.updated_at.split('T')[0] : today,
        changefreq: 'weekly' as const,
        priority: 0.7,
      }));
  } catch (err) {
    console.warn('Motor sitemap generation failed:', err);
    return [];
  }
}

// Generate full sitemap XML including motors (async version)
export async function generateFullSitemapXML(): Promise<string> {
  // Include scheduled posts so Google discovers them ahead of publish date.
  const allArticles = blogArticles.filter(isArticleSitemapEligible);

  const blogEntries: SitemapEntry[] = allArticles.map(article => ({
    loc: `/blog/${article.slug}`,
    lastmod: article.publishDate || article.dateModified || article.datePublished,
    changefreq: 'monthly' as const,
    priority: 0.7,
    image: article.image ? {
      url: article.image.startsWith('/') ? `${BASE_URL}${article.image}` : article.image,
      title: article.title
    } : undefined
  }));

  const motorEntries = await getMotorSitemapEntries();

  const today = new Date().toISOString().split('T')[0];
  const caseStudyEntries: SitemapEntry[] = [
    { loc: '/case-studies', lastmod: today, changefreq: 'monthly', priority: 0.8 },
    ...caseStudies.map((study) => ({
      loc: `/case-studies/${study.slug}`,
      lastmod: today,
      changefreq: 'monthly' as const,
      priority: 0.75,
      image: study.heroImage
        ? {
            url: study.heroImage.startsWith('/') ? `${BASE_URL}${study.heroImage}` : study.heroImage,
            title: study.title,
          }
        : undefined,
    })),
  ];

  const locationEntries: SitemapEntry[] = [
    { loc: '/locations', lastmod: today, changefreq: 'monthly', priority: 0.8 },
    ...locations.map((loc) => ({
      loc: `/locations/${loc.slug}`,
      lastmod: today,
      changefreq: 'monthly' as const,
      priority: 0.8,
    })),
  ];

  const multilingualEntries = buildMultilingualBlogEntries(today);

  const allEntries = [...getStaticPages(), ...blogEntries, ...multilingualEntries, ...motorEntries, ...caseStudyEntries, ...locationEntries].filter(notRedirected);
  
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
