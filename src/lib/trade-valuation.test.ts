import { describe, it, expect } from 'vitest';
import { medianRoundedTo25, computeRoundedTradeIn, getBrandPenaltyFactor, estimateTradeValue, type TradeValuationConfig } from './trade-valuation';

const compute = (low: number, high: number) => medianRoundedTo25(low, high);

describe('medianRoundedTo25', () => {
  it('Range $320–$480 → median $400 → displays $400', () => {
    expect(compute(320, 480)).toBe(400);
  });

  it('Range $330–$465 → median $397.50 → rounds to $400', () => {
    expect(compute(330, 465)).toBe(400);
  });

  it('Range $350–$410 → median $380 → rounds to $375', () => {
    expect(compute(350, 410)).toBe(375);
  });

  it('Median exactly at $362.50 rounds to $375', () => {
    expect(compute(350, 375)).toBe(375);
  });

  it('Median just below $387.50 (e.g., $387.49) rounds to $375', () => {
    expect(compute(325.0, 449.98)).toBe(375);
  });

  it('Median exactly at $387.50 rounds up to $400', () => {
    expect(compute(349, 426)).toBe(400);
  });
});

describe('getBrandPenaltyFactor', () => {
  it('returns 1 for Mercury', () => {
    expect(getBrandPenaltyFactor('Mercury')).toBe(1);
  });

  it('returns 1 for Yamaha', () => {
    expect(getBrandPenaltyFactor('Yamaha')).toBe(1);
  });

  it('returns 0.5 for Johnson', () => {
    expect(getBrandPenaltyFactor('Johnson')).toBe(0.5);
  });

  it('returns 0.5 for Evinrude', () => {
    expect(getBrandPenaltyFactor('Evinrude')).toBe(0.5);
  });

  it('returns 0.5 for OMC', () => {
    expect(getBrandPenaltyFactor('OMC')).toBe(0.5);
  });

  it('respects config override', () => {
    const config: TradeValuationConfig = { BRAND_PENALTY_JOHNSON: { factor: 0.4 } };
    expect(getBrandPenaltyFactor('Johnson', config)).toBe(0.4);
  });
});

describe('estimateTradeValue — 2-stroke penalty', () => {
  const base = { brand: 'Mercury', year: 2022, horsepower: 150, condition: 'good' as const };

  it('4-stroke returns normal range (no haircut)', () => {
    const result = estimateTradeValue({ ...base, engineType: '4-stroke' });
    const noType = estimateTradeValue(base);
    expect(result.low).toBeCloseTo(noType.low, 0);
    expect(result.high).toBeCloseTo(noType.high, 0);
  });

  it('2-stroke applies 0.825 factor', () => {
    const normal = estimateTradeValue(base);
    const twoStroke = estimateTradeValue({ ...base, engineType: '2-stroke' });
    expect(twoStroke.prePenaltyLow).toBeCloseTo(normal.prePenaltyLow! * 0.825, 0);
    expect(twoStroke.prePenaltyHigh).toBeCloseTo(normal.prePenaltyHigh! * 0.825, 0);
  });

  it('OptiMax applies same 0.825 factor', () => {
    const twoStroke = estimateTradeValue({ ...base, engineType: '2-stroke' });
    const optimax = estimateTradeValue({ ...base, engineType: 'optimax' });
    expect(optimax.low).toBeCloseTo(twoStroke.low, 0);
    expect(optimax.high).toBeCloseTo(twoStroke.high, 0);
  });

  it('adds factor note for 2-stroke', () => {
    const result = estimateTradeValue({ ...base, engineType: '2-stroke' });
    expect(result.factors.some(f => f.includes('2-Stroke'))).toBe(true);
  });

  it('adds factor note for OptiMax', () => {
    const result = estimateTradeValue({ ...base, engineType: 'optimax' });
    expect(result.factors.some(f => f.includes('OptiMax'))).toBe(true);
  });
});

describe('estimateTradeValue — hours adjustment', () => {
  const base = { brand: 'Mercury', year: 2022, horsepower: 150, condition: 'good' as const };

  it('no hours → no adjustment', () => {
    const noHours = estimateTradeValue(base);
    const withUndefined = estimateTradeValue({ ...base, engineHours: undefined });
    expect(noHours.low).toBeCloseTo(withUndefined.low, 0);
  });

  it('low hours (≤100) gets +7.5% bonus', () => {
    const normal = estimateTradeValue(base);
    const lowHours = estimateTradeValue({ ...base, engineHours: 50 });
    expect(lowHours.prePenaltyLow).toBeCloseTo(normal.prePenaltyLow! * 1.075, 0);
    expect(lowHours.factors.some(f => f.includes('bonus'))).toBe(true);
  });

  it('moderate hours (500-999) gets -10% penalty', () => {
    const normal = estimateTradeValue(base);
    const modHours = estimateTradeValue({ ...base, engineHours: 750 });
    expect(modHours.prePenaltyLow).toBeCloseTo(normal.prePenaltyLow! * 0.90, 0);
    expect(modHours.factors.some(f => f.includes('Moderate hours'))).toBe(true);
  });

  it('high hours (≥1000) gets -17.5% penalty', () => {
    const normal = estimateTradeValue(base);
    const highHours = estimateTradeValue({ ...base, engineHours: 1500 });
    expect(highHours.prePenaltyLow).toBeCloseTo(normal.prePenaltyLow! * 0.825, 0);
    expect(highHours.factors.some(f => f.includes('High hours'))).toBe(true);
  });
});

describe('estimateTradeValue — HP-class floors', () => {
  it('10HP motor with poor condition does not drop below $200', () => {
    const result = estimateTradeValue({ brand: 'Mercury', year: 2008, horsepower: 10, condition: 'poor' });
    expect(result.low).toBeGreaterThanOrEqual(200);
  });

  it('50HP motor does not drop below $1,000', () => {
    const result = estimateTradeValue({ brand: 'Mercury', year: 2006, horsepower: 50, condition: 'poor' });
    expect(result.low).toBeGreaterThanOrEqual(1000);
  });

  it('115HP motor does not drop below $1,500', () => {
    const result = estimateTradeValue({ brand: 'Mercury', year: 2006, horsepower: 115, condition: 'poor' });
    expect(result.low).toBeGreaterThanOrEqual(1500);
  });

  it('250HP motor does not drop below $2,500', () => {
    const result = estimateTradeValue({ brand: 'Mercury', year: 2006, horsepower: 250, condition: 'poor' });
    expect(result.low).toBeGreaterThanOrEqual(2500);
  });
});

describe('estimateTradeValue — combined scenarios', () => {
  it('2-stroke + high hours + Johnson brand penalty all stack', () => {
    const result = estimateTradeValue({
      brand: 'Johnson',
      year: 2010,
      horsepower: 115,
      condition: 'fair',
      engineType: '2-stroke',
      engineHours: 1200
    });
    // Should have brand penalty applied
    expect(result.penaltyApplied).toBe(true);
    expect(result.penaltyFactor).toBe(0.5);
    // Should have factor notes for 2-stroke AND high hours AND brand
    expect(result.factors.some(f => f.includes('2-Stroke'))).toBe(true);
    expect(result.factors.some(f => f.includes('High hours'))).toBe(true);
    expect(result.factors.some(f => f.includes('brand'))).toBe(true);
    // Floor should still apply (115HP → $1,500 min)
    expect(result.low).toBeGreaterThanOrEqual(1500);
  });
});
