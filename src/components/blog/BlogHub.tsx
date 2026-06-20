import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Wrench,
  Compass,
  AlertTriangle,
  MapPin,
  Clock,
  ArrowRight,
  Phone,
} from 'lucide-react';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { BlogArticle, parseLocalDate } from '@/data/blogArticles';
import { getCleanDescription } from '@/lib/strip-markdown';

export interface BlogHubStrings {
  heroTitleLine1: string;          // white
  heroTitleLine2: string;          // red
  heroSubhead: string;
  searchLabel: string;
  searchPlaceholder: string;
  trustItems: string[];
  intentHeading: string;
  intents: {
    repower: string;
    choose: string;
    trouble: string;
    local: string;
  };
  featuredEyebrow: string;
  featuredReadCta: string;
  latestHeading: string;
  latestSubhead?: string;
  newBadge: string;
  updatedBadge: string;
  categorySections: { id: string; heading: string }[]; // ids match intent keys
  allHeading: string;
  showAll: string;
  hideAll: string;
  noResults: string;
  clearFilters: string;
  activeFilterLabel: string;
  ctaHeading: string;
  ctaSubhead?: string;
  ctaButton: string;
  ctaPhone: string;
  phoneLabel: string;
}

type IntentKey = 'repower' | 'choose' | 'trouble' | 'local';

interface BlogHubProps {
  strings: BlogHubStrings;
  articles: BlogArticle[];
  basePath: string; // e.g. "/blog" or "/fr/blog"
  heroImage?: string;
  featuredSlug?: string;
  /**
   * Optional locale-aware mapping from a localized `article.category` value
   * to one of the four intent keys. When provided, intent filtering uses this
   * direct lookup instead of the default English keyword regex.
   */
  categoryToIntent?: Record<string, IntentKey>;
}

function matchesIntentDefault(article: BlogArticle, intent: IntentKey): boolean {
  const cat = (article.category || '').toLowerCase();
  const kw = (article.keywords || []).join(' ').toLowerCase();
  const blob = `${cat} ${kw} ${article.title.toLowerCase()}`;
  switch (intent) {
    case 'repower':
      return /repower|cost|pricing|financ|warranty|trade/.test(blob);
    case 'choose':
      return /buying|comparison|brand|new product|tech|technology|outboard|motor|pro xs|fourstroke|verado/.test(
        blob,
      ) && !/troubleshoot|winteriz|maintenance|service/.test(blob);
    case 'trouble':
      return /troubleshoot|maintenance|service|how[- ]to|winteriz|commissioning|prep/.test(blob);
    case 'local':
      return /rice lake|local|service area|dealer location|trent[- ]severn|kawartha|ontario|toronto|fishing/.test(
        blob,
      );
  }
}

function makeMatcher(
  categoryToIntent?: Record<string, IntentKey>,
): (article: BlogArticle, intent: IntentKey) => boolean {
  if (!categoryToIntent) return matchesIntentDefault;
  return (article, intent) => categoryToIntent[article.category || ''] === intent;
}

