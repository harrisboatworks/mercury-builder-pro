import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

const CANONICAL = 'https://www.mercuryrepower.ca/harris-boat-works';
const ROUTE = '/harris-boat-works';
const HISTORY = '/blog/harris-boat-works-since-1947-rice-lake-institution';
const ORGANIZATION_ID = 'https://www.mercuryrepower.ca/#organization';
const SHOP_IMAGE = '/lovable-uploads/archive/hbw-building-front-shop.jpg';

function sectionAfter(source: string, marker: string, nextMarker: string) {
  const start = source.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const from = source.slice(start);
  const end = from.indexOf(nextMarker, marker.length);
  return end === -1 ? from : from.slice(0, end);
}

describe('Harris Boat Works brand-search landing page', () => {
  it('registers the exact-match route lazily without replacing / or /about', () => {
    const app = read('src/App.tsx');

    expect(app).toContain('const HarrisBoatWorks = lazy(() => import("./pages/HarrisBoatWorks"))');
    expect(app).toContain('<Route path="/harris-boat-works" element={<HarrisBoatWorks />} />');
    expect(app).toContain('<Route path="/" element={<RootRedirect />} />');
    expect(app).toContain('<Route path="/about" element={<About />} />');
    expect(app).toContain('<Route path="/blog/:slug" element={<BlogArticle />} />');
  });

  it('emits a dedicated self-canonical, unique metadata, shop image, and JSON-LD graph', () => {
    const seo = read('src/components/seo/HarrisBoatWorksBrandPageSEO.tsx');
    const data = read('src/data/harrisBoatWorksBrandPage.js');
    const page = read('src/pages/HarrisBoatWorks.tsx');

    expect(seo).toContain("rel=\"canonical\"");
    expect(seo).toContain('HARRIS_BOAT_WORKS_BRAND_CANONICAL');
    expect(seo).toContain('og:image');
    expect(seo).toContain('twitter:image');
    expect(seo).toContain('buildHarrisBoatWorksBrandPageSchema');

    expect(data).toContain(CANONICAL);
    expect(data).toContain(ROUTE);
    expect(data).toContain(ORGANIZATION_ID);
    expect(data).toContain("'WebPage'");
    expect(data).toContain("'BreadcrumbList'");
    expect(data).toContain("'FAQPage'");
    expect(data).toContain(SHOP_IMAGE);
    expect(data).toContain(HISTORY);
    expect(data).not.toMatch(/Platinum/);
    expect(data).not.toContain('\u2014');
    expect(page).toContain('HARRIS_BOAT_WORKS_SHOP_IMAGE_PATH');
    expect(page).toContain('HARRIS_BOAT_WORKS_HISTORY_HREF');
    expect(page).not.toContain('\u2014');
    expect(page).not.toMatch(/Platinum/);
    expect(seo).not.toContain('\u2014');
  });

  it('registers the URL in both sitemap sources', () => {
    const sitemap = read('src/utils/generateSitemap.ts');
    const prerender = read('scripts/static-prerender.mjs');

    expect(sitemap).toContain(`loc: '${ROUTE}'`);
    expect(prerender).toContain(`loc: '${ROUTE}'`);
  });

  it('has a full static-prerender definition with matching crawlable fields', () => {
    const prerender = read('scripts/static-prerender.mjs');
    const data = read('src/data/harrisBoatWorksBrandPage.js');

    expect(prerender).toContain("from '../src/data/harrisBoatWorksBrandPage.js'");
    expect(prerender).toContain('getHarrisBoatWorksBrandPagePrerender()');
    expect(data).toContain("path: HARRIS_BOAT_WORKS_BRAND_PATH");
    expect(data).toContain('title: HARRIS_BOAT_WORKS_BRAND_TITLE');
    expect(data).toContain('description: HARRIS_BOAT_WORKS_BRAND_DESCRIPTION');
    expect(data).toContain('buildHarrisBoatWorksBrandPageSchema()');
    expect(data).toContain('extraNoscript: buildHarrisBoatWorksBrandPageNoscript');
    expect(data).toContain('stripInheritedShellSeo: true');
    expect(data).toContain('ogImageAlt: HARRIS_BOAT_WORKS_SHOP_IMAGE_ALT');
    expect(data).toContain('Get directions');
    expect(data).toContain('5369 Harris Boat Works Rd');
    expect(data).toContain('Rice Lake');
    expect(data).toContain('Gores Landing');
    expect(data).toContain('December 1');
    expect(data).toContain(HISTORY);
    expect(data).toContain('/quote/motor-selection');
    expect(data).toContain('https://hbw.wiki/service');
  });

  it('adds the page to AI discovery surfaces without duplicating full copy', () => {
    const llms = read('public/llms.txt');
    const brand = read('public/.well-known/brand.json');

    expect(llms).toContain(`](${CANONICAL})`);
    expect(llms).toMatch(/## Pages[\s\S]*harris-boat-works/);
    expect(brand).toContain(`"brandPage": "${CANONICAL}"`);
    expect(brand).not.toContain('Heritage, short version');
    expect(llms).not.toContain('Heritage, short version');
  });

  it('adds one internal link from the two intended location surfaces only', () => {
    const locations = read('src/data/locations.ts');
    const longForm = read('src/data/locationsLongForm.ts');

    const riceLake = sectionAfter(
      locations,
      "slug: 'rice-lake-mercury-repower'",
      "slug: 'peterborough-mercury-dealer'",
    );
    const peterborough = sectionAfter(
      locations,
      "slug: 'peterborough-mercury-dealer'",
      "slug: 'kawartha-lakes-mercury-outboards'",
    );
    const goresLanding = sectionAfter(
      longForm,
      "slug: 'gores-landing'",
      "slug: 'roseneath'",
    );
    const bewdley = sectionAfter(
      longForm,
      "slug: 'bewdley'",
      "slug: 'gores-landing'",
    );

    expect(riceLake).toContain(`href: '${ROUTE}'`);
    expect(goresLanding).toContain(`href: '${ROUTE}'`);
    expect(peterborough).not.toContain(ROUTE);
    expect(bewdley).not.toContain(ROUTE);
    expect(locations.split(ROUTE)).toHaveLength(2);
    expect(longForm.split(ROUTE)).toHaveLength(2);
  });
});
