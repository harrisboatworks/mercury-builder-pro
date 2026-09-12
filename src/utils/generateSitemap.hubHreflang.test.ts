import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generateSitemapXML } from './generateSitemap';
import seoPageMetadata from '../data/seoPageMetadata.json';

const HUB_PATHS = [...new Set(seoPageMetadata.home.alternates.map((alternate) => alternate.path))];

function entryFor(xml: string, path: string): string {
  const escapedUrl = `https://www.mercuryrepower.ca${path}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = xml.match(new RegExp(`<url>\\s*<loc>${escapedUrl}</loc>[\\s\\S]*?</url>`));
  expect(match, `sitemap entry for ${path}`).not.toBeNull();
  return match![0];
}

describe('sitemap home-hub hreflang cluster', () => {
  it('emits the full reciprocal set on every hub URL', () => {
    const xml = generateSitemapXML();
    const expectedLinks = seoPageMetadata.home.alternates.map(
      ({ hrefLang, path }) =>
        `<xhtml:link rel="alternate" hreflang="${hrefLang}" href="https://www.mercuryrepower.ca${path}" />`,
    );

    expect(expectedLinks).toHaveLength(9);
    expect(HUB_PATHS).toEqual(['/', '/fr', '/zh', '/ko', '/es', '/pa', '/ur', '/tl']);

    for (const path of HUB_PATHS) {
      const entry = entryFor(xml, path);
      expect(entry).not.toContain('<lastmod>');
      for (const link of expectedLinks) {
        expect(entry, path).toContain(link);
      }
    }
  });

  it('locks the post-build sitemap writer to the same JSON cluster', () => {
    const source = readFileSync('scripts/static-prerender.mjs', 'utf8');

    expect(source).toContain('HOME_HUB_PATHS.has(loc)');
    expect(source).toContain('HOME_SEO.alternates');
    expect(source).toContain('extraHead: HOME_HUB_ALTERNATE_TAGS');
  });
});
