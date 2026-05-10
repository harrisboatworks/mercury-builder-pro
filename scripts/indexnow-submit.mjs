// scripts/indexnow-submit.mjs
// Pings IndexNow API after build so Bing (and ChatGPT/Copilot/Perplexity which use Bing)
// discovers new content in minutes instead of waiting for the next crawl.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sitemapPath = path.resolve(__dirname, '../dist/sitemap.xml');
const HOST = 'mercuryrepower.ca';
const KEY = 'a7b3c9e2f1d8b4a6c5e9f2a8b7d3c1e6';
const KEY_LOCATION = `https://${HOST}/indexnow-key.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

async function submitToIndexNow() {
  if (!fs.existsSync(sitemapPath)) {
    console.warn('[indexnow] sitemap.xml not found at', sitemapPath, '— skipping');
    return;
  }

  const xml = fs.readFileSync(sitemapPath, 'utf-8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  if (urls.length === 0) {
    console.warn('[indexnow] no URLs found in sitemap — skipping');
    return;
  }

  // IndexNow accepts up to 10,000 URLs per submission
  console.log(`[indexnow] submitting ${urls.length} URLs to IndexNow…`);

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
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
      console.log(`[indexnow] ✓ submitted ${urls.length} URLs (status ${response.status})`);
    } else {
      const text = await response.text();
      console.error(`[indexnow] ✗ status ${response.status}: ${text}`);
    }
  } catch (err) {
    console.error('[indexnow] submission failed:', err.message);
    // Non-fatal — don't break the build
  }
}

submitToIndexNow();
