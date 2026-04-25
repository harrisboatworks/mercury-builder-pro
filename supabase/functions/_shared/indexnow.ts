// Shared IndexNow helper for edge functions.
// Fire-and-forget: never throws, never blocks the caller.
//
// Use after any update that changes content visible at a URL we want
// search engines and AI crawlers to recrawl quickly:
//   - inventory sync (in-stock changes)
//   - price audit / price changes
//   - blog notifications (new post)
//   - case study / location content updates (deploy-time)
//
// Note: We deliberately DO NOT ping markdown twin (.md) URLs — those carry
// X-Robots-Tag: noindex and are for AI agents, not search indexing.

const HOST = 'www.mercuryrepower.ca';
const SITE = `https://${HOST}`;
const KEY = '03999430e4bae3d7d7be108f62646dbf';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

export const KEY_URLS = [
  '/',
  '/motors',
  '/quote',
  '/case-studies',
  '/locations',
  '/agents',
  '/promotions',
  '/sitemap.xml',
];

function normalize(u: string): string | null {
  try {
    const parsed = new URL(u, SITE);
    parsed.host = HOST;
    parsed.protocol = 'https:';
    // Block .md twins from being submitted to IndexNow (noindex routes).
    if (parsed.pathname.endsWith('.md')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Submit a list of URLs to IndexNow. Fire-and-forget.
 *
 * @param urls - Absolute or path-relative URLs. Deduplicated and normalized.
 * @param reason - Short tag for logs (e.g. 'inventory-sync', 'price-audit').
 */
export function pingIndexNow(urls: string[], reason: string): void {
  // Don't await — never block edge function response on this.
  (async () => {
    try {
      const list = Array.from(
        new Set(urls.map(normalize).filter((u): u is string => !!u)),
      ).slice(0, 10000);

      if (list.length === 0) {
        console.log(`[indexnow:${reason}] no valid urls, skipping`);
        return;
      }

      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: HOST,
          key: KEY,
          keyLocation: KEY_LOCATION,
          urlList: list,
        }),
      });

      console.log(
        `[indexnow:${reason}] submitted ${list.length} urls -> ${res.status}`,
      );
    } catch (err) {
      console.error(`[indexnow:${reason}] failed:`, err);
    }
  })();
}

/**
 * Convenience: ping the homepage + key URLs + a list of motor model_keys.
 */
export function pingMotorUpdates(modelKeys: string[], reason: string): void {
  const urls = [
    ...KEY_URLS.map((p) => `${SITE}${p}`),
    ...modelKeys
      .filter((k) => !!k)
      .map((k) => `${SITE}/motors/${k}`),
  ];
  pingIndexNow(urls, reason);
}
