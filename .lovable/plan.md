# Centralize Google review totals

## Audit findings

Live (already pull from `google-places` edge function via `useGooglePlaceData`):
- `src/components/business/GoogleRatingBadge.tsx` ✅
- `src/components/reviews/GoogleReviewsCarousel.tsx` ✅

Hardcoded values still present:
1. `src/lib/activityGenerator.ts` — `generateReviewCount()` returns literal `301`.
2. `src/components/repower/heroVariations.tsx` line 89–90 — `'301'` Google reviews and `'4.6'` star rating in the `frustration` hero variation stats array.
3. `src/pages/Repower.tsx` line 56/439 — consumes `generateReviewCount()`.
4. `src/pages/Promotions.tsx` line 200/210 — consumes `generateReviewCount()`.

No JSON-LD `aggregateRating` blocks use hardcoded review counts (only blog `Review` schemas with `ratingValue: "1"` for misleading-claim refutations — unrelated).

## Plan

### 1. New single source of truth: `src/config/googleReviews.ts`

```ts
// One place. Update only this constant when live totals change.
export const GOOGLE_REVIEWS_FALLBACK = {
  rating: 4.6,
  totalReviews: 301,
  asOf: '2026-05-17',
} as const;

export const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps/...'; // moved from GoogleRatingBadge
```

### 2. New hook: `src/hooks/useGoogleReviewStats.ts`

Thin wrapper around `useGooglePlaceData` that returns `{ rating, totalReviews, isLive }` — falling back to `GOOGLE_REVIEWS_FALLBACK` when the edge function hasn't resolved or errored. This way every consumer gets live numbers when available and the same fallback otherwise.

### 3. Refactor consumers

- `src/lib/activityGenerator.ts` `generateReviewCount()` → return `GOOGLE_REVIEWS_FALLBACK.totalReviews` (keeps it sync for non-React callers; deprecate-comment pointing to the hook).
- `src/components/repower/heroVariations.tsx` — convert the `frustration` variation's stats to a function/getter that accepts live stats, OR keep static but sourced from `GOOGLE_REVIEWS_FALLBACK` (simpler — Repower.tsx already calls the hook and can override the two stat values at render time).
- `src/pages/Repower.tsx` — replace `generateReviewCount()` with `useGoogleReviewStats()`; inject live total into the `frustration` hero stats before rendering.
- `src/pages/Promotions.tsx` — replace `generateReviewCount()` with `useGoogleReviewStats()`.
- `src/components/business/GoogleRatingBadge.tsx` — import `GOOGLE_REVIEWS_URL` from config; keep edge-function-backed display, but fall through to fallback via the new hook so the badge never disappears on a cold cache.

### 4. Verify

- Grep for `301`, `295`, `170`, `4.6` near `review|rating` to confirm zero remaining hardcoded literals outside `googleReviews.ts`.
- Build pass.

## Technical notes

- No backend change. No edge function change. No new dependencies.
- `generateReviewCount()` stays exported (used in `activityGenerator` callers); it just reads from the new config so updating the live number is a one-line edit in `src/config/googleReviews.ts`.
- The hook is React-only; the constant is the fallback for non-React contexts (PDFs, activity generator, SEO strings if ever needed).
