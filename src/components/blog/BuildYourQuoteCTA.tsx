import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Inline conversion CTA for high-traffic blog posts.
 * Routes readers into the quote funnel at /quote/motor-selection,
 * with a secondary link to the repower hub.
 */
export function BuildYourQuoteCTA({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`my-10 rounded-2xl border border-repower-navy-900/10 bg-repower-paper p-6 md:p-8 shadow-sm ${className}`}
      aria-label="Build a Mercury quote"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="h-px w-8 bg-repower-mercury-red" />
        <span className="font-sans text-[13px] md:text-sm font-semibold text-repower-mercury-red uppercase tracking-[0.24em]">
          Ready when you are
        </span>
      </div>
      <h3 className="font-display font-bold text-repower-navy-900 text-2xl md:text-[28px] mb-3" style={{ letterSpacing: '-0.02em' }}>
        Thinking about a new Mercury?
      </h3>
      <p className="font-sans text-[16px] md:text-[17px] text-repower-navy-900/75 leading-relaxed mb-6">
        Build a real quote with live Canadian pricing in about 90 seconds. No call for price games.
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          to="/quote/motor-selection"
          className="inline-flex items-center gap-2 bg-repower-mercury-red text-white font-semibold px-6 py-3 rounded-lg hover:bg-repower-mercury-red-deep transition no-underline"
        >
          Build Your Quote
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/repower"
          className="text-repower-navy-900/75 hover:text-repower-mercury-red font-medium underline underline-offset-4"
        >
          Or see how repowering works
        </Link>
      </div>
    </aside>
  );
}
