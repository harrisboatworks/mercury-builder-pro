import { describe, expect, it } from 'vitest';
import type { GoogleReview } from '@/hooks/useGooglePlaceData';
import {
  formatReviewerName,
  selectDisplayReviews,
  selectFeaturedReviews,
} from './googleReviewsDisplay';

function review(partial: Partial<GoogleReview> & Pick<GoogleReview, 'authorName' | 'text'>): GoogleReview {
  return {
    rating: 5,
    time: 1,
    relativeTime: '2 months ago',
    ...partial,
  };
}

describe('googleReviewsDisplay', () => {
  it('formats reviewer names without inventing a last name', () => {
    expect(formatReviewerName('Erik Ferguson')).toBe('Erik F.');
    expect(formatReviewerName('Gisele')).toBe('Gisele');
    expect(formatReviewerName('   ')).toBe('Google user');
  });

  it('keeps only reviews that still have visible Google text', () => {
    const selected = selectDisplayReviews([
      review({ authorName: 'Erik Ferguson', text: 'Great service. Great price on a new outboard.' }),
      review({ authorName: 'Blank', text: '   ' }),
      review({ authorName: 'Also blank', text: '' }),
    ]);

    expect(selected).toHaveLength(1);
    expect(selected[0].authorName).toBe('Erik Ferguson');
    expect(selected[0].text).toBe('Great service. Great price on a new outboard.');
  });

  it('returns an empty list when Places has no reviews', () => {
    expect(selectDisplayReviews(undefined)).toEqual([]);
    expect(selectDisplayReviews([])).toEqual([]);
    expect(selectFeaturedReviews(undefined)).toEqual([]);
  });

  it('features long 5-star motor or service reviews first', () => {
    const selected = selectFeaturedReviews([
      review({
        authorName: 'Short',
        text: 'Nice place.',
      }),
      review({
        authorName: 'Rental',
        rating: 4,
        text: 'Had a great day on the water touring Rice Lake on a cruise pontoon boat with friendly staff throughout.',
      }),
      review({
        authorName: 'Erik Ferguson',
        text: 'Great service. Great price on a new outboard. Called them from out of town and organized purchase and pick up, very easy.',
      }),
    ]);

    expect(selected.map((item) => item.authorName)).toEqual(['Erik Ferguson']);
  });
});
