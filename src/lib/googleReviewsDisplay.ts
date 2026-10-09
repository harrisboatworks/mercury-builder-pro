import type { GoogleReview } from '@/hooks/useGooglePlaceData';

const FEATURED_REVIEW_KEYWORDS = /repower|mercury|motor|service/i;

export function formatReviewerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Google user';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

/** Every Places review that still has visible text. No invented copy. */
export function selectDisplayReviews(
  reviews: GoogleReview[] | undefined,
  limit = 6,
): GoogleReview[] {
  if (!reviews || reviews.length === 0) return [];
  return reviews
    .filter((review) => (review.text?.trim().length ?? 0) > 0)
    .slice(0, limit);
}

/** Homepage featured set: 5-star, substantial text, prefer motor/service mentions. */
export function selectFeaturedReviews(reviews: GoogleReview[] | undefined): GoogleReview[] {
  if (!reviews || reviews.length === 0) return [];
  const eligible = reviews.filter(
    (review) => review.rating === 5 && (review.text?.trim().length ?? 0) >= 100,
  );
  const preferred = eligible.filter((review) => FEATURED_REVIEW_KEYWORDS.test(review.text));
  const rest = eligible.filter((review) => !FEATURED_REVIEW_KEYWORDS.test(review.text));
  return [...preferred, ...rest].slice(0, 3);
}
