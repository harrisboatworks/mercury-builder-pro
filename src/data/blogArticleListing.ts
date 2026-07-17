export interface BlogListingArticle {
  slug: string;
  title: string;
  description: string;
  image: string;
  imageAlt?: string;
  author: string;
  datePublished: string;
  dateModified: string;
  publishDate?: string;
  category: string;
  readTime: string;
  keywords: string[];
}

// Parse YYYY-MM-DD at local midnight rather than UTC. This prevents scheduled
// entries from appearing a day early in America/Toronto during daylight time.
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

// Ontario seasonal visibility affects blog listings only. Direct article URLs
// and sitemap eligibility remain independent of this display filter.
const SEASONAL_POSTS: Record<string, number[]> = {
  'winter-repower-planning-guide': [11, 12, 1, 2],
  'year-end-boat-motor-buying-guide': [11, 12, 1, 2],
  'boat-winterization-cost-ontario-2026': [9, 10, 11, 12],
  'diy-mercury-outboard-winterization-guide': [9, 10, 11, 12],
  'mercury-outboard-winterization-service-cost-ontario': [9, 10, 11, 12],
  'winter-boat-storage-shrinkwrap-vs-indoor-ontario': [9, 10, 11, 12, 1, 2, 3],
  'outdoor-boat-storage-shrinkwrap-rice-lake': [9, 10, 11, 12, 1, 2, 3],
  'winter-storage-near-toronto-hbw': [9, 10, 11, 12, 1, 2, 3],
  'boat-storage-kawartha-lakes': [9, 10, 11, 12, 1, 2, 3],
  'spring-outboard-commissioning-checklist': [3, 4, 5],
  'walleye-opener-boat-prep': [3, 4, 5],
  'late-season-boating-safety': [9, 10, 11],
  'ontario-boating-season-tips': [4, 5, 6, 7, 8, 9, 10],
  'trent-severn-waterway-boating-guide-2026': [4, 5, 6, 7, 8, 9, 10],
  'rice-lake-boat-rentals-from-toronto-gta': [4, 5, 6, 7, 8, 9],
};

export function isArticleInSeason(slug: string, now: Date = new Date()): boolean {
  const months = SEASONAL_POSTS[slug];
  return !months || months.includes(now.getMonth() + 1);
}

export function isArticlePublished(
  article: Pick<BlogListingArticle, 'datePublished' | 'publishDate'>,
  now: Date = new Date(),
): boolean {
  const publishDate = article.publishDate || article.datePublished;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const articleDate = parseLocalDate(publishDate);
  articleDate.setHours(0, 0, 0, 0);
  return articleDate <= today;
}

export function getPublishedArticleListings<T extends BlogListingArticle>(
  articles: readonly T[],
  now: Date = new Date(),
): T[] {
  return articles
    .filter((article) => isArticlePublished(article, now))
    .filter((article) => isArticleInSeason(article.slug, now))
    .sort((a, b) => {
      const first = new Date(a.publishDate || a.datePublished || 0).getTime();
      const second = new Date(b.publishDate || b.datePublished || 0).getTime();
      return second - first;
    });
}
