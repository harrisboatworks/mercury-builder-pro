import type { BlogArticle } from './blogArticles';

/**
 * Hindi blog articles. Empty initially — content arrives in a later rollout.
 * Routes (`/blog/hi/:slug`) are wired now so posts go live as soon as they're added.
 */
export const hindiBlogArticles: BlogArticle[] = [];

export function getHindiArticleBySlug(slug: string): BlogArticle | undefined {
  return hindiBlogArticles.find((a) => a.slug === slug);
}
