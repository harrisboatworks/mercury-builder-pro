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
  totalReviews: 318,
  /** ISO date the fallback was last verified against the live Google listing. */
  asOf: '2026-07-20',
} as const;

export const GOOGLE_REVIEWS_URL =
  'https://www.google.com/maps/place/Harris+Boat+Works/@44.1264476,-78.2111697,17z/data=!4m8!3m7!1s0x89d583f7a1111111:0x1234567890abcdef!8m2!3d44.1264476!4d-78.2111697!9m1!1b1!16s%2Fg%2F1tdqqt8h?entry=ttu';
