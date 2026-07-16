import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT = join(ROOT, 'public', 'rss.xml');
const SITE_URL = 'https://www.mercuryrepower.ca';
const FEED_LIMIT = 50;
const TSX_BIN = join(
  ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
);

function loadPublishedArticles() {
  const dumpScript = `
    import { blogArticles, isArticlePublished } from '../src/data/blogArticles.ts';
    import { getCleanDescription } from '../src/lib/strip-markdown.ts';
    const items = blogArticles
      .filter(isArticlePublished)
      .map((article) => ({
        slug: article.slug,
        title: article.title,
        description: getCleanDescription(article),
        category: article.category,
        publishDate: article.publishDate || article.datePublished,
      }));
    process.stdout.write(JSON.stringify(items));
  `;
  const tmpFile = join(ROOT, 'scripts', '.rss-blog-dump.mts');
  writeFileSync(tmpFile, dumpScript);
  try {
    return JSON.parse(execFileSync(TSX_BIN, [tmpFile], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      timeout: Number(process.env.BUILD_SUBPROCESS_TIMEOUT_MS || 30000),
    }));
  } finally {
    try { rmSync(tmpFile); } catch {}
  }
}

function cdata(value = '') {
  return `<![CDATA[${String(value).replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
}

function xmlText(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function rssDate(ymd) {
  return new Date(`${ymd}T12:00:00Z`).toUTCString();
}

function renderItem(article) {
  const url = `${SITE_URL}/blog/${article.slug}`;

  return `    <item>
      <title>${cdata(article.title)}</title>
      <link>${xmlText(url)}</link>
      <guid isPermaLink="true">${xmlText(url)}</guid>
      <pubDate>${rssDate(article.publishDate)}</pubDate>
      <description>${cdata(article.description)}</description>
      <category>${cdata(article.category)}</category>
    </item>`;
}

function renderFeed(articles) {
  const published = articles
    .filter((article) => article.slug && article.publishDate)
    .sort((a, b) => {
      const dateOrder = b.publishDate.localeCompare(a.publishDate);
      return dateOrder || a.slug.localeCompare(b.slug);
    })
    .slice(0, FEED_LIMIT);

  if (published.length === 0) {
    throw new Error('[rss] No published blog articles were available.');
  }

  const items = published.map(renderItem).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Harris Boat Works Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Expert advice on Mercury outboard motors from Ontario's trusted dealer since 1965. Guides, tips, and industry insights.</description>
    <language>en-ca</language>
    <lastBuildDate>${rssDate(published[0].publishDate)}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/lovable-uploads/logo-dark.png</url>
      <title>Harris Boat Works Blog</title>
      <link>${SITE_URL}/blog</link>
    </image>
${items}
  </channel>
</rss>
`;
}

const output = renderFeed(loadPublishedArticles());

if (process.argv.includes('--check')) {
  const existing = readFileSync(OUTPUT, 'utf8');
  if (existing !== output) {
    console.error('[rss] public/rss.xml is stale. Run npm run generate:rss.');
    process.exit(1);
  }
  console.log('[rss] public/rss.xml is current.');
} else {
  writeFileSync(OUTPUT, output);
  const itemCount = output.match(/<item>/g)?.length || 0;
  console.log(`[rss] wrote ${OUTPUT} with ${itemCount} latest published articles.`);
}
