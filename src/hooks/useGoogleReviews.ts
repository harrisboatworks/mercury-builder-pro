import { useMemo } from 'react';
import { useGooglePlaceData } from '@/hooks/useGooglePlaceData';
import { formatReviewerName, selectDisplayReviews } from '@/lib/googleReviewsDisplay';

export interface LiveGoogleTestimonial {
  name: string;
  rating: number;
  text: string;
  date: string;
  isGoogleReview: true;
}

export const useGoogleReviews = () => {
  const { data, isLoading } = useGooglePlaceData();
  const testimonials = useMemo<LiveGoogleTestimonial[]>(
    () =>
      selectDisplayReviews(data?.reviews).map((review) => ({
        name: formatReviewerName(review.authorName),
        rating: review.rating,
        text: review.text.trim(),
        date: review.relativeTime,
        isGoogleReview: true as const,
      })),
    [data?.reviews],
  );

  return { testimonials, loading: isLoading };
};
