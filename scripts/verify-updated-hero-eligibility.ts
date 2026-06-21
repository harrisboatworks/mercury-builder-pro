#!/usr/bin/env bun
/**
 * Verify that every recently-updated blog article:
 *   1) is sitemap-eligible (isArticleSitemapEligible === true)
 *   2) has a hero image file that exists on disk
 *   3) is NOT using a STUB_FALLBACK_HEROES image (blocked)
 *
 * Exits non-zero if any check fails.
 *
 * Usage:
 *   bun scripts/verify-updated-hero-eligibility.ts
 *   bun scripts/verify-updated-hero-eligibility.ts slug-a slug-b ...
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { blogArticles, isArticleSitemapEligible } from '../src/data/blogArticles';
import { frenchBlogArticles } from '../src/data/frenchBlogArticles';
import { spanishBlogArticles } from '../src/data/spanishBlogArticles';

// Default set: the 6 hero swaps from the last batch update.
const DEFAULT_SLUGS = [
  'mercury-7-year-warranty-hbw-exclusive-explained',
  'best-mercury-outboard-lake-simcoe-walleye-fishing',
  'lake-ontario-salmon-mercury-setup-guide-2026',
  'mercury-boost-software-upgrade-eligibility-2026',
  'hivernisation-moteur-mercury-ontario',
  'licencia-navegacion-ontario-regulaciones',
];

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_SLUGS;

// Combined pool across languages. The English helper isArticleSitemapEligible
// only inspects publishDate + STUB_FALLBACK_HEROES, so it is safe to reuse for
// FR/ES entries (they share the BlogArticle shape).
const pool = [
  ...blogArticles.map((a) => ({ a, file: 'src/data/blogArticles.ts' })),
  ...frenchBlogArticles.map((a) => ({ a, file: 'src/data/frenchBlogArticles.ts' })),
  ...spanishBlogArticles.map((a) => ({ a, file: 'src/data/spanishBlogArticles.ts' })),
];

const publicDir = resolve(process.cwd(), 'public');
const failures: string[] = [];
const rows: Array<Record<string, string>> = [];

for (const slug of slugs) {
  const hit = pool.find(({ a }) => a.slug === slug);
  if (!hit) {
    failures.push(`MISSING ARTICLE: slug "${slug}" not found in any data file`);
    rows.push({ slug, file: '-', image: '-', eligible: '-', fileExists: '-' });
    continue;
  }
  const { a, file } = hit;
  const image = a.image ?? '';
  const eligible = isArticleSitemapEligible(a);
  const onDisk = image.startsWith('/') ? existsSync(resolve(publicDir, image.slice(1))) : false;

  if (!eligible) failures.push(`NOT ELIGIBLE: ${slug} (image=${image || '<none>'}) in ${file}`);
  if (!image) failures.push(`NO IMAGE: ${slug} in ${file}`);
  else if (!onDisk) failures.push(`HERO FILE MISSING: ${slug} -> ${image}`);

  rows.push({
    slug,
    file,
    image: image || '<none>',
    eligible: String(eligible),
    fileExists: image ? String(onDisk) : '-',
  });
}

console.table(rows);

if (failures.length) {
  console.error(`\n❌ ${failures.length} failure(s):`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}

console.log(`\n✅ All ${slugs.length} article(s) sitemap-eligible with hero files present.`);
