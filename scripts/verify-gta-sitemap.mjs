#!/usr/bin/env node
/**
 * Verifies the 7 GTA-cluster posts (pulled to past dates) are:
 *   1) Present in public/sitemap.xml
 *   2) Reachable (HTTP 200) at the target host
 *
 * Usage:
 *   node scripts/verify-gta-sitemap.mjs                  # checks production
 *   HOST=https://mercury-quote-tool.lovable.app node scripts/verify-gta-sitemap.mjs
 *
 * Exits non-zero on any failure. Safe to wire as a pre-publish gate.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITEMAP_PATH = resolve(__dirname, '../public/sitemap.xml');
const HOST = (process.env.HOST || 'https://www.mercuryrepower.ca').replace(/\/$/, '');

const POSTS = [
  'mercury-outboard-dealer-toronto-why-drive-to-hbw',
  'best-mercury-dealer-ontario-hbw-difference',
  'boat-service-near-toronto-hbw-reach',
  'rice-lake-boat-rentals-from-toronto-gta',
  'winter-storage-near-toronto-hbw',
  'harris-boat-works-since-1947-rice-lake-institution',
  'mercury-repower-gta-toronto-destination',
];

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
}
function ok(msg) {
  console.log(`✓ ${msg}`);
}

// 1) Sitemap presence
if (!existsSync(SITEMAP_PATH)) {
  fail(`sitemap.xml not found at ${SITEMAP_PATH} — run \`npx tsx scripts/generate-sitemap.ts\` first`);
  process.exit(1);
}
const sitemap = readFileSync(SITEMAP_PATH, 'utf8');

const missing = POSTS.filter((slug) => !sitemap.includes(`/blog/${slug}`));
if (missing.length) {
  missing.forEach((s) => fail(`sitemap missing /blog/${s}`));
} else {
  ok(`all ${POSTS.length} posts present in sitemap.xml`);
}

// 2) HTTP 200 at HOST
console.log(`\nChecking HTTP status at ${HOST}...`);
const results = await Promise.all(
  POSTS.map(async (slug) => {
    const url = `${HOST}/blog/${slug}`;
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      return { slug, url, status: res.status };
    } catch (err) {
      return { slug, url, status: 0, error: err.message };
    }
  })
);

for (const r of results) {
  if (r.status === 200) ok(`200 ${r.url}`);
  else fail(`${r.status || 'ERR'} ${r.url}${r.error ? ` (${r.error})` : ''}`);
}

if (process.exitCode) {
  console.error('\nVerification FAILED. Do not publish.');
  process.exit(process.exitCode);
}
console.log('\nVerification PASSED. Safe to publish.');
