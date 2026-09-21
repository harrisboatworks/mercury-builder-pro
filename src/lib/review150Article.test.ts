import { describe, expect, it } from 'vitest';

import { REVIEW_150_SLUG, usesReview150MobileAffordances } from './review150Article';

describe('usesReview150MobileAffordances', () => {
  it('enables affordances only for the 150 review slug', () => {
    expect(REVIEW_150_SLUG).toBe('mercury-150-hp-fourstroke-pro-xs-review-ontario');
    expect(usesReview150MobileAffordances(REVIEW_150_SLUG)).toBe(true);
    expect(usesReview150MobileAffordances('mercury-115-hp-fourstroke-review-ontario')).toBe(false);
    expect(usesReview150MobileAffordances('')).toBe(false);
    expect(usesReview150MobileAffordances(undefined)).toBe(false);
  });
});
