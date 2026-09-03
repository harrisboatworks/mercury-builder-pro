import fs from 'node:fs';
import { blogArticles } from '../src/data/blogArticles';
import { frenchBlogArticles } from '../src/data/frenchBlogArticles';
import { koreanBlogArticles } from '../src/data/koreanBlogArticles';
import { mandarinBlogArticles } from '../src/data/mandarinBlogArticles';
import { spanishBlogArticles } from '../src/data/spanishBlogArticles';
import { punjabiBlogArticles } from '../src/data/punjabiBlogArticles';
import { urduBlogArticles } from '../src/data/urduBlogArticles';
import { tagalogBlogArticles } from '../src/data/tagalogBlogArticles';
import { hindiBlogArticles } from '../src/data/hindiBlogArticles';
import vercelConfig from '../vercel.json';
import {
  BLOG_TRANSLATION_GROUPS,
  BLOG_LOCALES,
  getBlogHreflangAlternates,
} from '../src/data/blogI18nRegistry.js';

const routeSets: Record<string, Set<string>> = {
  en: new Set(blogArticles.map((article) => article.slug)),
  fr: new Set([
    ...frenchBlogArticles.map((article) => article.slug),
    'concessionnaire-mercury-premier-ontario',
  ]),
  ko: new Set(koreanBlogArticles.map((article) => article.slug)),
  zh: new Set(mandarinBlogArticles.map((article) => article.slug)),
  es: new Set(spanishBlogArticles.map((article) => article.slug)),
  pa: new Set(punjabiBlogArticles.map((article) => article.slug)),
  ur: new Set(urduBlogArticles.map((article) => article.slug)),
  tl: new Set(tagalogBlogArticles.map((article) => article.slug)),
  hi: new Set(hindiBlogArticles.map((article) => article.slug)),
};

const failures: string[] = [];
const registered = new Set<string>();
const redirectSources = new Set(
  (vercelConfig.redirects || []).map((redirect) => redirect.source.replace(/\.md$/, '')),
);
const sitemapXml = fs.readFileSync('public/sitemap.xml', 'utf8');
const sitemapEntries = new Map<
  string,
  { lastmod: string | null; alternates: Array<{ hrefLang: string; path: string }> }
>();

for (const match of sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const block = match[1];
  const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
  if (!loc) continue;

  const alternates = [...block.matchAll(
    /<xhtml:link\b[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"[^>]*\/>/g,
  )].map((alternate) => ({
    hrefLang: alternate[1],
    path: new URL(alternate[2]).pathname,
  }));
  sitemapEntries.set(new URL(loc).pathname, {
    lastmod: block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] || null,
    alternates,
  });
}

const localizedPageFiles = [
  'FrenchBlogArticlePage.tsx',
  'HindiBlogArticlePage.tsx',
  'KoreanBlogArticlePage.tsx',
  'MandarinBlogArticlePage.tsx',
  'PunjabiBlogArticlePage.tsx',
  'SpanishBlogArticlePage.tsx',
  'TagalogBlogArticlePage.tsx',
  'UrduBlogArticlePage.tsx',
];

const hreflangComponent = fs.readFileSync('src/components/seo/BlogHreflangLinks.tsx', 'utf8');
if (!/<Helmet>[\s\S]*<link[\s\S]*<\/Helmet>/.test(hreflangComponent)) {
  failures.push('BlogHreflangLinks must own its Helmet boundary');
}
for (const file of localizedPageFiles) {
  const source = fs.readFileSync(`src/pages/blog/${file}`, 'utf8');
  const useIndex = source.indexOf('<BlogHreflangLinks');
  const helmetCloseIndex = source.indexOf('</Helmet>');
  if (useIndex === -1 || helmetCloseIndex === -1 || useIndex < helmetCloseIndex) {
    failures.push(`${file}: BlogHreflangLinks must render beside, not inside, the page Helmet`);
  }
}

