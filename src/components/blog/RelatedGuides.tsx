import { Link } from 'react-router-dom';
import { getClusterForSlug, getRelatedSlugs, blogClusterContexts } from '@/data/blogClusters';
import { blogArticles } from '@/data/blogArticles';

const titleFor = (slug: string) =>
  blogArticles.find((a) => a.slug === slug)?.title ?? slug;

interface RelatedGuidesProps {
  /** Slug of the current article. */
  currentSlug: string;
  /** Max number of links (default 5). */
  max?: number;
  /** Optional override heading. Defaults to "Related guides". */
  heading?: string;
  className?: string;
  /** Slugs to exclude (e.g. already linked in article body). */
  excludeSlugs?: string[];
  /** Minimum links required to render (default 1). */
  minLinks?: number;
}

/**
 * Opt-in component that renders a standardized "Related guides" H2 list
 * derived from the cluster mapping in `src/data/blogClusters.ts`.
 *
 * Pairs with <InlineSeeAlso /> (below) so authors can render both the
 * inline callout and the end-of-article list from the same data source
 * with identical link targets and anchor text.
 *
 * Articles can either embed a markdown `## Related guides` H2 in their
 * `content` (current default for all 75 articles) OR opt into this
 * component for centrally-managed rendering. Don't use both at once.
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

interface InlineSeeAlsoProps {
  /** Slug of the current article. */
  currentSlug: string;
  /** How many sibling links to inline (default 2, max 3). */
  count?: number;
  /** Lead-in label. Defaults to "See also:". */
  label?: string;
  className?: string;
}

/**
 * Inline "See also: [link] and [link]." callout.
 *
 * Designed to be dropped inside article prose (typically just above the
 * end-of-article <RelatedGuides /> H2 list) so the inline + list pair
 * stays in lockstep with the cluster map. Uses the same pillar-first
 * sibling order as <RelatedGuides />.
 */
export function InlineSeeAlso({
  currentSlug,
  count = 2,
  label = 'See also:',
  className = '',
}: InlineSeeAlsoProps) {
  const cluster = getClusterForSlug(currentSlug);
  if (!cluster) return null;

  const max = Math.min(Math.max(count, 1), 3);
  const slugs = getRelatedSlugs(currentSlug, max);
  if (slugs.length === 0) return null;

  return (
    <p className={`my-6 text-foreground ${className}`}>
      <strong>{label}</strong>{' '}
      {slugs.map((slug, i) => (
        <span key={slug}>
          <Link to={`/blog/${slug}`} className="text-primary hover:underline">
            {titleFor(slug)}
          </Link>
          {i < slugs.length - 2 && ', '}
          {i === slugs.length - 2 && ' and '}
        </span>
      ))}
      .
    </p>
  );
}

/**
 * Convenience wrapper that renders both the inline callout and the H2 list
 * in one shot — the canonical "Related guides" pattern across the blog.
 *
 * Place this where you'd otherwise hand-author the markdown `## Related
 * guides` block. It will render the inline `<InlineSeeAlso />` first,
 * followed by the `<RelatedGuides />` H2 list, both pulling from the same
 * cluster map so they stay in sync.
 */
export function RelatedGuidesBlock({
  currentSlug,
  max = 5,
  inlineCount = 2,
  className = '',
}: {
  currentSlug: string;
  max?: number;
  inlineCount?: number;
  className?: string;
}) {
  const cluster = getClusterForSlug(currentSlug);
  if (!cluster) return null;
  return (
    <>
      <InlineSeeAlso currentSlug={currentSlug} count={inlineCount} />
      <RelatedGuides currentSlug={currentSlug} max={max} className={className} />
    </>
  );
}
