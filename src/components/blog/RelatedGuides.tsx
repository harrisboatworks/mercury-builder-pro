import { Link } from 'react-router-dom';
import { getClusterForSlug, getRelatedSlugs, blogClusterContexts } from '@/data/blogClusters';
import { blogArticles } from '@/data/blogArticles';

interface RelatedGuidesProps {
  /** Slug of the current article. */
  currentSlug: string;
  /** Max number of links (default 5). */
  max?: number;
  /** Optional override heading. Defaults to "Related guides". */
  heading?: string;
  className?: string;
}

/**
 * Opt-in component that renders a standardized "Related guides" section
 * derived from the cluster mapping in `src/data/blogClusters.ts`.
 *
 * Articles can either embed a markdown `## Related guides` H2 in their
 * `content` (current default for all 75 articles) OR opt into this
 * component for centrally-managed rendering (e.g., when migrating away
 * from inline markdown lists). Don't use both at the same time.
 */
export function RelatedGuides({
  currentSlug,
  max = 5,
  heading = 'Related guides',
  className = '',
}: RelatedGuidesProps) {
  const cluster = getClusterForSlug(currentSlug);
  if (!cluster) return null;

  const slugs = getRelatedSlugs(currentSlug, max);
  if (slugs.length === 0) return null;

  const titleFor = (slug: string) =>
    blogArticles.find((a) => a.slug === slug)?.title ?? slug;

  return (
    <aside
      aria-labelledby="related-guides-heading"
      className={`mt-10 border-t border-border pt-6 ${className}`}
    >
      <h2 id="related-guides-heading" className="text-2xl font-semibold mb-4">
        {heading}
      </h2>
      <ul className="space-y-2 list-disc pl-6 marker:text-muted-foreground">
        {slugs.map((slug) => (
          <li key={slug} className="text-foreground">
            <Link
              to={`/blog/${slug}`}
              className="text-primary hover:underline font-medium"
            >
              {titleFor(slug)}
            </Link>
            {blogClusterContexts[slug] && (
              <span className="text-muted-foreground"> — {blogClusterContexts[slug]}</span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
