import { Link } from 'react-router-dom';
import { getArticleBySlug, parseLocalDate } from '@/data/blogArticles';
import { getCleanDescription } from '@/lib/strip-markdown';

const LEAD_SLUG = 'repair-repower-or-sell-boat-ontario-decision-guide';

const CORNERSTONE_SLUGS = [
  'mercury-repower-cost-ontario-2026-cad',
  'repower-financing-ontario-rates-monthly-payments',
  'mercury-outboard-weight-chart',
  'mercury-impeller-replacement-when-they-fail',
];

function formatDate(dateString: string): string {
  return parseLocalDate(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * "Start Here" editor's picks block: lead feature plus a numbered list of
 * cornerstone guides, framed by hairline rules.
 */
export function StartHereSection() {
  const lead = getArticleBySlug(LEAD_SLUG);

  const cornerstones: { num: string; title: string; href: string; eyebrow: string }[] = [];
  for (const slug of CORNERSTONE_SLUGS) {
    const a = getArticleBySlug(slug);
    if (a) {
      cornerstones.push({
        num: String(cornerstones.length + 1).padStart(2, '0'),
        title: a.title,
        href: `/blog/${a.slug}`,
        eyebrow: a.category,
      });
    }
  }
  cornerstones.push({
    num: String(cornerstones.length + 1).padStart(2, '0'),
    title: 'Live Mercury price list',
    href: '/pricing-reference',
    eyebrow: 'Reference',
  });

  return (
    <section
      aria-labelledby="start-here-heading"
      className="border-t border-b border-repower-navy-900/10 py-10 md:py-12 mb-14 md:mb-16"
    >
      <h2
        id="start-here-heading"
        className="font-sans font-semibold text-[11px] uppercase tracking-[0.3em] text-repower-navy-900/50 mb-8"
      >
        Start Here
      </h2>

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-10 lg:gap-16">
        {/* Lead feature */}
        {lead && (
          <article>
            <Link
              to={`/blog/${lead.slug}`}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
            >
              <p className="font-sans font-semibold text-[10px] uppercase tracking-[0.22em] text-repower-mercury-red mb-3">
                {lead.category}
              </p>
              <h3
                className="font-display font-bold text-repower-navy-900 group-hover:text-repower-mercury-red transition-colors duration-200"
                style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', letterSpacing: '-0.025em', lineHeight: 1.12 }}
              >
                <span className="bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[length:0%_1px] bg-left-bottom group-hover:bg-[length:100%_1px] transition-[background-size] duration-300">
                  {lead.title}
                </span>
              </h3>
              <p className="mt-4 font-sans text-[15px] text-repower-navy-900/60 leading-relaxed line-clamp-2 max-w-[62ch]">
                {getCleanDescription(lead)}
              </p>
              <p className="mt-4 font-sans text-xs text-repower-navy-900/45">
                {formatDate(lead.datePublished)}
                <span aria-hidden="true" className="mx-2 text-repower-navy-900/25">·</span>
                {lead.readTime}
              </p>
            </Link>
          </article>
        )}

        {/* Numbered cornerstone list */}
        <nav aria-label="Cornerstone guides">
          <ol className="divide-y divide-repower-navy-900/10 border-t border-repower-navy-900/10 lg:border-t-0">
            {cornerstones.map(item => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className="group flex items-baseline gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
                >
                  <span className="font-sans tabular-nums text-[13px] text-repower-navy-900/35 shrink-0 w-6">
                    {item.num}
                  </span>
                  <span>
                    <span className="block font-display font-semibold text-[15px] md:text-[16px] text-repower-navy-900 group-hover:text-repower-mercury-red transition-colors duration-200 leading-snug">
                      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[length:0%_1px] bg-left-bottom group-hover:bg-[length:100%_1px] transition-[background-size] duration-300">
                        {item.title}
                      </span>
                    </span>
                    <span className="mt-1 block font-sans text-[10px] uppercase tracking-[0.18em] text-repower-navy-900/40">
                      {item.eyebrow}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}
