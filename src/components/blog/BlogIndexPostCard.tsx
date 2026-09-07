import { memo } from 'react';
import { Link } from 'react-router-dom';
import { parseLocalDate, type BlogArticle } from '@/data/blogArticles';
import { getCleanDescription } from '@/lib/strip-markdown';

interface BlogIndexPostCardProps {
  article: BlogArticle;
}

export function formatUpdatedDate(dateString: string): string {
  const formatted = parseLocalDate(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Updated ${formatted}`;
}

export const BlogIndexPostCard = memo(function BlogIndexPostCard({ article }: BlogIndexPostCardProps) {
  const updated = formatUpdatedDate(article.dateModified || article.datePublished);

  return (
    <article className="border-b border-repower-navy-900/10">
      <Link
        to={`/blog/${article.slug}`}
        className="group block py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
      >
        <span className="inline-flex items-center rounded-sm border border-repower-navy-900/15 bg-surface-card px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-repower-navy-900/60">
          {article.category}
        </span>
        <h3
          className="mt-2.5 font-display font-semibold text-[18px] md:text-[20px] leading-snug text-repower-navy-900 group-hover:text-repower-mercury-red transition-colors duration-200"
          style={{ letterSpacing: '-0.015em' }}
        >
          {article.title}
        </h3>
        <p className="mt-2 font-sans text-sm text-repower-navy-900/60 leading-relaxed line-clamp-2 max-w-[62ch]">
          {getCleanDescription(article)}
        </p>
        <p className="mt-3 font-sans text-xs text-repower-navy-900/45">
          <time dateTime={article.dateModified || article.datePublished}>{updated}</time>
          {article.readTime ? (
            <>
              <span aria-hidden="true" className="mx-2 text-repower-navy-900/25">
                ·
              </span>
              {article.readTime}
            </>
          ) : null}
        </p>
      </Link>
    </article>
  );
});
