# Harden Lazy Route Loading — Prevent Spurious 404s

## Problem

The `/trade-in-value` preview briefly showed the app's NotFound 404 even though the route is registered and the server returns HTTP 200. Root cause is most likely a transient lazy-chunk fetch failure that didn't match our chunk-error regex, so the import threw and React Router fell through to the catch-all NotFound route.

## Goals

1. Catch more failure shapes as "stale chunk" so the auto-reload kicks in.
2. Make any future occurrence trivial to diagnose via console logs.
3. Add a lightweight error boundary around lazy routes so a failed import shows a "Reload" button instead of a confusing 404.

## Changes

### 1. `src/lib/lazyWithRetry.ts` — broaden detection + log

- Expand the chunk-error regex to also match:
  - `TypeError: Failed to fetch` (generic network error during dynamic import)
  - `NetworkError when attempting to fetch resource` (Firefox)
  - `error loading dynamically imported module` (Vite variant)
  - `Unable to preload CSS` (Vite CSS chunk)
- On every failure, `console.warn('[lazyWithRetry]', key, attempt, message)` so the logs make the path obvious.
- On final failure (post retries) that ISN'T classified as a chunk error, `console.error('[lazyWithRetry] FATAL', key, lastError)` before re-throwing.

### 2. New `src/components/LazyRouteBoundary.tsx`

Small error boundary specifically for lazy routes:
- Catches errors thrown by `React.lazy` after retries are exhausted.
- Renders a minimal centered card: "Couldn't load this page" + a "Reload" button that calls `window.location.reload()`.
- Logs the error with `[LazyRouteBoundary]` prefix.

### 3. `src/App.tsx` — wrap `<Routes>` with the boundary

Wrap the existing `<Suspense>` block with `<LazyRouteBoundary>` so any lazy import failure that escapes `lazyWithRetry` shows the recovery card instead of falling through to NotFound.

### 4. No changes to `TradeInValuePage.tsx` or `TradeInValuation.tsx`

Those files are correct as-is. Verified:
- `App.tsx:499` registers `<Route path="/trade-in-value" element={<TradeInValuePage />} />`
- `TradeInValuePage.tsx` has `export default function TradeInValuePage()`
- `TradeInValuation.tsx` exports `TradeInValuation` (named) — matches the import
- Dev server returns HTTP 200, no Vite errors in the log

## Out of scope

- Changing the route registration or page code.
- Adding server-side logging — Vite already logs everything we need; the gap is on the client.
- Changing the NotFound component itself.

## Verification

After changes:
1. Hard-refresh `/trade-in-value` in the preview — should load normally.
2. In DevTools, manually throttle/offline and navigate to a lazy route — should see `[lazyWithRetry]` warnings, then the recovery card (not NotFound).
3. Existing routes continue to work; no behavior change on the happy path.
