import { lazy, type ComponentType } from 'react';

/**
 * Wraps React.lazy with resilience against stale chunk 404s that happen after
 * a deploy: the user's HTML still references an old chunk hash that no longer
 * exists on the CDN, so the dynamic import throws.
 *
 * Strategy:
 *  1. Try the import.
 *  2. On failure, retry up to `retries` times with a small backoff.
 *  3. If still failing AND we haven't already reloaded for this session,
 *     force a one-time hard reload to fetch the fresh index.html (which
 *     references the new chunk hashes). A sessionStorage flag prevents
 *     reload loops if the failure isn't actually a stale-deploy issue.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  key: string,
  retries = 2
) {
  const RELOAD_FLAG = `chunkReload:${key}`;

  return lazy(async () => {
    let lastError: unknown;

    for (let i = 0; i <= retries; i++) {
      try {
        const mod = await factory();
        // Success — clear any prior reload flag so future stale deploys can
        // trigger another reload.
        try {
          sessionStorage.removeItem(RELOAD_FLAG);
        } catch {}
        return mod;
      } catch (err) {
        lastError = err;
        // Brief backoff before retrying.
        await new Promise((r) => setTimeout(r, 200 * (i + 1)));
      }
    }

    // All retries exhausted. If this looks like a chunk-load error and we
    // haven't already attempted a reload this session, do one hard reload.
    const message = String((lastError as { message?: string })?.message ?? lastError ?? '');
    const looksLikeChunkError =
      /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(
        message
      );

    let alreadyReloaded = false;
    try {
      alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === '1';
    } catch {}

    if (looksLikeChunkError && !alreadyReloaded && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(RELOAD_FLAG, '1');
      } catch {}
      window.location.reload();
      // Return a never-resolving promise so Suspense keeps showing the route
      // loader during the reload, instead of bubbling to the NotFound route.
      return new Promise<{ default: T }>(() => {});
    }

    throw lastError;
  });
}
