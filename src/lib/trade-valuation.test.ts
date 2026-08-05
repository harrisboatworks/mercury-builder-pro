import { describe, expect, it } from 'vitest';
import {
  buildHBWReportUrl,
  CANONICAL_HBW_VALUATION_ORIGIN,
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

  it('builds shareable reports on the branded canonical origin', () => {
    const reportUrl = new URL(buildHBWReportUrl({
      brand: 'Mercury',
      year: 2017,
      hp: 150,
      condition: 'good',
      stroke: 'proxs',
      model: '150 Pro XS',
    }));

    expect(reportUrl.origin).toBe(CANONICAL_HBW_VALUATION_ORIGIN);
    expect(reportUrl.pathname).toBe('/');
    expect(reportUrl.searchParams.get('stroke')).toBe('proxs');
    expect(reportUrl.searchParams.get('auto')).toBe('true');
    expect(reportUrl.searchParams.has('name')).toBe(false);
  });

  it('never guesses four-stroke or places a customer name in the report URL', () => {
    expect(() => buildHBWReportUrl({
      brand: 'Mercury', year: 2017, hp: 150, condition: 'good', stroke: '',
    })).toThrow(/stroke is required/i);
  });
});
