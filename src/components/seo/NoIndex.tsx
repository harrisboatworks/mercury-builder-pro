import { Helmet } from '@/lib/helmet';

/**
 * Emits <meta name="robots" content="noindex, nofollow"> for gated,
 * transactional, or per-session SPA routes that must never be indexed.
 * Use on admin, auth, deposit/payment success, quote-summary, and staging pages.
 */
export function NoIndex() {
  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
    </Helmet>
  );
}
