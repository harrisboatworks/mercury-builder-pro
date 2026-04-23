// src/lib/site.ts
// Production URL for QR codes and public links
// Prioritizes: VITE_SITE_URL env var → hardcoded production domain → window.location.origin
// Always normalize to canonical www host. If a stale env var (e.g. legacy
// quote.harrisboatworks.ca) is set in the build environment, ignore it and
// use the production canonical domain instead. This prevents canonical bleed
// from old environments overriding SEO tags at runtime.
const ENV_SITE_URL = (import.meta as any).env?.VITE_SITE_URL as string | undefined;
const CANONICAL_HOST = 'https://www.mercuryrepower.ca';
const isAcceptableEnvSiteUrl =
  !!ENV_SITE_URL &&
  /^https:\/\/(www\.)?mercuryrepower\.ca\/?$/.test(ENV_SITE_URL.replace(/\/$/, '') + '/');

export const SITE_URL = (
  isAcceptableEnvSiteUrl ? ENV_SITE_URL!.replace(/\/$/, '') : CANONICAL_HOST
);
