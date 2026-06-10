// scripts/indexnow-ping.mjs
// Post-build IndexNow ping for PRODUCTION Vercel deploys only.
//
// Runs as the npm "postbuild" hook, after scripts/static-prerender.mjs has
// written dist/sitemap.xml with accurate per-URL lastmod values
// (lastmod = dateModified, falling back to datePublished, for blog articles).
//
// Behavior:
//   - Silently exits 0 unless process.env.VERCEL_ENV === 'production'
//     (covers local builds and Lovable preview builds).
//   - Collects sitemap URLs whose <lastmod> is within the last 3 days,
//     always including the homepage and /pricing-reference (both are
//     prerendered every build). Capped at 100 URLs per run.
//   - Skips .md twin routes (they carry X-Robots-Tag: noindex).
//   - Never fails the build: everything is wrapped in try/catch, one-line
//     summary log, exit code is always 0.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HOST = 'www.mercuryrepower.ca';
const SITE = `https://${HOST}`;
const KEY = '49bc7cd00f19df4a2f94c8d0b3d227a9';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const USER_AGENT = `mercuryrepower-indexnow/1.0 (+${SITE})`;

const FRESH_WINDOW_DAYS = 3;
const MAX_URLS = 100;
const TIMEOUT_MS = Number(process.env.INDEXNOW_TIMEOUT_MS || 8000);

function normalize(raw) {
  try {
    const u = new URL(raw, SITE);
    u.protocol = 'https:';
    u.host = HOST;
    if (u.pathname.endsWith('.md')) return null; // noindex twins
    return u.toString();
  } catch {
    return null;
  }
}

async function main() {
  if (process.env.VERCEL_ENV !== 'production') {
    return; // silent no-op for local + preview builds
  }

  try {
    const distDir = path.resolve(__dirname, '../dist');
    const sitemapPath = path.join(distDir, 'sitemap.xml');

    if (!fs.existsSync(sitemapPath)) {
      console.log('[indexnow-ping] dist/sitemap.xml not found; nothing submitted');
      return;
    }

    const xml = fs.readFileSync(sitemapPath, 'utf-8');
    const cutoff = Date.now() - FRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    const urls = new Set();

    // Homepage + /pricing-reference: always ping when this build generated them.
    if (fs.existsSync(path.join(distDir, 'index.html'))) {
      urls.add(`${SITE}/`);
    }
    if (
      fs.existsSync(path.join(distDir, 'pricing-reference', 'index.html')) ||
      fs.existsSync(path.join(distDir, 'pricing-reference.html'))
    ) {
      urls.add(`${SITE}/pricing-reference`);
    }

    for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
      if (urls.size >= MAX_URLS) break;
      const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim();
      const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim();
      if (!loc || !lastmod) continue;
      const ts = Date.parse(lastmod);
      if (!Number.isFinite(ts) || ts < cutoff) continue;
      const normalized = normalize(loc);
      if (normalized) urls.add(normalized);
    }

    const urlList = Array.from(urls).slice(0, MAX_URLS);

    if (urlList.length === 0) {
      console.log('[indexnow-ping] no fresh URLs within the last 3 days; nothing submitted');
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let status = 'n/a';
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': USER_AGENT,
        },
        body: JSON.stringify({
          host: HOST,
          key: KEY,
          keyLocation: KEY_LOCATION,
          urlList,
        }),
        signal: controller.signal,
      });
      status = String(res.status);
    } finally {
      clearTimeout(timer);
    }

    console.log(`[indexnow-ping] submitted ${urlList.length} URLs -> HTTP ${status}`);
  } catch (err) {
    console.log(`[indexnow-ping] skipped after error: ${err?.message || err}`);
  }
}

main().finally(() => process.exit(0));
