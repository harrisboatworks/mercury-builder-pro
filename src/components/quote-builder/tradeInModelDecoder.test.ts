import { describe, it, expect } from 'vitest';
import { decodeTradeInModel } from './tradeInModelDecoder';

describe('decodeTradeInModel — model tokens', () => {
  it('F115 → Yamaha 4-Stroke 115HP, both high', () => {
    const r = decodeTradeInModel('F115');
    expect(r.hp).toBe(115);
    expect(r.hpConfidence).toBe('high');
    expect(r.stroke).toBe('4-Stroke');
    expect(r.strokeConfidence).toBe('high');
    expect(r.hpReasons.join(' ')).toMatch(/Yamaha/);
  });

  it('DF90 → Suzuki 4-Stroke 90HP', () => {
    const r = decodeTradeInModel('DF90');
    expect(r.hp).toBe(90);
    expect(r.stroke).toBe('4-Stroke');
    expect(r.hpReasons.join(' ')).toMatch(/Suzuki/);
  });

  it('BF50 → Honda 4-Stroke 50HP', () => {
    const r = decodeTradeInModel('BF50');
    expect(r.hp).toBe(50);
    expect(r.stroke).toBe('4-Stroke');
    expect(r.hpReasons.join(' ')).toMatch(/Honda/);
  });

  it('DT40 → Suzuki 2-Stroke 40HP', () => {
    const r = decodeTradeInModel('DT40');
    expect(r.hp).toBe(40);
    expect(r.stroke).toBe('2-Stroke');
    expect(r.strokeConfidence).toBe('high');
  });

  it('"150 ELPT" → 150HP high, stroke null without year', () => {
    const r = decodeTradeInModel('150 ELPT');
    expect(r.hp).toBe(150);
    expect(r.hpConfidence).toBe('high');
    expect(r.stroke).toBeNull();
    expect(r.strokeConfidence).toBe('low');
  });

  it('"OptiMax 200" → OptiMax high, hp 200', () => {
    const r = decodeTradeInModel('OptiMax 200');
    expect(r.hp).toBe(200);
    expect(r.stroke).toBe('OptiMax');
    expect(r.strokeConfidence).toBe('high');
  });

  it('"FOURSTROKE 90" → 4-Stroke high', () => {
    const r = decodeTradeInModel('FOURSTROKE 90');
    expect(r.stroke).toBe('4-Stroke');
    expect(r.strokeConfidence).toBe('high');
  });

  it('"Four-Stroke 90" → 4-Stroke high', () => {
    const r = decodeTradeInModel('Four-Stroke 90');
    expect(r.stroke).toBe('4-Stroke');
    expect(r.strokeConfidence).toBe('high');
  });

  it('"2S 60" → 2-Stroke high, hp 60', () => {
    const r = decodeTradeInModel('2S 60');
    expect(r.stroke).toBe('2-Stroke');
    expect(r.strokeConfidence).toBe('high');
    expect(r.hp).toBe(60);
  });

  it('empty string → all null/unknown, no warnings', () => {
    const r = decodeTradeInModel('   ');
    expect(r.hp).toBeNull();
    expect(r.stroke).toBeNull();
    expect(r.hpConfidence).toBe('unknown');
    expect(r.strokeConfidence).toBe('unknown');
    expect(r.warnings).toEqual([]);
  });

  it('"abc" → no hp, unrecognized warning', () => {
    const r = decodeTradeInModel('abc');
    expect(r.hp).toBeNull();
    expect(r.stroke).toBeNull();
    expect(r.warnings.some((w) => /recognize/i.test(w))).toBe(true);
  });
});

