import { describe, expect, it } from 'vitest';
import { getRelevantReview } from './pdf-helpers';

describe('pdf-helpers reviews', () => {
  it('does not attach an invented customer review to a quote PDF', () => {
    expect(getRelevantReview(115)).toBeNull();
    expect(getRelevantReview(25)).toBeNull();
  });
});
