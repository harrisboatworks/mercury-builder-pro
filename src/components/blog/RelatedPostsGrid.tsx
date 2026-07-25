import { Link } from 'react-router-dom';
import { blogArticles } from '@/data/blogArticles';
import { BlogCardImage } from './BlogCardImage';

interface Props {
  slugs: string[];
  hideHeader?: boolean;
  surface?: 'default' | 'motor-modal';
}

function truncate(s: string, n = 90): string {
  if (!s) return '';
  if (s.length <= n) return s;
  return s.slice(0, n).replace(/\s+\S*$/, '') + '…';
}

function formatUpdatedDate(date: string): string {
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

/**
 * Card grid replacing the in-content "**Related guides:**" bullet list.
 * Detection + slug extraction lives in MarkdownSectionCards.tsx; this
 * component just renders cards for slugs that resolve to a known article.
 *
 * Pass `hideHeader` to skip the built-in h2 (useful when the parent provides
 * its own heading, e.g. the motor modal Resources tab).
 */
export function RelatedPostsGrid({ slugs, hideHeader = false, surface = 'default' }: Props) {
  const isMotorModal = surface === 'motor-modal';
  const articles = slugs
    .map((slug) => {
      const a = blogArticles.find((x) => x.slug === slug);
      if (!a) {
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
            className={`group flex flex-col overflow-hidden rounded-lg border transition-all hover:-translate-y-0.5 ${
              isMotorModal
                ? 'border-repower-navy-900/12 bg-[#FCFAF5] shadow-[0_12px_34px_rgba(5,14,28,0.07)] hover:border-repower-mercury-red/30 hover:shadow-[0_16px_38px_rgba(5,14,28,0.12)]'
                : 'border-repower-navy-900/15 bg-white shadow-sm hover:shadow-md'
            }`}
          >
            {a.image && (
              <div className={`aspect-[16/9] w-full overflow-hidden ${
                isMotorModal ? 'bg-[#E8E2D7]' : 'bg-repower-navy-900/5'
              }`}>
                <BlogCardImage
                  src={a.image}
                  alt=""
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
              {(a.readTime || (isMotorModal && a.dateModified)) && (
                <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-repower-navy-900/48">
                  {a.readTime && <span>{a.readTime}</span>}
                  {isMotorModal && a.readTime && a.dateModified && (
                    <span aria-hidden="true" className="text-repower-mercury-red/55">•</span>
                  )}
                  {isMotorModal && a.dateModified && (
                    <span>Updated {formatUpdatedDate(a.dateModified)}</span>
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
