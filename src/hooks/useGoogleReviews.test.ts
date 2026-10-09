import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlaceData } from '@/hooks/useGooglePlaceData';
import { useGoogleReviews } from './useGoogleReviews';

const place = vi.hoisted(() => ({
  current: {
    data: null as PlaceData | null,
    isLoading: false,
    error: null,
  },
}));

vi.mock('@/hooks/useGooglePlaceData', () => ({
  useGooglePlaceData: () => place.current,
}));

describe('useGoogleReviews', () => {
  it('returns no testimonials when Places is empty instead of mock quotes', () => {
    place.current = { data: null, isLoading: false, error: null };

    const { result } = renderHook(() => useGoogleReviews());

    expect(result.current.testimonials).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('maps live Places reviews without inventing a motor or town', () => {
    place.current = {
      data: {
        name: 'Harris Boat Works',
        rating: 4.7,
        totalReviews: 333,
        reviews: [
          {
            authorName: 'Erik Ferguson',
            rating: 5,
            text: 'Great service. Great price on a new outboard.',
            time: 1710000000,
            relativeTime: '4 months ago',
          },
        ],
      },
      isLoading: false,
      error: null,
    };

    const { result } = renderHook(() => useGoogleReviews());

    expect(result.current.testimonials).toEqual([
      {
        name: 'Erik F.',
        rating: 5,
        text: 'Great service. Great price on a new outboard.',
        date: '4 months ago',
        isGoogleReview: true,
      },
    ]);
  });
});
