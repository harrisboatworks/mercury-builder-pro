import { describe, expect, it } from 'vitest';
import {
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
});
