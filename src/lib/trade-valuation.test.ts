import { describe, expect, it } from 'vitest';
import {
  getBrandPenaltyFactor,
  medianRoundedTo25,
  normalizeBrand,
} from './trade-valuation';

describe('trade valuation display helpers', () => {
  it('rounds the canonical range midpoint to the nearest $25', () => {
    expect(medianRoundedTo25(4890, 6615)).toBe(5750);
    expect(medianRoundedTo25(0, 0)).toBe(100);
  });

  it('keeps display-only brand metadata aligned with the canonical policy', () => {
    expect(normalizeBrand(' Yamaha ')).toBe('YAMAHA');
    expect(getBrandPenaltyFactor('Mercury')).toBe(1);
    expect(getBrandPenaltyFactor('Yamaha')).toBe(1);
    expect(getBrandPenaltyFactor('Honda')).toBe(0.8);
    expect(getBrandPenaltyFactor('Johnson')).toBe(0.5);
  });
});
