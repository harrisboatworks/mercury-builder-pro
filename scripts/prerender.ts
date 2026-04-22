/**
 * Build-time prerender for crawler-friendly HTML.
 *
 * Spins up a static server against ./dist, navigates a headless Chromium to
 * each key public route, waits for React Helmet + JSON-LD to populate <head>,
 * then writes the fully-hydrated HTML to dist/{route}/index.html.
 *
 * Crawlers that don't run JS (Meta-ExternalAgent, some citation bots,
 * social previews) get real content instead of an empty <div id="root">.
 *
 * Chromium resolution:
 *   1. PUPPETEER_EXECUTABLE_PATH (explicit override)
 *   2. @sparticuz/chromium (bundled, works on Vercel build containers)
 *   3. System Chrome at common dev paths (local fallback)
 *
 * Exit codes:
 *   0 — all routes prerendered successfully
 *   1 — chromium failed to launch OR a required route failed
 *       (vite plugin escalates this to a build failure when STRICT_PRERENDER=1)
 */
import { mkdirSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { createServer } from 'http';
import sirv from 'sirv';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const DIST = resolve(process.cwd(), 'dist');
const PORT = 4173;
const MIN_BYTES = 50 * 1024; // 50 KB — anything smaller is almost certainly an unhydrated SPA shell

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

async function resolveExecutablePath(): Promise<string> {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  try {
    const p = await chromium.executablePath();
    if (p) return p;
  } catch (err) {
    console.warn('[prerender] @sparticuz/chromium executablePath failed:', (err as Error).message);
  }
  // Local-dev fallbacks
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    'No Chromium executable found. Set PUPPETEER_EXECUTABLE_PATH or install Chrome locally.'
  );
}

async function main() {
  if (!existsSync(DIST)) {
    console.warn('[prerender] dist/ not found — skipping');
    return;
  }

  const handler = sirv(DIST, { single: true, dev: false, etag: false });
  const server = createServer((req, res) => handler(req, res));
  await new Promise<void>((r) => server.listen(PORT, r));
  console.log(`[prerender] static server on :${PORT}`);

  let browser;
  try {
    const executablePath = await resolveExecutablePath();
    console.log(`[prerender] using chromium at: ${executablePath}`);
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      defaultViewport: { width: 1280, height: 800 },
    });
  } catch (err) {
    console.error('[prerender] FATAL: failed to launch Chromium:', (err as Error).message);
    server.close();
    process.exit(1);
  }

  const failures: string[] = [];

  try {
    for (const route of ROUTES) {
      const url = `http://localhost:${PORT}${route}`;
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (compatible; LovablePrerender/1.0; +https://mercuryrepower.ca)'
      );
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45_000 });
        await page
          .waitForFunction(
            () => {
              const scripts = document.querySelectorAll('script[type="application/ld+json"]');
              if (scripts.length === 0) return false;
              return Array.from(scripts).some((s) => (s.textContent || '').length > 200);
            },
            { timeout: 20_000 }
          )
          .catch(() => console.warn(`[prerender] WARN ${route}: JSON-LD wait timed out`));
        await new Promise((r) => setTimeout(r, 1500));

        const html = await page.content();

        if (!html.includes('Harris Boat Works') && !html.includes('Mercury')) {
          console.warn(`[prerender] WARN ${route}: brand string missing in output`);
        }

        const outDir = route === '/' ? DIST : join(DIST, route.replace(/^\//, ''));
        if (route !== '/') mkdirSync(outDir, { recursive: true });
        const outFile = join(outDir, 'index.html');
        writeFileSync(outFile, html, 'utf8');
        console.log(
          `[prerender] ✓ ${route} → ${outFile.replace(DIST, 'dist')} (${(html.length / 1024).toFixed(1)} KB)`
        );
      } catch (err) {
        console.error(`[prerender] FAIL ${route}:`, (err as Error).message);
        failures.push(route);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  // Post-render sanity check: every route must have produced a substantive file
  for (const route of ROUTES) {
    const outFile =
      route === '/'
        ? join(DIST, 'index.html')
        : join(DIST, route.replace(/^\//, ''), 'index.html');
    if (!existsSync(outFile)) {
      console.error(`[prerender] MISSING: ${outFile}`);
      failures.push(route);
      continue;
    }
    const size = statSync(outFile).size;
    if (size < MIN_BYTES) {
      console.error(
        `[prerender] TOO SMALL (${(size / 1024).toFixed(1)} KB < ${MIN_BYTES / 1024} KB): ${outFile}`
      );
      failures.push(route);
    }
  }

  if (failures.length > 0) {
    console.error(`[prerender] ${failures.length} route(s) failed sanity check: ${failures.join(', ')}`);
    process.exit(1);
  }

  console.log(`[prerender] ✓ all ${ROUTES.length} routes prerendered`);
}

main().catch((err) => {
  console.error('[prerender] fatal:', err);
  process.exit(1);
});
