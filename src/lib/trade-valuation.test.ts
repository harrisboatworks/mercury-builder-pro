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
  it('2-stroke + high hours stack on Mercury motor', () => {
    const normal = estimateTradeValue({ brand: 'Mercury', year: 2012, horsepower: 115, condition: 'fair' });
    const combined = estimateTradeValue({
      brand: 'Mercury', year: 2012, horsepower: 115, condition: 'fair',
      engineType: '2-stroke', engineHours: 1200
    });
    // Both penalties should stack: 0.825 * 0.825 = ~0.680625
    expect(combined.prePenaltyLow).toBeCloseTo(normal.prePenaltyLow! * 0.825 * 0.825, 0);
    expect(combined.factors.some(f => f.includes('2-Stroke'))).toBe(true);
    expect(combined.factors.some(f => f.includes('High hours'))).toBe(true);
  });

  it('Johnson brand penalty applies on generic estimate', () => {
    const result = estimateTradeValue({
      brand: 'Johnson', year: 2010, horsepower: 115, condition: 'fair'
    });
    expect(result.penaltyApplied).toBe(true);
    expect(result.penaltyFactor).toBe(0.5);
    expect(result.factors.some(f => f.includes('brand'))).toBe(true);
  });
});

// ===== MSRP-based valuation tests =====

const MSRP_CONFIG: TradeValuationConfig = {
  MSRP_TRADE_PERCENTAGES: {
    '1-3':  { excellent: 0.55, good: 0.50, fair: 0.40, poor: 0.25 },
    '4-7':  { excellent: 0.44, good: 0.40, fair: 0.32, poor: 0.20 },
    '8-12': { excellent: 0.29, good: 0.26, fair: 0.21, poor: 0.13 },
    '13-17':{ excellent: 0.19, good: 0.17, fair: 0.14, poor: 0.09 },
    '18-20':{ excellent: 0.13, good: 0.12, fair: 0.10, poor: 0.06 },
  },
  HP_CLASS_FLOORS: { under_25: 200, '25_75': 1000, '90_150': 1500, '200_plus': 2500 },
};

const REFERENCE_MSRPS: Record<number, number> = {
  15: 4500,
  25: 7500,
  50: 12000,
  75: 16000,
  90: 18000,
  115: 22000,
  150: 28000,
  200: 32000,
  250: 38000,
  300: 45000,
};

const currentYear = new Date().getFullYear();

describe('estimateTradeValue — MSRP-based Mercury path', () => {
  it('uses MSRP path when config + referenceMsrps provided for Mercury', () => {
    const result = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 2, horsepower: 150, condition: 'good' },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    expect(result.source).toBe('MSRP-anchored valuation');
    // 150HP MSRP = $28,000, age 2 → bracket 1-3, good = 50%
    // baseValue = 28000 * 0.50 = 14000, low = 14000*0.85 = 11900, high = 14000*1.15 = 16100
    expect(result.average).toBeCloseTo(14000, -2);
  });

  it('falls back to brackets for non-Mercury brands', () => {
    const result = estimateTradeValue(
      { brand: 'Yamaha', year: currentYear - 2, horsepower: 150, condition: 'good' },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    expect(result.source).not.toBe('MSRP-anchored valuation');
  });

  it('falls back to brackets when referenceMsrps missing', () => {
    const result = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 2, horsepower: 150, condition: 'good' },
      { config: MSRP_CONFIG }
    );
    expect(result.source).not.toBe('MSRP-anchored valuation');
  });

  it('calculates correct value for 4-7 year bracket', () => {
    const result = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 5, horsepower: 250, condition: 'excellent' },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    // 250HP MSRP = $38,000, age 5 → bracket 4-7, excellent = 44%
    // baseValue = 38000 * 0.44 = 16720
    expect(result.average).toBeCloseTo(16720, -2);
  });

  it('calculates correct value for 8-12 year bracket', () => {
    const result = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 10, horsepower: 90, condition: 'fair' },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    // 90HP MSRP = $18,000, age 10 → bracket 8-12, fair = 21%
    // baseValue = 18000 * 0.21 = 3780
    expect(result.average).toBeCloseTo(3780, -2);
  });

  it('applies 2-stroke penalty on MSRP path', () => {
    const normal = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 5, horsepower: 150, condition: 'good' },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    const twoStroke = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 5, horsepower: 150, condition: 'good', engineType: '2-stroke' },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    expect(twoStroke.average).toBeCloseTo(normal.average * 0.825, -1);
    expect(twoStroke.factors.some(f => f.includes('2-Stroke'))).toBe(true);
  });

  it('applies hours bonus on MSRP path', () => {
    const normal = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 2, horsepower: 115, condition: 'good' },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    const lowHours = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 2, horsepower: 115, condition: 'good', engineHours: 50 },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    expect(lowHours.average).toBeCloseTo(normal.average * 1.075, -1);
  });

  it('enforces HP-class floors on MSRP path', () => {
    // 15HP poor, 18-20 year old → very low value, should hit $200 floor
    const result = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 19, horsepower: 15, condition: 'poor' },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    // 15HP MSRP = $4500, bracket 18-20, poor = 6% → $270, * 0.85 = $229.5
    expect(result.low).toBeGreaterThanOrEqual(200);
  });

  it('200HP+ floor enforced on MSRP path', () => {
    const result = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 19, horsepower: 200, condition: 'poor' },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    expect(result.low).toBeGreaterThanOrEqual(2500);
  });

  it('motors older than 20 years fall back to bracket path', () => {
    const result = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 22, horsepower: 150, condition: 'good' },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    // getMsrpAgeBracket returns null for age > 20
    expect(result.source).not.toBe('MSRP-anchored valuation');
  });

  it('brand-new (age 0) motors fall back to bracket path', () => {
    const result = estimateTradeValue(
      { brand: 'Mercury', year: currentYear, horsepower: 150, condition: 'excellent' },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    expect(result.source).not.toBe('MSRP-anchored valuation');
  });

  it('finds closest HP match when exact HP not in referenceMsrps', () => {
    const result = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 3, horsepower: 140, condition: 'good' },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    expect(result.source).toBe('MSRP-anchored valuation');
    // Closest HP to 140 is 150 (MSRP $28,000), bracket 1-3, good = 50% → $14,000
    expect(result.average).toBeCloseTo(14000, -2);
  });

  it('stacks 2-stroke + high hours on MSRP path', () => {
    const normal = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 5, horsepower: 115, condition: 'fair' },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    const combined = estimateTradeValue(
      { brand: 'Mercury', year: currentYear - 5, horsepower: 115, condition: 'fair', engineType: '2-stroke', engineHours: 1200 },
      { config: MSRP_CONFIG, referenceMsrps: REFERENCE_MSRPS }
    );
    // 0.825 * 0.825 = 0.680625
    expect(combined.average).toBeCloseTo(normal.average * 0.825 * 0.825, -1);
  });
});
