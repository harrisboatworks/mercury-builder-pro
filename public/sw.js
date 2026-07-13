// Retirement worker (v2 2026-07-13) for visitors still controlled by the former PWA.
// This worker exists solely to evict itself and any caches it produced. It
// never intercepts fetches, and it fires an extra safety net on non-canonical
// hosts (any *.harrisboatworks.ca alias, lovable preview domains, etc.) so
// that the server-side 301 to https://www.mercuryrepower.ca can take effect
// on the next navigation.
const CACHE_VERSION = '2026-07-13-v2';
const CANONICAL_HOST = 'www.mercuryrepower.ca';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    } catch (_) {
      // best-effort
    }
    try {
      await self.registration.unregister();
    } catch (_) {
      // best-effort
    }
    try {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      await Promise.all(windows.map((client) => {
        // On non-canonical hosts, force a reload so the server 301 to the
        // canonical www host fires now that the SW is unregistered.
        try {
          const url = new URL(client.url);
          if (url.hostname !== CANONICAL_HOST) {
            return client.navigate(client.url);
          }
        } catch (_) {}
        return client.navigate(client.url);
      }));
    } catch (_) {
      // best-effort
    }
  })());
});

// Passthrough: never intercept. Present only to reassure some browsers that
// this worker is "healthy" until it finishes retiring itself.
self.addEventListener('fetch', () => {});

// Log version for diagnostics.
void CACHE_VERSION;
