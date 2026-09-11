import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generateSitemapXML } from './generateSitemap';
import {
  normalizeAuthoritativeDate,
  renderSitemapLastmod,
} from '../../scripts/lib/sitemap-lastmod.mjs';

function entryFor(xml: string, path: string): string {
  const escapedUrl = `https://www.mercuryrepower.ca${path}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = xml.match(new RegExp(`<url>\\s*<loc>${escapedUrl}</loc>[\\s\\S]*?</url>`));
  expect(match, `sitemap entry for ${path}`).not.toBeNull();
  return match![0];
}

describe('sitemap lastmod provenance', () => {
  it('renders lastmod only when a source timestamp exists', () => {
    expect(normalizeAuthoritativeDate('2026-05-10T16:30:00Z')).toBe('2026-05-10');
    expect(renderSitemapLastmod('2026-05-10T16:30:00Z')).toBe(
      '\n    <lastmod>2026-05-10</lastmod>',
    );
    expect(renderSitemapLastmod(undefined)).toBe('');
    expect(renderSitemapLastmod(null)).toBe('');
  });

  it('omits lastmod from timestamp-less static and topic-hub entries', () => {
    const xml = generateSitemapXML();

    expect(entryFor(xml, '/')).not.toContain('<lastmod>');
    expect(entryFor(xml, '/blog/diagnostics')).not.toContain('<lastmod>');
    expect(entryFor(xml, '/tools')).toContain('<lastmod>2026-05-10</lastmod>');
    expect(xml).not.toContain('<lastmod>undefined</lastmod>');
  });

  it('locks the post-build generator to the same optional-lastmod contract', () => {
    const source = readFileSync('scripts/static-prerender.mjs', 'utf8');

    expect(source).toContain('block += renderSitemapLastmod(e.lastmod);');
    expect(source).not.toContain('staticSitemapEntries.map(e => ({ ...e, lastmod: today }))');
    expect(source).not.toContain('<lastmod>${e.lastmod || today}</lastmod>');
    expect(source).not.toMatch(/lastmod:\s*today/);
  });
});
