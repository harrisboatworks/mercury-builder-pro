import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Search } from 'lucide-react';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import {
  blogArticles,
  isArticlePublished,
  parseLocalDate,
  type BlogArticle,
} from '@/data/blogArticles';
import { slugify } from '@/utils/slugify';
import { BlogIndexPillars, PILLAR_CARDS } from '@/components/blog/BlogIndexPillars';
import { BlogIndexPostCard } from '@/components/blog/BlogIndexPostCard';
import { BlogIndexLanguages, LANGUAGE_EDITIONS } from '@/components/blog/BlogIndexLanguages';
import { BLOG_TOPIC_HUBS } from '@/data/blogTopicHubs';

type CategoryGroup = {
  category: string;
  id: string;
  articles: BlogArticle[];
};

function matchesQuery(article: BlogArticle, query: string): boolean {
  const haystack = [
    article.title,
    article.description,
    ...(article.keywords || []),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function sortByDateModifiedDesc(articles: BlogArticle[]): BlogArticle[] {
  return [...articles].sort((a, b) => {
    const aTime = parseLocalDate(a.dateModified || a.datePublished).getTime();
    const bTime = parseLocalDate(b.dateModified || b.datePublished).getTime();
    return bTime - aTime;
  });
}

function groupByCategory(articles: BlogArticle[]): CategoryGroup[] {
  const groups = new Map<string, BlogArticle[]>();
  for (const article of articles) {
    const category = article.category || 'Guides';
    const existing = groups.get(category);
    if (existing) existing.push(article);
    else groups.set(category, [article]);
  }

  const usedIds = new Set<string>();
  const uniqueId = (category: string) => {
    const base = slugify(category) || 'guides';
    let id = `cat-${base}`;
    let n = 2;
    while (usedIds.has(id)) {
      id = `cat-${base}-${n}`;
      n += 1;
    }
    usedIds.add(id);
    return id;
  };

  return [...groups.entries()]
    .map(([category, items]) => ({
      category,
      id: uniqueId(category),
      articles: sortByDateModifiedDesc(items),
    }))
    .sort((a, b) => b.articles.length - a.articles.length || a.category.localeCompare(b.category));
}

export function BlogIndexHub() {
  const [query, setQuery] = useState('');

  const articles = useMemo(() => blogArticles.filter(isArticlePublished), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((article) => matchesQuery(article, q));
  }, [articles, query]);

  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);
  const allGrouped = useMemo(() => groupByCategory(articles), [articles]);

  const isSearching = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-repower-paper">
      <a
        href="#blog-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:font-sans focus:font-semibold focus:text-repower-navy-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-repower-gold/60"
      >
        Skip to blog content
      </a>
      <RepowerHeader />
      <div className="pt-[64px] lg:pt-[72px]" />

      <main
        id="blog-main-content"
        tabIndex={-1}
        className="container mx-auto px-6 md:px-14 max-w-[1200px] py-12 md:py-16"
      >
        <header className="max-w-3xl mb-10 md:mb-14">
          <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-navy-900/50 mb-4">
            Harris Boat Works journal
          </p>
          <h1
            className="font-display font-bold text-repower-navy-900"
            style={{ fontSize: 'clamp(36px, 6vw, 64px)', letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            Boat motor guides
            <br />
            {'& straight answers.'}
          </h1>
          <p className="mt-5 max-w-2xl font-sans text-base md:text-lg text-repower-navy-900/65 leading-relaxed">
            Real-world advice from a family Mercury dealer on Rice Lake. Repowers, troubleshooting, and choosing the right outboard. Written by the people who rig them.
          </p>
        </header>

        <BlogIndexPillars />

        {/* Browse by topic — the five topic hub collections. */}
        <section aria-labelledby="topic-hub-heading" className="mb-10 md:mb-12">
          <h2
            id="topic-hub-heading"
            className="font-display font-bold text-xl md:text-2xl text-repower-navy-900"
            style={{ letterSpacing: '-0.02em' }}
          >
            Browse by topic
          </h2>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {BLOG_TOPIC_HUBS.map((hub) => (
              <Link
                key={hub.slug}
                to={`/blog/${hub.slug}`}
                className="group flex flex-col p-4 bg-surface-card rounded-md border border-repower-navy-900/10 hover:border-repower-navy-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60"
              >
                <span
                  className="font-display text-base font-semibold text-repower-navy-900 group-hover:text-repower-mercury-red transition-colors"
                  style={{ letterSpacing: '-0.015em' }}
                >
                  {hub.navLabel}
                </span>
                <span className="mt-1.5 font-sans text-[13px] text-repower-navy-900/60 leading-snug">
                  {hub.blurb}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="sticky top-[64px] lg:top-[72px] z-20 -mx-6 md:-mx-14 px-6 md:px-14 py-4 mb-10 bg-repower-paper/95 backdrop-blur border-y border-repower-navy-900/10">
          <form role="search" onSubmit={(event) => event.preventDefault()} className="max-w-xl">
            <label htmlFor="blog-index-search" className="sr-only">
              Search guides
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-repower-navy-900/40"
                aria-hidden="true"
              />
              <input
                id="blog-index-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search titles, topics, and keywords"
                autoComplete="off"
                className="w-full bg-surface-card border border-repower-navy-900/15 rounded-md pl-10 pr-4 py-3 font-sans text-[15px] text-repower-navy-900 placeholder:text-repower-navy-900/40 focus:outline-none focus:ring-2 focus:ring-repower-gold/60"
              />
            </div>
          </form>

          <nav aria-label="Browse by category" className="mt-4 flex gap-x-5 overflow-x-auto pb-1">
            <a
              href="#start-here-heading"
              className="shrink-0 whitespace-nowrap font-sans text-[11px] uppercase tracking-[0.16em] text-repower-navy-900/50 hover:text-repower-navy-900 pb-1 border-b border-transparent hover:border-repower-navy-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
            >
              Start here
            </a>
            {grouped.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="shrink-0 whitespace-nowrap font-sans text-[11px] uppercase tracking-[0.16em] text-repower-navy-900/50 hover:text-repower-navy-900 pb-1 border-b border-transparent hover:border-repower-navy-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
              >
                {group.category}
                <span className="ml-1 tabular-nums text-repower-navy-900/35">{group.articles.length}</span>
              </a>
            ))}
            <a
              href="#other-languages-heading"
              className="shrink-0 whitespace-nowrap font-sans text-[11px] uppercase tracking-[0.16em] text-repower-navy-900/50 hover:text-repower-navy-900 pb-1 border-b border-transparent hover:border-repower-navy-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
            >
              Other languages
            </a>
          </nav>
        </div>

        <p className="font-sans text-xs text-repower-navy-900/45 min-h-5 mb-6" aria-live="polite">
          {isSearching
            ? filtered.length === 0
              ? ''
              : `${filtered.length} ${filtered.length === 1 ? 'guide matches' : 'guides match'} your search`
            : `${articles.length} guides`}
        </p>

        {isSearching && filtered.length === 0 ? (
          <div className="border border-repower-navy-900/10 bg-surface-card rounded-md px-6 py-12 text-center mb-16">
            <p className="font-display text-xl font-semibold text-repower-navy-900 mb-2">
              No guides match your search
            </p>
            <p className="font-sans text-sm text-repower-navy-900/60 mb-5">
              Try a different word or clear the filter.
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="font-sans text-sm text-repower-navy-900 underline underline-offset-4 hover:text-repower-mercury-red transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
            >
              Clear search
            </button>
          </div>
        ) : (
          grouped.map((group) => (
            <section
              key={group.id}
              id={group.id}
              aria-labelledby={`${group.id}-heading`}
              className="mb-14 md:mb-16 scroll-mt-36"
            >
              <div className="flex items-end justify-between gap-4 mb-4">
                <h2
                  id={`${group.id}-heading`}
                  className="font-display text-xl md:text-2xl font-bold text-repower-navy-900"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {group.category}
                </h2>
                <span className="font-sans text-sm text-repower-navy-900/45 tabular-nums">
                  {group.articles.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                {group.articles.map((article) => (
                  <BlogIndexPostCard key={article.slug} article={article} />
                ))}
              </div>
            </section>
          ))
        )}

        <BlogIndexLanguages />
      </main>

      <noscript>
        <section>
          <h2>Browse by topic</h2>
          <ul>
            {BLOG_TOPIC_HUBS.map((hub) => (
              <li key={`ns-hub-${hub.slug}`}>
                <a href={`/blog/${hub.slug}`}>{hub.name}</a>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Start here</h2>
          <ul>
            {PILLAR_CARDS.map((card) => (
              <li key={card.slug}>
                <a href={`/blog/${card.slug}`}>{card.title}</a>
              </li>
            ))}
          </ul>
        </section>
        {allGrouped.map((group) => (
          <section key={`ns-${group.id}`}>
            <h2>
              {group.category} ({group.articles.length})
            </h2>
            <ul>
              {group.articles.map((article) => (
                <li key={article.slug}>
                  <a href={`/blog/${article.slug}`}>{article.title}</a>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section>
          <h2>Guides in other languages</h2>
          {LANGUAGE_EDITIONS.map((edition) => (
            <section key={`ns-lang-${edition.code}`} lang={edition.htmlLang} dir={edition.dir}>
              <h3>
                {edition.nativeName} ({edition.posts.length})
              </h3>
              <ul>
                {edition.posts.map((post) => (
                  <li key={`${edition.code}-${post.slug}`}>
                    <a href={`${edition.basePath}/${post.slug}`}>{post.title}</a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>
      </noscript>

      <section className="bg-repower-navy-900 text-white">
        <div className="container mx-auto px-6 md:px-14 max-w-[1200px] py-14 md:py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h2
              className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-tight"
              style={{ letterSpacing: '-0.02em' }}
            >
              Ready to price your repower?
            </h2>
            <p className="mt-2 font-sans text-white/70 max-w-xl">
              Build a real quote in minutes. Pickup only, no pressure.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              to="/quote/motor-selection"
              className="inline-flex items-center justify-center px-6 py-3 bg-repower-mercury-red text-repower-cream rounded-md font-medium hover:bg-repower-mercury-red-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60"
            >
              Build My Quote
            </Link>
            <a
              href="tel:9053422153"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/30 text-white rounded-md font-medium hover:bg-white/10 transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span className="sr-only">Call Harris Boat Works: </span>
              (905) 342-2153
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
