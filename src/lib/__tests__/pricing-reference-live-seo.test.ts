import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Live guard for /pricing-reference SEO copy.
 *
 * scripts/check-pricing-reference-copy.mjs checks the *source*. This one drives
 * a real browser against the running dev server and asserts the rendered
 * <title> and meta description are byte-identical to
 * src/data/seoPageMetadata.json. It skips (does not fail) when the dev server
 * is not reachable, so `npm test` stays green in CI sandboxes without a server.
 */

const BASE_URL = process.env.PREVIEW_BASE_URL ?? 'http://localhost:8080';
const ROOT = resolve(process.cwd());

const seo = JSON.parse(
  readFileSync(join(ROOT, 'src/data/seoPageMetadata.json'), 'utf8')
).pricingReference as { title: string; description: string };

async function serverIsUp(): Promise<boolean> {
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

describe('/pricing-reference rendered SEO', () => {
  it('renders the title and description from seoPageMetadata.json', async () => {
    if (!(await serverIsUp())) {
      console.warn(
        `[pricing-reference-live-seo] skipped: no dev server at ${BASE_URL}`
      );
      return;
    }

    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/pricing-reference`, {
        waitUntil: 'domcontentloaded',
      });
      // react-helmet writes the head asynchronously after hydration.
      await page.waitForFunction(
        (expected) => document.title === expected,
        seo.title,
        { timeout: 15000 }
      ).catch(() => undefined);

      const title = await page.title();
      const description = await page
        .locator('head meta[name="description"]')
        .first()
        .getAttribute('content');

      expect(title).toBe(seo.title);
      expect(description).toBe(seo.description);
    } finally {
      await browser.close();
    }
  }, 60000);
});
