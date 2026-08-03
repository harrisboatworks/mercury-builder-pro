import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPublishedArticles } from './blogArticles';
import { isArticleInSeason } from './blogArticleListing';

const AUGUST_STORAGE_SLUGS = [
  'boat-winterization-cost-ontario-2026',
  'diy-mercury-outboard-winterization-guide',
  'winter-boat-storage-shrinkwrap-vs-indoor-ontario',
  'outdoor-boat-storage-shrinkwrap-rice-lake',
  'winter-storage-near-toronto-hbw',
  'boat-storage-kawartha-lakes',
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

  it('keeps the bilge-pump legal minimum in US gallons per hour', () => {
    const article = getPublishedArticles().find(
      ({ slug }) => slug === 'bilge-pump-troubleshooting-guide',
    );

    expect(article?.content).toContain(
      '0.91 litres per second (about 865 US GPH)',
    );
    expect(article?.content).not.toContain('196 GPH');
  });
});
