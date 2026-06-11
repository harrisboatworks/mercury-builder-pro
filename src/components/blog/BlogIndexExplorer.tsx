import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { BlogArticle, parseLocalDate } from '@/data/blogArticles';
import { getCleanDescription } from '@/lib/strip-markdown';
import { cn } from '@/lib/utils';

interface BlogIndexExplorerProps {
  articles: BlogArticle[];
}

/**
 * Maps the long tail of raw article categories into a small set of
 * quiet filter groups so the pill row stays calm on one line.
 */
function groupFor(rawCategory: string): string {
  const c = rawCategory.toLowerCase();
  if (c.includes('repower')) return 'Repower';
  if (c.includes('area') || c.includes('location') || c.includes('local') || c.includes('trent')) return 'Local & Areas';
  if (c.includes('troubleshoot')) return 'Troubleshooting';
  if (c.includes('mainten') || c.includes('service') || c.includes('winteriz') || c.includes('how')) return 'Maintenance & Service';
  if (
    c.includes('buying') || c.includes('compar') || c.includes('financ') ||
    c.includes('pric') || c.includes('value') || c.includes('market') ||
    c.includes('warrant') || c.includes('new products')
  ) return 'Buying & Pricing';
  if (c.includes('tech') || c.includes('electric') || c.includes('performance') || c.includes('mercury')) return 'Mercury & Tech';
  if (c.includes('fishing') || c.includes('boating') || c.includes('lifestyle') || c.includes('rice lake')) return 'On the Water';
  return 'More';
}

const GROUP_ORDER = [
  'All',
  'Buying & Pricing',
  'Repower',
  'Maintenance & Service',
  'Mercury & Tech',
  'Troubleshooting',
  'Local & Areas',
  'On the Water',
  'More',
];

function formatDate(dateString: string): string {
  return parseLocalDate(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Client-side search + category filtering over the published article list,
 * rendered as a calm editorial list (no boxes, hairline separators).
 */
export function BlogIndexExplorer({ articles }: BlogIndexExplorerProps) {
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');

  const groups = useMemo(() => {
    const present = new Set(articles.map(a => groupFor(a.category)));
    return GROUP_ORDER.filter(g => g === 'All' || present.has(g));
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter(a => {
      if (activeGroup !== 'All' && groupFor(a.category) !== activeGroup) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    });
  }, [articles, query, activeGroup]);

  const isFiltering = query.trim().length > 0 || activeGroup !== 'All';

  return (
    <section aria-label="All Articles">
      {/* Search + category filter row */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-2">
        <div
          role="group"
          aria-label="Filter by topic"
          className="flex flex-wrap items-baseline gap-x-5 gap-y-2 md:order-1 order-2"
        >
          {groups.map(group => {
            const active = group === activeGroup;
            return (
              <button
                key={group}
                type="button"
                onClick={() => setActiveGroup(group)}
                aria-pressed={active}
                className={cn(
                  'font-sans text-[11px] uppercase tracking-[0.16em] pb-1 border-b transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm',
                  active
                    ? 'text-repower-navy-900 border-repower-mercury-red font-semibold'
                    : 'text-repower-navy-900/45 border-transparent hover:text-repower-navy-900'
                )}
              >
                {group}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2.5 border-b border-repower-navy-900/20 focus-within:border-repower-gold transition-colors pb-2 w-full md:w-72 shrink-0 md:order-2 order-1">
          <Search className="h-4 w-4 text-repower-navy-900/40" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${articles.length} guides...`}
            aria-label={`Search ${articles.length} guides`}
            className="w-full bg-transparent font-sans text-[15px] text-repower-navy-900 placeholder:text-repower-navy-900/40 focus:outline-none"
          />
        </label>
      </div>

      {/* Result count while filtering, keeps height stable */}
      <p className="font-sans text-xs text-repower-navy-900/45 h-5 mb-2" aria-live="polite">
        {isFiltering && filtered.length > 0
          ? `${filtered.length} ${filtered.length === 1 ? 'guide' : 'guides'}`
          : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="border-t border-b border-repower-navy-900/10 py-16 text-center">
          <p className="font-display text-xl font-semibold text-repower-navy-900 mb-2">
            No matches for &ldquo;{query.trim()}&rdquo;
          </p>
          <p className="font-sans text-sm text-repower-navy-900/55 mb-5">
            Try a different term, or browse the full archive.
          </p>
          <button
            type="button"
            onClick={() => { setQuery(''); setActiveGroup('All'); }}
            className="font-sans text-sm text-repower-mercury-red underline underline-offset-4 hover:text-repower-mercury-red-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm mr-5"
          >
            Clear search
          </button>
          <Link
            to="/blog"
            className="font-sans text-sm text-repower-navy-900/60 underline underline-offset-4 hover:text-repower-navy-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
          >
            All guides
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-x-16 border-t border-repower-navy-900/10">
          {filtered.map(article => (
            <article key={article.slug} className="border-b border-repower-navy-900/10">
              <Link
                to={`/blog/${article.slug}`}
                className="group block py-7 md:py-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
              >
                <p className="font-sans font-semibold text-[10px] uppercase tracking-[0.22em] text-repower-mercury-red mb-2.5">
                  {article.category}
                </p>
                <h3
                  className="font-display font-semibold text-[19px] md:text-[21px] text-repower-navy-900 group-hover:text-repower-mercury-red transition-colors duration-200 leading-snug"
                  style={{ letterSpacing: '-0.015em' }}
                >
                  <span className="bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[length:0%_1px] bg-left-bottom group-hover:bg-[length:100%_1px] transition-[background-size] duration-300">
                    {article.title}
                  </span>
                </h3>
                <p className="mt-2.5 font-sans text-sm text-repower-navy-900/55 leading-relaxed line-clamp-2 max-w-[60ch]">
                  {getCleanDescription(article)}
                </p>
                <p className="mt-3.5 font-sans text-xs text-repower-navy-900/45">
                  {formatDate(article.datePublished)}
                  <span aria-hidden="true" className="mx-2 text-repower-navy-900/25">·</span>
                  {article.readTime}
                </p>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
