// Exact browser origins owned or controlled by HBW.
//
// The Vercel aliases below are stable domains attached to Vercel project
// prj_WlyZxulIxEw8F4zowFtS0vI6TpwL in team team_YZT1UoU1kWj91icpotBPCpVv.
// Generated deployment and branch aliases are intentionally not matched.
// Public origins require HTTPS; local development permits HTTP on any port.
const ALLOWED_HTTPS_ORIGINS = new Set([
  "https://www.mercuryrepower.ca",
  "https://mercuryrepower.ca",
  "https://quote.harrisboatworks.ca",
  "https://www.mercuryquote.ca",
  "https://mercuryquote.ca",
  "https://mercury-builder-pro.vercel.app",
  "https://mercury-builder-pro-hbw.vercel.app",
  "https://mercury-builder-pro-git-main-hbw.vercel.app",
]);

export function resolveAllowedBrowserOrigin(rawOrigin: string | null | undefined): string | null {
  if (!rawOrigin) return null;

  try {
    const parsed = new URL(rawOrigin);
    const normalizedOrigin = parsed.origin.toLowerCase();

    if (ALLOWED_HTTPS_ORIGINS.has(normalizedOrigin)) return normalizedOrigin;
    if (
      parsed.protocol === "http:"
      && (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost")
    ) {
      return normalizedOrigin;
    }
  } catch {
    return null;
  }

  return null;
}
