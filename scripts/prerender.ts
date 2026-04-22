/**
 * Build-time prerender for crawler-friendly HTML.
 *
 * Spins up a static server against ./dist, navigates puppeteer to each
 * key public route, waits for React Helmet + JSON-LD to populate <head>,
 * then writes the fully-hydrated HTML to dist/{route}/index.html.
 *
 * Crawlers that don't run JS (Meta-ExternalAgent, some citation bots,
 * social previews) get real content instead of an empty <div id="root">.
 */
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { createServer } from 'http';
import sirv from 'sirv';
import puppeteer from 'puppeteer';

const DIST = resolve(process.cwd(), 'dist');
const PORT = 4173;

const ROUTES = [
  '/',
  '/repower',
  '/faq',
  '/about',
  '/contact',
  '/blog',
  '/agents',
  '/quote/motor-selection',
];

async function main() {
  if (!existsSync(DIST)) {
    console.warn('[prerender] dist/ not found — skipping');
    return;
  }

  const handler = sirv(DIST, {
    single: true, // SPA fallback
    dev: false,
    etag: false,
  });
  const server = createServer((req, res) => handler(req, res));
  await new Promise<void>((r) => server.listen(PORT, r));
  console.log(`[prerender] static server on :${PORT}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const route of ROUTES) {
      const url = `http://localhost:${PORT}${route}`;
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (compatible; LovablePrerender/1.0; +https://mercuryrepower.ca)'
      );
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 });
        // Wait for at least one JSON-LD script (means Helmet hydrated)
        await page
          .waitForSelector('script[type="application/ld+json"]', { timeout: 10_000 })
          .catch(() => {});
        // Small settle for any late helmet updates
        await new Promise((r) => setTimeout(r, 500));

        const html = await page.content();

        // Sanity check
        if (!html.includes('Harris Boat Works') && !html.includes('Mercury')) {
          console.warn(`[prerender] WARN ${route}: brand string missing in output`);
        }

        // Write to dist/{route}/index.html
        const outDir =
          route === '/'
            ? DIST
            : join(DIST, route.replace(/^\//, ''));
        if (route !== '/') mkdirSync(outDir, { recursive: true });
        const outFile = join(outDir, 'index.html');
        writeFileSync(outFile, html, 'utf8');
        console.log(`[prerender] ✓ ${route} → ${outFile.replace(DIST, 'dist')} (${(html.length / 1024).toFixed(1)} KB)`);
      } catch (err) {
        console.error(`[prerender] FAIL ${route}:`, (err as Error).message);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('[prerender] fatal:', err);
  process.exit(1);
});
