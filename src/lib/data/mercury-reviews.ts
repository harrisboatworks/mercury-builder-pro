export interface CustomerReview {
  motorHP: number;
  motorModel?: string;
  comment: string;
  reviewer: string;
  location: string;
  rating: number;
  verified: boolean;
  date?: string;
}

/**
 * Motor-specific customer quotes are no longer invented in this catalogue.
 * Visible review copy on the site comes from live Google Places reviews.
 * Keep the accessors so existing callers can hide gracefully when empty.
 */
const allMercuryReviews: CustomerReview[] = [];

export const mercuryReviews: CustomerReview[] = [];
export const mercuryReviewsExpanded: CustomerReview[] = [];
export const gtaChineseReviews: CustomerReview[] = [];
export const americanFishingReviews: CustomerReview[] = [];
export const commonHPReviews: CustomerReview[] = [];

export const getAllMercuryReviews = (): CustomerReview[] => allMercuryReviews;

export function getReviewsForMotor(_hp: number, _model?: string): CustomerReview[] {
  return [];
}

export function getRandomReview(_hp: number, _model?: string): CustomerReview | undefined {
  return undefined;
}

export function getAverageRating(_hp: number, _model?: string): number | null {
  return null;
}

export function getReviewCount(_hp: number, _model?: string): number {
  return 0;
}

/** Same-day cache key used by the deleted smart-review rotator. */
export const STALE_SMART_REVIEW_STORAGE_KEY = 'hbw_review_rotation';

/**
 * Drop leftover daily rotation entries so a returning visitor cannot
 * replay a pre-#673 placeholder from localStorage.
 */
export function clearStaleSmartReviewCache(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STALE_SMART_REVIEW_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private/restricted browser modes.
  }
}
