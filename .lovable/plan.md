## Goal

Prevent `/trade-in-value` from rendering a stale 404 when:
- A new deploy ships and the user's already-loaded HTML references chunk hashes that no longer exist on the CDN (the lazy import throws → currently bubbles up and can fall through to the `*` route's `NotFound`).
- A preview refresh briefly races a rolling deploy.

The route exists in `src/App.tsx` (`/trade-in-value` → `lazy(() => import("./pages/TradeInValuePage"))`), so this is purely a chunk-load resilience problem, not a routing problem.

## Approach

Add a small `lazyWithRetry` helper and apply it to the trade-in route (and we can later opt other high-traffic public routes in the same way).

### Changes

**1. New file: `src/lib/lazyWithRetry.ts`**

Wraps `React.lazy` with:
- Up to 2 retries with brief backoff (200ms, 400ms) on dynamic-import failure.
- If retries fail AND the error looks like a chunk-load error (`Loading chunk`, `Failed to fetch dynamically imported module`, `Importing a module script failed`, `ChunkLoadError`), force a **one-time** `window.location.reload()` guarded by a `sessionStorage` flag (`chunkReload:<key>`) to prevent reload loops.
- After the reload trigger, return a never-resolving promise so Suspense keeps showing the route loader instead of bubbling the error to the catch-all `NotFound` route.
- Clears the sessionStorage flag on a successful load so the next stale-deploy can reload again.

**2. `src/App.tsx`**

- Import `lazyWithRetry`.
- Change the `TradeInValuePage` lazy declaration from:
  ```ts
  const TradeInValuePage = lazy(() => import("./pages/TradeInValuePage"));
  ```
  to:
  ```ts
  const TradeInValuePage = lazyWithRetry(
    () => import("./pages/TradeInValuePage"),
    "TradeInValuePage"
  );
  ```

That's it — no router config changes, no NotFound changes, no service-worker work needed. Existing `<Suspense fallback={<RouteLoader />}>` continues to cover the load.

### Why this works

- Vercel's SPA fallback already serves `index.html` for unknown paths, so the URL itself is never 404. The real failure mode is the JS chunk 404 after a deploy, which the retry+reload pattern handles correctly.
- The `sessionStorage` flag prevents an infinite reload if the failure is unrelated to a stale deploy (e.g., user is offline).

### Out of scope

- Other lazy-loaded routes — easy to migrate later by swapping `lazy(...)` → `lazyWithRetry(..., "Name")`. Keeping this PR scoped to the trade-in route as requested.
- Service worker / offline handling.
