import { describe, expect, it } from 'vitest';
import { resolveQuoteIncludedCoverageYears } from './quote-pdf-data';

describe('frozen quote included coverage', () => {
  it('retains five recorded years after live promotional coverage expires', () => {
    expect(resolveQuoteIncludedCoverageYears({ frozen: true, snapshotYears: 5, liveYears: 3 })).toBe(5);
  });
  it('keeps an old three-year quote when the current promotion offers five', () => {
    expect(resolveQuoteIncludedCoverageYears({ frozen: true, snapshotYears: 3, liveYears: 5 })).toBe(3);
  });
  it('separates paid protection from included coverage in legacy frozen quotes', () => {
    expect(resolveQuoteIncludedCoverageYears({ frozen: true, warrantyConfig: { totalYears: 7, extendedYears: 2 }, liveYears: 3 })).toBe(5);
  });
  it('recalculates an unfrozen quote from currently applicable coverage', () => {
    expect(resolveQuoteIncludedCoverageYears({ frozen: false, snapshotYears: 5, liveYears: 3 })).toBe(3);
  });
});