function ArticleCard({
  article,
  basePath,
  badge,
}: {
  article: BlogArticle;
  basePath: string;
  badge?: string;
}) {
  return (
    <Link
      to={`${basePath}/${article.slug}`}
      className="group flex flex-col bg-white rounded-md overflow-hidden border border-repower-navy-900/10 hover:border-repower-navy-900/20 hover:shadow-md transition-all"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-repower-paper">
        <img
          src={article.image}
          alt={article.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
        />
        {badge && (
          <span className="absolute top-3 left-3 bg-repower-mercury-red text-[#F5F1EA] text-[10px] font-semibold uppercase tracking-[0.15em] px-2 py-1 rounded-sm">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <span className="font-sans text-[11px] font-semibold text-repower-mercury-red uppercase tracking-[0.2em]">
          {article.category || 'Guide'}
        </span>
        <h3
          className="mt-2 font-display text-lg font-semibold text-repower-navy-900 group-hover:text-repower-mercury-red transition-colors line-clamp-2"
          style={{ letterSpacing: '-0.015em' }}
        >
          {article.title}
        </h3>
        <p className="mt-2 font-sans text-sm text-repower-navy-900/65 line-clamp-2 leading-relaxed flex-1">
          {getCleanDescription(article)}
        </p>
        <div className="mt-4 flex items-center gap-1 text-xs text-repower-navy-900/55">
          <Clock className="h-3.5 w-3.5" />
          <span>{article.readTime}</span>
        </div>
      </div>
    </Link>
  );
}

export function BlogHub({
  strings,
  articles,
  basePath,
  heroImage = '/lovable-uploads/pontoon-family-rice-lake-hero.png',
  featuredSlug,
}: BlogHubProps) {
  const [query, setQuery] = useState('');
  const [intent, setIntent] = useState<IntentKey | null>(null);
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(
    () =>
      [...articles].sort(
        (a, b) =>
          parseLocalDate(b.datePublished).getTime() -
          parseLocalDate(a.datePublished).getTime(),
      ),
    [articles],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((a) => {
      if (intent && !matchesIntent(a, intent)) return false;
      if (!q) return true;
      const hay = `${a.title} ${(a.keywords || []).join(' ')} ${a.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [sorted, query, intent]);

  const featured =
    sorted.find((a) => a.slug === featuredSlug) ||
    sorted.find((a) => a.slug === 'is-a-pontoon-right-for-your-family-rice-lake') ||
    sorted.find((a) => a.slug === 'fourstroke-vs-pro-xs') ||
    sorted[0];

  const latest = filtered.filter((a) => a.slug !== featured?.slug).slice(0, 6);
  const isFilteredView = Boolean(query.trim() || intent);

  const sectionFor = (key: IntentKey, limit = 3) =>
    sorted.filter((a) => a.slug !== featured?.slug && matchesIntent(a, key)).slice(0, limit);

  const intentDefs: {
    key: IntentKey;
    label: string;
    Icon: typeof Wrench;
  }[] = [
    { key: 'repower', label: strings.intents.repower, Icon: Wrench },
    { key: 'choose', label: strings.intents.choose, Icon: Compass },
    { key: 'trouble', label: strings.intents.trouble, Icon: AlertTriangle },
    { key: 'local', label: strings.intents.local, Icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-repower-paper">
      <RepowerHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(4,15,31,0.78) 0%, rgba(10,24,40,0.82) 60%, rgba(10,24,40,0.92) 100%)',
            }}
          />
        </div>

        <div className="relative pt-[calc(64px+3.5rem)] lg:pt-[calc(72px+5rem)] pb-16 md:pb-24">
          <div className="container mx-auto px-6 md:px-14 max-w-[1200px]">
            <h1
              className="font-display font-bold text-[clamp(36px,6vw,72px)] leading-[1.02] tracking-[-0.025em] text-white"
            >
              {strings.heroTitleLine1}
              <br />
              <span className="text-repower-mercury-red">{strings.heroTitleLine2}</span>
            </h1>
            <p className="mt-5 max-w-2xl font-sans text-base md:text-lg text-white/75 leading-relaxed">
              {strings.heroSubhead}
            </p>

            {/* Search */}
            <form
              role="search"
              onSubmit={(e) => e.preventDefault()}
              className="mt-8 max-w-2xl"
            >
              <label htmlFor="blog-hub-search" className="sr-only">
                {strings.searchLabel}
              </label>
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-repower-navy-900/50"
                  aria-hidden="true"
                />
                <input
                  id="blog-hub-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={strings.searchPlaceholder}
                  className="w-full bg-white rounded-md pl-12 pr-4 py-4 text-base font-sans text-repower-navy-900 placeholder:text-repower-navy-900/45 focus:outline-none focus:ring-2 focus:ring-repower-mercury-red/60"
                />
              </div>
            </form>

            {/* Trust row */}
            <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] md:text-[13px] text-white/65 font-sans">
              {strings.trustItems.map((t, i) => (
                <li key={i} className="flex items-center gap-2">
                  {i > 0 && <span className="hidden md:inline h-1 w-1 rounded-full bg-white/30" />}
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 md:px-14 max-w-[1200px] py-14 md:py-20">
        {/* INTENT TILES */}
        <section aria-labelledby="intent-heading" className="mb-16 md:mb-20">
          <h2 id="intent-heading" className="sr-only">
            {strings.intentHeading}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {intentDefs.map(({ key, label, Icon }) => {
              const active = intent === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIntent(active ? null : key)}
                  aria-pressed={active}
                  className={[
                    'group text-left p-5 rounded-md border transition-all',
                    active
                      ? 'bg-repower-navy-900 border-repower-navy-900 text-white'
                      : 'bg-white border-repower-navy-900/10 hover:border-repower-navy-900/30 text-repower-navy-900',
                  ].join(' ')}
                >
                  <Icon
                    className={[
                      'h-5 w-5 mb-3',
                      active ? 'text-repower-mercury-red' : 'text-repower-mercury-red',
                    ].join(' ')}
                  />
                  <span
                    className="font-display text-base md:text-lg font-semibold leading-snug"
                    style={{ letterSpacing: '-0.015em' }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          {isFilteredView && (
            <div className="mt-4 flex items-center gap-3 text-sm text-repower-navy-900/70">
              <span>
                {strings.activeFilterLabel} · {filtered.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setIntent(null);
                }}
                className="underline decoration-repower-mercury-red/50 underline-offset-4 hover:text-repower-mercury-red"
              >
                {strings.clearFilters}
              </button>
            </div>
          )}
        </section>

        {/* FILTERED RESULTS take over when searching/intent active */}
        {isFilteredView ? (
          <section aria-label={strings.latestHeading} className="mb-16">
            {filtered.length === 0 ? (
              <p className="font-sans text-repower-navy-900/70">{strings.noResults}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.slice(0, showAll ? filtered.length : 12).map((a) => (
                  <ArticleCard key={a.slug} article={a} basePath={basePath} />
                ))}
              </div>
            )}
            {filtered.length > 12 && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll((s) => !s)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-repower-navy-900 text-[#F5F1EA] rounded-md font-medium hover:opacity-90 transition"
                >
                  {showAll ? strings.hideAll : strings.showAll}
                </button>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* FEATURED COVER STORY */}
            {featured && (
              <section aria-labelledby="featured-heading" className="mb-16 md:mb-20">
                <h2 id="featured-heading" className="sr-only">
                  {strings.featuredEyebrow}
                </h2>
                <Link
                  to={`${basePath}/${featured.slug}`}
                  className="group grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center bg-white rounded-md overflow-hidden border border-repower-navy-900/10 hover:border-repower-navy-900/20 hover:shadow-lg transition-all"
                >
                  <div className="lg:col-span-7 relative aspect-[16/10] overflow-hidden bg-repower-paper">
                    <img
                      src={featured.image}
                      alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    />
                    <span className="absolute top-4 left-4 bg-repower-mercury-red text-[#F5F1EA] text-[10px] font-semibold uppercase tracking-[0.18em] px-2.5 py-1 rounded-sm">
                      {strings.featuredEyebrow}
                    </span>
                  </div>
                  <div className="lg:col-span-5 p-6 lg:p-8 lg:pr-10">
                    <span className="font-sans text-[11px] font-semibold text-repower-mercury-red uppercase tracking-[0.22em]">
                      {featured.category}
                    </span>
                    <h3
                      className="mt-3 font-display text-2xl md:text-3xl lg:text-[34px] font-bold text-repower-navy-900 leading-[1.1] group-hover:text-repower-mercury-red transition-colors"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {featured.title}
                    </h3>
                    <p className="mt-3 font-sans text-base text-repower-navy-900/70 leading-relaxed line-clamp-3">
                      {getCleanDescription(featured)}
                    </p>
                    <div className="mt-5 flex items-center gap-4 text-xs text-repower-navy-900/55">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {featured.readTime}
                      </span>
                    </div>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-repower-mercury-red">
                      {strings.featuredReadCta}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </section>
            )}

            {/* LATEST GUIDES */}
            <section aria-labelledby="latest-heading" className="mb-16 md:mb-20">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2
                    id="latest-heading"
                    className="font-display text-2xl md:text-3xl font-bold text-repower-navy-900"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {strings.latestHeading}
                  </h2>
                  {strings.latestSubhead && (
                    <p className="mt-1 font-sans text-sm text-repower-navy-900/65">
                      {strings.latestSubhead}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {latest.map((a, idx) => (
                  <ArticleCard
                    key={a.slug}
                    article={a}
                    basePath={basePath}
                    badge={idx === 0 ? strings.newBadge : undefined}
                  />
                ))}
              </div>
            </section>

            {/* CATEGORY SECTIONS */}
            {strings.categorySections.map((sec) => {
              const items = sectionFor(sec.id as IntentKey, 3);
              if (items.length === 0) return null;
              return (
                <section
                  key={sec.id}
                  aria-labelledby={`cat-${sec.id}`}
                  className="mb-16 md:mb-20"
                >
                  <div className="flex items-end justify-between mb-6">
                    <h2
                      id={`cat-${sec.id}`}
                      className="font-display text-xl md:text-2xl font-bold text-repower-navy-900"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {sec.heading}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIntent(sec.id as IntentKey)}
                      className="text-sm font-medium text-repower-mercury-red hover:underline underline-offset-4"
                    >
                      {strings.featuredReadCta}
                      <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((a) => (
                      <ArticleCard key={a.slug} article={a} basePath={basePath} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* ALL GUIDES */}
            <section aria-labelledby="all-heading" className="mb-16 md:mb-20">
              <div className="flex items-end justify-between mb-6">
                <h2
                  id="all-heading"
                  className="font-display text-2xl md:text-3xl font-bold text-repower-navy-900"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {strings.allHeading}{' '}
                  <span className="text-repower-navy-900/40 font-medium">({sorted.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAll((s) => !s)}
                  className="text-sm font-medium text-repower-mercury-red hover:underline underline-offset-4"
                >
                  {showAll ? strings.hideAll : strings.showAll}
                </button>
              </div>
              {showAll && (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                  {sorted.map((a) => (
                    <li key={a.slug} className="border-b border-repower-navy-900/10 pb-3">
                      <Link
                        to={`${basePath}/${a.slug}`}
                        className="group block"
                      >
                        <span className="font-sans text-[10px] font-semibold text-repower-mercury-red uppercase tracking-[0.2em]">
                          {a.category || 'Guide'}
                        </span>
                        <h3
                          className="mt-1 font-display text-[15px] font-semibold text-repower-navy-900 group-hover:text-repower-mercury-red transition-colors line-clamp-2"
                          style={{ letterSpacing: '-0.01em' }}
                        >
                          {a.title}
                        </h3>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      {/* CTA BAND */}
      <section className="bg-repower-navy-900 text-white">
        <div className="container mx-auto px-6 md:px-14 max-w-[1200px] py-14 md:py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h2
              className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-tight"
              style={{ letterSpacing: '-0.02em' }}
            >
              {strings.ctaHeading}
            </h2>
            {strings.ctaSubhead && (
              <p className="mt-2 font-sans text-white/70 max-w-xl">{strings.ctaSubhead}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              to="/quote/motor-selection"
              className="inline-flex items-center justify-center px-6 py-3 bg-repower-mercury-red text-[#F5F1EA] rounded-md font-medium hover:bg-repower-mercury-red-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60"
            >
              {strings.ctaButton}
            </Link>
            <a
              href={`tel:${strings.ctaPhone.replace(/[^0-9+]/g, '')}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/30 text-white rounded-md font-medium hover:bg-white/10 transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span className="sr-only">{strings.phoneLabel}: </span>
              {strings.ctaPhone}
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
