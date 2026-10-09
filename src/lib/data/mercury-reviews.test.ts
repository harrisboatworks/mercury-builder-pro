import { describe, expect, it } from 'vitest';
import {
  STALE_SMART_REVIEW_STORAGE_KEY,
  clearStaleSmartReviewCache,
  getAllMercuryReviews,
  getAverageRating,
  getRandomReview,
  getReviewCount,
  getReviewsForMotor,
  mercuryReviews,
  mercuryReviewsExpanded,
} from './mercury-reviews';

describe('mercury-reviews catalogue', () => {
  it('no longer ships invented motor-specific testimonials', () => {
    expect(mercuryReviews).toEqual([]);
    expect(mercuryReviewsExpanded).toEqual([]);
    expect(getAllMercuryReviews()).toEqual([]);
    expect(getReviewsForMotor(115)).toEqual([]);
    expect(getRandomReview(150)).toBeUndefined();
    expect(getReviewCount(90)).toBe(0);
    expect(getAverageRating(60)).toBeNull();
  });

  it('does not keep the old placeholder reviewer names', () => {
    const source = `${JSON.stringify(getAllMercuryReviews())}${JSON.stringify(mercuryReviewsExpanded)}`;
    expect(source).not.toContain('Tony Russo');
    expect(source).not.toContain('Jim Crawford');
    expect(source).not.toContain('My dad bought his first Merc');
  });

  it('clears a same-day cached placeholder from localStorage', () => {
    localStorage.setItem(
      STALE_SMART_REVIEW_STORAGE_KEY,
      JSON.stringify({
        '115_default': {
          lastViewDate: new Date().toDateString(),
          selectedReview: {
            motorHP: 115,
            comment: 'My dad bought his first Merc from Harris in 1971.',
            reviewer: 'Tony Russo',
            location: 'Oshawa, ON',
            rating: 5,
            verified: true,
          },
          viewCount: 1,
        },
      }),
    );

    clearStaleSmartReviewCache();

    expect(localStorage.getItem(STALE_SMART_REVIEW_STORAGE_KEY)).toBeNull();
  });
});
