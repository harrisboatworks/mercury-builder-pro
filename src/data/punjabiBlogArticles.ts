import type { BlogArticle } from './blogArticles';

/**
 * Punjabi blog articles. Empty initially — content arrives in a later rollout.
 * Routes (`/blog/pa/:slug`) are wired now so posts go live as soon as they're added.
 */
export const punjabiBlogArticles: BlogArticle[] = [];

export function getPunjabiArticleBySlug(slug: string): BlogArticle | undefined {
  return punjabiBlogArticles.find((a) => a.slug === slug);
}
