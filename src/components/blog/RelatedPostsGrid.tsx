import { Link } from 'react-router-dom';
import { blogArticles } from '@/data/blogArticles';

interface Props {
  slugs: string[];
  hideHeader?: boolean;
}

function truncate(s: string, n = 90): string {
  if (!s) return '';
  if (s.length <= n) return s;
  return s.slice(0, n).replace(/\s+\S*$/, '') + '…';
}

/**
 * Card grid replacing the in-content "**Related guides:**" bullet list.
 * Detection + slug extraction lives in MarkdownSectionCards.tsx; this
 * component just renders cards for slugs that resolve to a known article.
 *
 * Pass `hideHeader` to skip the built-in h2 (useful when the parent provides
 * its own heading, e.g. the motor modal Resources tab).
 */
export function RelatedPostsGrid({ slugs, hideHeader = false }: Props) {
  const articles = slugs
    .map((slug) => {
      const a = blogArticles.find((x) => x.slug === slug);
      if (!a) {
        // eslint-disable-next-line no-console
        console.warn(
          `[RelatedPostsGrid] Skipping unknown article slug: ${slug}`,
        );
      }
      return a;
    })
    .filter(Boolean) as typeof blogArticles;

  if (!articles.length) return null;

  return (
    <nav
      aria-label="Related guides"
      className={hideHeader ? 'not-prose' : 'not-prose my-10 border-t border-repower-navy-900/10 pt-6'}
    >
      {!hideHeader && (
        <h2 className="mb-5 font-display text-xl font-bold text-repower-navy-900 md:text-2xl">
          Related guides
        </h2>
      )}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {articles.map((a) => (
          <Link
            key={a.slug}
            to={`/blog/${a.slug}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-repower-navy-900/15 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            {a.image && (
              <div className="aspect-[16/9] w-full overflow-hidden bg-repower-navy-900/5">
                <img
                  src={
                    a.image.startsWith('/') || a.image.startsWith('http')
                      ? a.image
                      : `/lovable-uploads/${a.image}`
                  }
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <div className="text-[15px] font-semibold leading-snug text-repower-navy-900 group-hover:underline">
                {a.title}
              </div>
              {a.description && (
                <div className="mt-2 text-sm text-repower-navy-900/65 leading-snug">
                  {truncate(a.description, 90)}
                </div>
              )}
              {a.readTime && (
                <div className="mt-3 text-xs uppercase tracking-wide text-repower-navy-900/50">
                  {a.readTime}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
