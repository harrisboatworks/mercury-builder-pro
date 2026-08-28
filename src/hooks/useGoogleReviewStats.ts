import { useGooglePlaceData } from './useGooglePlaceData';
import { GOOGLE_REVIEWS_FALLBACK } from '@/config/googleReviews';

export interface GoogleReviewStats {
  rating: number;
  totalReviews: number;
  /** true when the numbers came from the live Google Places edge function. */
  isLive: boolean;
  isLoading: boolean;
}

/**
 * Returns Harris Boat Works' current Google rating + review count.
 * Always returns usable numbers — falls back to GOOGLE_REVIEWS_FALLBACK
 * while loading or when the edge function errors.
 */
export function useGoogleReviewStats(): GoogleReviewStats {
  const { data, isLoading } = useGooglePlaceData();

  if (data?.rating && data?.totalReviews) {
    return {
      rating: data.rating,
      totalReviews: data.totalReviews,
      isLive: true,
      isLoading: false,
    };
  }

  return {
    rating: GOOGLE_REVIEWS_FALLBACK.rating,
    totalReviews: GOOGLE_REVIEWS_FALLBACK.totalReviews,
    isLive: false,
    isLoading,
  };
}