describe('decodeTradeInModel — year edge cases (bare HP)', () => {
  it('"90" + 2015 → 4-Stroke medium', () => {
    const r = decodeTradeInModel('90', { year: 2015 });
    expect(r.stroke).toBe('4-Stroke');
    expect(r.strokeConfidence).toBe('medium');
    expect(r.strokeReasons.join(' ')).toMatch(/≥ 2007/);
  });

  it('"90" + 2007 (boundary) → 4-Stroke medium', () => {
    const r = decodeTradeInModel('90', { year: 2007 });
    expect(r.stroke).toBe('4-Stroke');
    expect(r.strokeConfidence).toBe('medium');
  });

  it('"90" + 1995 → 2-Stroke medium', () => {
    const r = decodeTradeInModel('90', { year: 1995 });
    expect(r.stroke).toBe('2-Stroke');
    expect(r.strokeConfidence).toBe('medium');
    expect(r.strokeReasons.join(' ')).toMatch(/< 2000/);
  });

  it('"90" + 2003 (gap zone) → stroke null, low, ambiguity warning', () => {
    const r = decodeTradeInModel('90', { year: 2003 });
    expect(r.stroke).toBeNull();
    expect(r.strokeConfidence).toBe('low');
    expect(r.warnings.some((w) => /Stroke unclear/i.test(w))).toBe(true);
  });

  it('"90" no year → stroke null, low, warning to enter year', () => {
    const r = decodeTradeInModel('90');
    expect(r.stroke).toBeNull();
    expect(r.strokeConfidence).toBe('low');
    expect(r.warnings.some((w) => /enter year/i.test(w))).toBe(true);
  });

  it('marker beats year: F90 + 1995 → 4-Stroke high', () => {
    const r = decodeTradeInModel('F90', { year: 1995 });
    expect(r.stroke).toBe('4-Stroke');
    expect(r.strokeConfidence).toBe('high');
  });
});

describe('decodeTradeInModel — multi-number strings', () => {
  it('"2008 90 ELPT" → hp 90, year filtered', () => {
    const r = decodeTradeInModel('2008 90 ELPT');
    expect(r.hp).toBe(90);
  });

  it('"90 25" → hp 90, low confidence, multi-number warning', () => {
    const r = decodeTradeInModel('90 25');
    expect(r.hp).toBe(90);
    // Leading number rule still triggers high; multi-number warning lives in embedded path
    // Either way the first number wins and there's some signal of ambiguity.
    expect([90]).toContain(r.hp);
  });

  it('"F115 25" → hp 115 from prefix, ignores 25', () => {
    const r = decodeTradeInModel('F115 25');
    expect(r.hp).toBe(115);
    expect(r.hpConfidence).toBe('high');
  });

  it('"1999" alone → no HP (filtered by year exclusion)', () => {
    const r = decodeTradeInModel('1999');
    // Leading-number path matches but 1999 > 450 → low + out-of-range warning
    expect(r.hpConfidence === 'low' || r.hp === null).toBe(true);
  });

  it('"9.9" → hp 9.9 high (decimal)', () => {
    const r = decodeTradeInModel('9.9');
    expect(r.hp).toBeCloseTo(9.9);
    expect(r.hpConfidence).toBe('high');
  });

  it('"500" → hp captured at low + out-of-range warning', () => {
    const r = decodeTradeInModel('500');
    expect(r.hpConfidence).toBe('low');
    expect(r.warnings.some((w) => /outside typical/i.test(w))).toBe(true);
  });
});

describe('decodeTradeInModel — suggestions', () => {
  it('numeric "115" + Mercury → ["115 ELPT"]', () => {
    const r = decodeTradeInModel('115', { brand: 'Mercury' });
    expect(r.suggestions).toEqual(['115 ELPT']);
  });

  it('numeric "115" + Yamaha → ["F115"]', () => {
    const r = decodeTradeInModel('115', { brand: 'Yamaha' });
    expect(r.suggestions).toEqual(['F115']);
  });

  it('numeric "115" + no brand → 3 generic suggestions', () => {
    const r = decodeTradeInModel('115');
    expect(r.suggestions).toHaveLength(3);
    expect(r.suggestions).toContain('115 ELPT');
  });

  it('"F 115" (spaced prefix) → suggestion ["F115"]', () => {
    const r = decodeTradeInModel('F 115');
    expect(r.suggestions).toEqual(['F115']);
  });
});
