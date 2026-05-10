// scripts/indexnow-submit.mjs
// Build-time IndexNow ping — runs after static-prerender writes the sitemap.
// Uses the same key + host as supabase/functions/_shared/indexnow.ts so all
// IndexNow submissions (build-time + Supabase event-driven) share one identity.
// Skips .md twin routes (those carry X-Robots-Tag: noindex).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sitemapPath = path.resolve(__dirname, '../dist/sitemap.xml');

// MUST match supabase/functions/_shared/indexnow.ts
const HOST = 'www.mercuryrepower.ca';
const SITE = `https://${HOST}`;
const KEY = '03999430e4bae3d7d7be108f62646dbf';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

function normalize(u) {
  try {
    const parsed = new URL(u, SITE);
    parsed.host = HOST;
    parsed.protocol = 'https:';
    if (parsed.pathname.endsWith('.md')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

async function submitToIndexNow() {
  if (!fs.existsSync(sitemapPath)) {
    console.warn('[indexnow:build] sitemap.xml not found at', sitemapPath, '— skipping');
    return;
  }

  const xml = fs.readFileSync(sitemapPath, 'utf-8');
  const rawUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const urls = Array.from(
    new Set(rawUrls.map(normalize).filter((u) => !!u))
  ).slice(0, 10000);

  if (urls.length === 0) {
    console.warn('[indexnow:build] no valid URLs found, skipping');
    return;
  }

  console.log(`[indexnow:build] submitting ${urls.length} URLs (key ${KEY.slice(0, 8)}…)`);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList: urls,
      }),
    });

    if (response.ok || response.status === 202) {
      console.log(`[indexnow:build] ✓ submitted ${urls.length} URLs → ${response.status}`);
    } else {
      const text = await response.text();
      console.error(`[indexnow:build] ✗ status ${response.status}: ${text}`);
    }
  } catch (err) {
    console.error('[indexnow:build] submission failed:', err.message);
    // Non-fatal — don't break the build
  }
}

submitToIndexNow();