for (const group of BLOG_TRANSLATION_GROUPS) {
  for (const [locale, slug] of Object.entries(group)) {
    const routeKey = `${locale}:${slug}`;
    registered.add(routeKey);
    if (!routeSets[locale]?.has(slug)) failures.push(`${routeKey}: route does not exist`);
    const routePath = `${BLOG_LOCALES[locale].prefix}/${slug}`;
    if (redirectSources.has(routePath)) failures.push(`${routeKey}: route is a redirect source`);

    const alternates = getBlogHreflangAlternates(locale, slug);
    const hrefLangs = alternates.map((alternate) => alternate.hrefLang);
    if (new Set(hrefLangs).size !== hrefLangs.length) {
      failures.push(`${routeKey}: duplicate language in hreflang set`);
    }

    const english = alternates.find((alternate) => alternate.hrefLang === 'en-CA');
    const xDefault = alternates.find((alternate) => alternate.hrefLang === 'x-default');
    if (!xDefault) {
      failures.push(`${routeKey}: missing x-default`);
    } else if (english && english.path !== xDefault.path) {
      failures.push(`${routeKey}: x-default must equal the English route`);
    }
    const self = alternates.find((alternate) => alternate.hrefLang === BLOG_LOCALES[locale].hrefLang);
    if (english && locale !== 'en' && self && xDefault?.path === self.path) {
      failures.push(`${routeKey}: localized route must not be its own x-default`);
    }

    for (const [siblingLocale, siblingSlug] of Object.entries(group)) {
      const siblingAlternates = getBlogHreflangAlternates(siblingLocale, siblingSlug);
      if (JSON.stringify(siblingAlternates) !== JSON.stringify(alternates)) {
        failures.push(`${routeKey}: sibling ${siblingLocale}:${siblingSlug} is not reciprocal`);
      }
    }
  }
}

for (const [locale, slugs] of Object.entries(routeSets)) {
  if (locale === 'en') continue;
  for (const slug of slugs) {
    if (!registered.has(`${locale}:${slug}`)) failures.push(`${locale}:${slug}: missing from registry`);
  }
}

const sitemapRegistryLocks = [
  {
    locale: 'en',
    slug: 'ethanol-octane-mercury-outboard-fuel-guide-ontario',
    article: blogArticles.find(
      (article) => article.slug === 'ethanol-octane-mercury-outboard-fuel-guide-ontario',
    ),
  },
  {
    locale: 'zh',
    slug: 'mercury-fuel-octane-ethanol-chinese-guide',
    article: mandarinBlogArticles.find(
      (article) => article.slug === 'mercury-fuel-octane-ethanol-chinese-guide',
    ),
  },
];

for (const { locale, slug, article } of sitemapRegistryLocks) {
  const routeKey = `${locale}:${slug}`;
  const routePath = `${BLOG_LOCALES[locale].prefix}/${slug}`;
  const expectedAlternates = getBlogHreflangAlternates(locale, slug);
  const expectedLastmod = article?.dateModified || article?.datePublished;
  const sitemapEntry = sitemapEntries.get(routePath);
  if (!expectedLastmod) {
    failures.push(`${routeKey}: source article is missing a sitemap lastmod date`);
    continue;
  }
  if (!sitemapEntry) {
    failures.push(`${routeKey}: route is missing from public/sitemap.xml`);
    continue;
  }
  if (sitemapEntry.lastmod !== expectedLastmod) {
    failures.push(
      `${routeKey}: sitemap lastmod must be ${expectedLastmod}, got ${sitemapEntry.lastmod}`,
    );
  }
  if (JSON.stringify(sitemapEntry.alternates) !== JSON.stringify(expectedAlternates)) {
    failures.push(
      `${routeKey}: sitemap alternates do not match the registry ` +
        `(expected ${JSON.stringify(expectedAlternates)}, got ${JSON.stringify(sitemapEntry.alternates)})`,
    );
  }
}

if (failures.length) {
  console.error('Blog hreflang registry check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Blog hreflang registry passed: ${BLOG_TRANSLATION_GROUPS.length} reciprocal groups cover ` +
    `${[...registered].filter((route) => !route.startsWith('en:')).length} localized routes.`,
);
