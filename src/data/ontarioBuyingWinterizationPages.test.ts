import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getArticleBySlug } from './blogArticles';

const read = (path: string) => readFileSync(path, 'utf8');

const WINTERIZATION_SLUG = 'boat-winterization-cost-ontario-2026';
const RATE_CARD_URL = 'https://www.harrisboatworks.ca/winter-storage';
const PUBLISHED_RATE_MARKERS = [
  'All prices are in Canadian dollars. HST and shop supplies are additional',
  '| 0 to 30 HP 2-Stroke | $191.06 |',
  '| 75 to 115 HP FourStroke | $444.49 |',
  '| 150 HP FourStroke | $498.56 |',
  '| OptiMax / E-Tec | $265.12 |',
  '| Inline 4 and inline 6 | $366.80 | $529.16 |',
  '| With trailer, up to 21 ft | $36 / ft |',
  '| Shrink wrap only (done inside) | $22 / ft |',
  '| Service subtotal | $1,092.49 |',
  'Winterization only',
  'Outdoor winter storage with shrink wrap',
  'Outdoor uncovered storage',
  'Shrink wrap only',
  RATE_CARD_URL,
];
const RESTORED_GENERIC_RANGES = [
  '$250 to $400',
  '$250-$400',
  '$30 to $50',
  '$549 winterization',
];

describe('Ontario buying-price and winterization page holds', () => {
  const article = getArticleBySlug(WINTERIZATION_SLUG);
  const twin = read(`public/blog/${WINTERIZATION_SLUG}.md`);
  const pricingPage = read('src/pages/PricingReference.tsx');
  const pricingPrerender = read('scripts/static-prerender.mjs');
  const pricingMarkdown = read('public/pricing-reference.md');
  const lazyBoundary = read('src/components/LazyRouteBoundary.tsx');

  it('exposes the published 2026-27 HBW rate card inline on the winterization source and twin', () => {
    expect(article).toBeDefined();
    expect(article?.dateModified).toBe('2026-10-14');
    expect(article?.citations?.some((citation) => citation.url === RATE_CARD_URL)).toBe(true);

    for (const surface of [article?.content ?? '', twin]) {
      for (const marker of PUBLISHED_RATE_MARKERS) {
        expect(surface, marker).toContain(marker);
      }
      expect(surface).toMatch(/publishes its current 2026[–-]27 winterization and storage rates/);
      expect(surface).toContain('not a generic package price');
      expect(surface).toContain('hbwservice.ca');
    }
  });

  it('does not restore removed generic winterization estimates', () => {
    for (const surface of [article?.content ?? '', twin]) {
      for (const stale of RESTORED_GENERIC_RANGES) {
        expect(surface).not.toContain(stale);
      }
      expect(surface).not.toMatch(/priced per foot/i);
    }
  });

  it('omits disputed Sea-Doo/PWC amounts and keeps the rate-card work-order route', () => {
    for (const surface of [article?.content ?? '', twin]) {
      expect(surface).not.toContain('$371.15');
      expect(surface).not.toContain('$291.49');
      expect(surface).not.toMatch(/\|\s*SeaDoo\s*\|/);
      expect(surface).toContain('Personal watercraft, including Sea-Doo, are not listed here');
      expect(surface).toContain(RATE_CARD_URL);
      expect(surface).toContain('written work order');
    }
  });

  it('keeps winterization markdown/source parity for the published rate tables', () => {
    const sourceTables = [...(article?.content ?? '').matchAll(/^\| .+\|$/gm)].map((match) => match[0]);
    const twinTables = [...twin.matchAll(/^\| .+\|$/gm)].map((match) => match[0]);
    const publishedRows = sourceTables.filter((row) =>
      PUBLISHED_RATE_MARKERS.some((marker) => marker.startsWith('|') && row.includes(marker.slice(2, 18))),
    );
    expect(publishedRows.length).toBeGreaterThan(8);
    for (const row of publishedRows) {
      expect(twinTables).toContain(row);
    }
  });

  it('keeps pricing-reference answering the Ontario dealer price question from live CAD sources', () => {
    expect(pricingPage).toContain('Mercury Outboard Prices in Ontario (CAD): Live HBW Dealer Pricing');
    expect(pricingPage).toContain('fetch("/pricing-reference.md"');
    expect(pricingPage).toContain('Jump to current prices');
    expect(pricingPage).toContain('/quote/motor-selection');
    expect(pricingMarkdown).toContain('currency: CAD');
    expect(pricingMarkdown).toContain('pickup_only: true');
    expect(pricingMarkdown).toContain('Gores Landing, Ontario');
    expect(pricingMarkdown).toMatch(/\$\d{1,3}(?:,\d{3})+/);
    expect(pricingPrerender).toContain("path: '/pricing-reference'");
    expect(pricingPrerender).toContain('Mercury Outboard Prices in Ontario (CAD): Live HBW Dealer Pricing');
  });

  it('does not add a second H1 or move crawler HTML out of noscript', () => {
    const prerenderWindow = pricingPrerender.slice(
      pricingPrerender.indexOf("path: '/pricing-reference'"),
      pricingPrerender.indexOf("path: '/pricing-reference'") + 2500,
    );
    expect(prerenderWindow.match(/h1:/g)?.length ?? 0).toBe(1);
    expect(pricingPage.match(/<h1[\s\S]*?<\/h1>/g)?.length ?? 0).toBe(1);
    expect(prerenderWindow).toContain('extraNoscript');
  });

  it('leaves Codex-owned pricing-reference Clarity holds in place', () => {
    expect(pricingPage).toContain("href=\"#current-prices\"");
    expect(pricingPage).toContain('pricing-reference-details');
    expect(pricingPage).toContain('pricing-table-scroll');
    expect(pricingPage).toContain('data-cta-location');
    expect(pricingPage).not.toContain('Couldn\'t load this page');
    expect(lazyBoundary).toContain("Couldn't load this page");
  });
});
