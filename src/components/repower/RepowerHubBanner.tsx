import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * RepowerHubBanner
 * Visible on the 25 articles that belong to the /repower hub cluster.
 * Provides a contextual breadcrumb/up-link to the pillar page.
 * Slug membership is driven by REPOWER_HUB_SLUGS in src/data/blogClusters.ts.
 */
export function RepowerHubBanner() {
  return (
    <div className="mb-6 max-w-[880px] mx-auto">
      <Link
        to="/repower"
        className="group flex items-center justify-between gap-3 rounded-lg border border-repower-mercury-red/30 bg-repower-mercury-red/[0.04] px-4 py-3 transition-colors hover:border-repower-mercury-red hover:bg-repower-mercury-red/[0.08]"
      >
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded bg-repower-mercury-red px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
            Series
          </span>
          <span className="text-repower-navy-900">
            Part of the <strong>HBW Boat Repower Guide</strong>
          </span>
        </div>
        <span className="hidden items-center gap-1 text-xs font-semibold text-repower-mercury-red sm:inline-flex">
          Open the guide
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}
