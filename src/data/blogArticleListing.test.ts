import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPublishedArticles } from './blogArticles';
import { isArticleInSeason } from './blogArticleListing';

const AUGUST_STORAGE_SLUGS = [
  'boat-winterization-cost-ontario-2026',
  'diy-mercury-outboard-winterization-guide',
  'winter-boat-storage-shrinkwrap-vs-indoor-ontario',
  'outdoor-boat-storage-shrinkwrap-rice-lake',
  'winter-storage-near-toronto-hbw',
];

describe('Ontario seasonal blog visibility', () => {
  afterEach(() => vi.useRealTimers());

  it('opens the storage and winterization cluster when August booking begins', () => {
    const augustFirst = new Date(2026, 7, 1, 12);

    for (const slug of AUGUST_STORAGE_SLUGS) {
      expect(isArticleInSeason(slug, augustFirst), slug).toBe(true);
    }
  });

  it('keeps the same cluster hidden before the booking season', () => {
    const julyLast = new Date(2026, 6, 31, 12);

    for (const slug of AUGUST_STORAGE_SLUGS) {
      expect(isArticleInSeason(slug, julyLast), slug).toBe(false);
    }
  });

  it('includes the August storage cluster in the published English listing', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 2, 12));
    const visibleSlugs = new Set(getPublishedArticles().map((article) => article.slug));

    for (const slug of AUGUST_STORAGE_SLUGS) {
      expect(visibleSlugs.has(slug), slug).toBe(true);
    }
  });

  it('keeps the bilge rules scoped and the section 736 conversion aligned', () => {
    const article = getPublishedArticles().find(
      ({ slug }) => slug === 'bilge-pump-troubleshooting-guide',
    );
    const sizingFaq = article?.faqs?.find(
      ({ question }) => question === 'What size bilge pump do I need for my boat?',
    );
    const markdown = readFileSync(
      'public/blog/bilge-pump-troubleshooting-guide.md',
      'utf8',
    );

    for (const content of [article?.content, markdown]) {
      expect(content).toContain('3,276 L/h, or about 865 US GPH');
      expect(content).toContain('0.91 litres per second');
      expect(content).not.toContain('196 GPH');
      expect(content).not.toMatch(/\b866(?:\s+US)?\s+GPH\b/i);
      expect(content).toContain('sections 735 to 739 apply in respect of non-pleasure vessels over 6 m');
    }

    expect(article?.content).toContain('For pleasure craft not more than 9 m long');
    expect(article?.content).toContain("Section 214's exception applies specifically to the bailer or manual bilge-pump requirement");
    expect(article?.content).toContain('automatic high bilge-water alarm');
    expect(markdown).toMatch(/\*\*Last reviewed:\*\* [^\n]+ {2}\n\*\*Read time:\*\*/);
    expect(article?.content).not.toContain('bilge-pump-sizing-chart.png');
    expect(article?.content).toContain('| 16 ft and under | 1,900-3,000 L/h (500-800 US GPH) |');
    expect(article?.content).toContain('putting a larger pump on an undersized circuit or discharge will not deliver the advertised capacity');
    expect(sizingFaq?.answer).toContain('does not set a pleasure-craft sizing floor');
  });
});
