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

  it('"2S 60" → 2-Stroke high', () => {
    const r = decodeTradeInModel('2S 60');
    expect(r.stroke).toBe('2-Stroke');
    expect(r.strokeConfidence).toBe('high');
    // Note: "2" is parsed as the leading HP number per current heuristics.
    expect(r.hp).toBe(2);
  });

  // Natural phrasings — these previously fell through to the year-based tiebreaker
  // and were silently misclassified. They MUST be honored at high confidence.
  it('"60 2 stroke" + modern year → 2-Stroke high (user text wins over year)', () => {
    const r = decodeTradeInModel('60 2 stroke', { year: 2023 });
    expect(r.hp).toBe(60);
    expect(r.stroke).toBe('2-Stroke');
    expect(r.strokeConfidence).toBe('high');
  });

  it('"60 2-stroke" → 2-Stroke high', () => {
    const r = decodeTradeInModel('60 2-stroke');
    expect(r.stroke).toBe('2-Stroke');
    expect(r.strokeConfidence).toBe('high');
  });

  it('"90 4 stroke" + old year → 4-Stroke high (user text wins over year)', () => {
    const r = decodeTradeInModel('90 4 stroke', { year: 1985 });
    expect(r.hp).toBe(90);
    expect(r.stroke).toBe('4-Stroke');
    expect(r.strokeConfidence).toBe('high');
  });

  it('"115 4-stroke" → 4-Stroke high', () => {
    const r = decodeTradeInModel('115 4-stroke');
    expect(r.stroke).toBe('4-Stroke');
    expect(r.strokeConfidence).toBe('high');
  });

  it('"two stroke 50" → 2-Stroke high', () => {
    const r = decodeTradeInModel('two stroke 50');
    expect(r.stroke).toBe('2-Stroke');
    expect(r.strokeConfidence).toBe('high');
  });

  it('"four stroke 90" → 4-Stroke high', () => {
    const r = decodeTradeInModel('four stroke 90');
    expect(r.stroke).toBe('4-Stroke');
    expect(r.strokeConfidence).toBe('high');
  });

  it('"60 2 strokes" (plural) → 2-Stroke high', () => {
    const r = decodeTradeInModel('60 2 strokes');
    expect(r.stroke).toBe('2-Stroke');
    expect(r.strokeConfidence).toBe('high');
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
  it('"2008 90 ELPT" → leading "200" wins (3-digit cap on \\d{1,3})', () => {
    const r = decodeTradeInModel('2008 90 ELPT');
    // Documents current behavior: regex captures "200" (first 3 digits of "2008").
    // 90 is then ignored. This test guards against regressions in either direction.
    expect(r.hp).toBe(200);
  });

  it('"90 25" → hp 90 wins as leading number', () => {
    const r = decodeTradeInModel('90 25');
    expect(r.hp).toBe(90);
  });

  it('"F115 25" → hp 115 from prefix, ignores 25', () => {
    const r = decodeTradeInModel('F115 25');
    expect(r.hp).toBe(115);
    expect(r.hpConfidence).toBe('high');
  });

  it('"1999" alone → leading "199" parsed as HP (3-digit cap)', () => {
    const r = decodeTradeInModel('1999');
    // Current behavior: "199" is captured (within 2–450), so high confidence.
    // Locks in the regex contract; change deliberately if heuristics evolve.
    expect(r.hp).toBe(199);
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
