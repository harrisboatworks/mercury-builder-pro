import { afterEach, describe, expect, it, vi } from 'vitest';
import { daysUntil as daysUntilFromFinance } from './finance';
import { daysUntil } from './quote-utils';

describe('daysUntil', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is the same helper from finance and quote-utils', () => {
    expect(daysUntilFromFinance).toBe(daysUntil);
  });

  it('counts from a date-only YYYY-MM-DD string parsed as UTC midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T16:00:00.000Z'));

    // 2026-09-15T00:00:00.000Z − 2026-09-09T16:00:00.000Z = 5.333… days → ceil 6
    expect(daysUntil('2026-09-15')).toBe(6);
  });

  it('accepts a Date object and ceils the millisecond delta', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T16:00:00.000Z'));

    expect(daysUntil(new Date('2026-09-15T00:00:00.000Z'))).toBe(6);
  });

  it('clamps a past date to zero', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T16:00:00.000Z'));

    expect(daysUntil('2020-01-01')).toBe(0);
    expect(daysUntil(new Date('2026-09-08T00:00:00.000Z'))).toBe(0);
  });

  it('returns zero for a date-only string on the same UTC day after midnight UTC', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T16:00:00.000Z'));

    // '2026-09-09' is 2026-09-09T00:00:00.000Z, which is already 16h in the past.
    expect(daysUntil('2026-09-09')).toBe(0);
  });

  it('returns NaN for an invalid input (current, undocumented-until-now behaviour)', () => {
    // new Date('not-a-date').getTime() is NaN; Math.max(0, Math.ceil(NaN)) is NaN.
    expect(daysUntil('not-a-date')).toBeNaN();
  });
});
