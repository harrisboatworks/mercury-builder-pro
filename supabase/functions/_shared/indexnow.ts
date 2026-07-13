// Shared IndexNow helper for edge functions.
// Fire-and-forget: never throws, never blocks the caller.
//
// IMPORTANT — DO NOT re-blast URLs on every sync run.
//
// Callers MUST pass ONLY URLs whose user-visible content actually changed
// (e.g. availability flipped, price changed, description edited). Do not
// count `updated_at` / `last_stock_check` timestamp churn as a change.
//
// A persistent 24-hour cooldown (via the `indexnow_submissions` table)
// filters accidental re-submissions. Hard cap per call is 200 URLs; if a
// caller ever exceeds that it's a bug — we log loudly and truncate.
//
// Never ping .md twin URLs — they carry X-Robots-Tag: noindex.

import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const HOST = 'www.mercuryrepower.ca';
const SITE = `https://${HOST}`;
const KEY = '03999430e4bae3d7d7be108f62646dbf';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const MAX_URLS_PER_CALL = 200;
const COOLDOWN_HOURS = 24;

// Real, prerendered, indexable landing pages. NOT auto-blasted with every
// sync — callers must opt in via `pingKeyUrls(reason)` when the content on
// these pages actually changed.
//
// Removed vs. previous version:
//   - `/sitemap.xml` (IndexNow expects page URLs, not the sitemap)
//   - `/quote` (301-redirects to `/quote/motor-selection`)
//   - `/motors` (no such rendered route — real routes are `/motors/:slug`)
export const KEY_URLS = [
  '/',
  '/quote/motor-selection',
  '/case-studies',
  '/locations',
  '/agents',
  '/promotions',
];

function normalize(u: string): string | null {
  try {
    const parsed = new URL(u, SITE);
    parsed.host = HOST;
    parsed.protocol = 'https:';
    if (parsed.pathname.endsWith('.md')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Submit a list of URLs to IndexNow. Fire-and-forget.
 *
 * @param urls   Absolute or path-relative URLs. Only URLs whose content
 *               actually changed since last submission should be passed.
 * @param reason Short tag for logs (e.g. 'inventory-sync', 'price-audit').
 */
export function pingIndexNow(urls: string[], reason: string): void {
  // Never block the caller — always run async and swallow errors.
  (async () => {
    try {
      const normalized = Array.from(
        new Set(urls.map(normalize).filter((u): u is string => !!u)),
      );

      if (normalized.length === 0) {
        console.log(`[indexnow:${reason}] no valid urls, skipping`);
        return;
      }

      if (normalized.length > MAX_URLS_PER_CALL) {
        console.warn(
          `[indexnow:${reason}] WARNING: caller submitted ${normalized.length} urls; capping at ${MAX_URLS_PER_CALL}. ` +
            `This almost always means the caller is re-pinging unchanged URLs — fix the caller to only include actually-changed rows.`,
        );
      }

      const capped = normalized.slice(0, MAX_URLS_PER_CALL);

      // ── 24h cooldown filter ────────────────────────────────────────────
      const supabase = getServiceClient();
      let toSubmit = capped;
      let filteredByCooldown = 0;

      if (supabase) {
        try {
          const cutoff = new Date(
            Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000,
          ).toISOString();

          const { data: recent } = await supabase
            .from('indexnow_submissions')
            .select('url, last_submitted_at')
            .in('url', capped)
            .gte('last_submitted_at', cutoff);

          const recentSet = new Set((recent || []).map((r: any) => r.url));
          toSubmit = capped.filter((u) => !recentSet.has(u));
          filteredByCooldown = capped.length - toSubmit.length;
        } catch (cooldownErr) {
          console.error(
            `[indexnow:${reason}] cooldown lookup failed, submitting without filter:`,
            cooldownErr,
          );
        }
      }

      if (toSubmit.length === 0) {
        console.log(
          `[indexnow:${reason}] submitted 0 urls (${filteredByCooldown} filtered by ${COOLDOWN_HOURS}h cooldown, 0 unchanged)`,
        );
        return;
      }

      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: HOST,
          key: KEY,
          keyLocation: KEY_LOCATION,
          urlList: toSubmit,
        }),
      });

      console.log(
        `[indexnow:${reason}] submitted ${toSubmit.length} urls -> ${res.status} ` +
          `(${filteredByCooldown} filtered by ${COOLDOWN_HOURS}h cooldown)`,
      );

      // Record submissions so the cooldown works next time.
      if (supabase && res.ok) {
        try {
          const nowIso = new Date().toISOString();
          const rows = toSubmit.map((url) => ({
            url,
            last_submitted_at: nowIso,
            last_reason: reason,
            submission_count: 1,
          }));
          // upsert by url; increment count via a follow-up RPC isn't worth it —
          // rely on the trigger-free pattern of overwriting the count as 1
          // (accurate-enough for observability of "recently pinged").
          await supabase
            .from('indexnow_submissions')
            .upsert(rows, { onConflict: 'url', ignoreDuplicates: false });
        } catch (recordErr) {
          console.error(
            `[indexnow:${reason}] failed to record submissions:`,
            recordErr,
          );
        }
      }
    } catch (err) {
      console.error(`[indexnow:${reason}] failed:`, err);
    }
  })();
}

/**
 * Ping specific motor detail pages by model_key. Callers MUST pass only
 * motors whose user-visible content actually changed.
 */
export function pingMotorUpdates(modelKeys: string[], reason: string): void {
  const urls = modelKeys
    .filter((k) => !!k)
    .map((k) => `${SITE}/motors/${k}`);

  if (urls.length === 0) {
    console.log(`[indexnow:${reason}] no motor keys changed, skipping`);
    return;
  }

  pingIndexNow(urls, reason);
}

/**
 * Explicit, opt-in ping for the key landing pages. Use only when the content
 * on those pages actually changed (e.g. promotions edited, homepage copy
 * updated at deploy). NOT to be called on every inventory sync.
 */
export function pingKeyUrls(reason: string, extraPaths: string[] = []): void {
  const urls = [
    ...KEY_URLS.map((p) => `${SITE}${p}`),
    ...extraPaths.map((p) =>
      p.startsWith('http') ? p : `${SITE}${p.startsWith('/') ? p : `/${p}`}`,
    ),
  ];
  pingIndexNow(urls, reason);
}
