/**
 * Single source of truth for Harris Boat Works Google review totals.
 *
 * Live numbers are pulled via the `google-places` edge function
 * (see `useGooglePlaceData` / `useGoogleReviewStats`). This constant is the
 * fallback used when the edge function is loading or unavailable, AND the
 * value displayed in non-React contexts (PDFs, the activity feed, static
 * hero stats baked into bundles).
 *
 * Update ONLY this file when the live Google totals change.
 */
export const GOOGLE_REVIEWS_FALLBACK = {
  rating: 4.7,
  totalReviews: 326,
  /** ISO date the fallback was last verified against the live Google listing. */
  asOf: '2026-09-17',
} as const;

/**
 * Real repower reviews shown on the pricing-reference page and other
 * customer-proof blocks. Add new reviews here; the component renders from
 * this array. Keep wording verbatim from the original Google review.
 */
export const GOOGLE_REVIEWS = [
  {
    authorName: 'Erik F.',
    text: 'Great service. Great price on a new outboard. Called them from out of town and organized purchase and pick up, very easy.',
    source: 'Google review',
  },
] as const;

export type GoogleReviewEntry = (typeof GOOGLE_REVIEWS)[number];

/** Google Maps profile and Reviews tab verified in the live UI on 2026-10-05. */
export const GOOGLE_REVIEWS_URL =
  'https://www.google.com/maps/place/Harris+Boat+Works/@44.1217924,-78.2436722,17z/data=!4m8!3m7!1s0x89d5ea50a9347369:0x4af31bbc949182!8m2!3d44.1217924!4d-78.2410973!9m1!1b1!16s%2Fg%2F1vfwdvm0?entry=ttu';
