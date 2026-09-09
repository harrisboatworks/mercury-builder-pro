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

  it('counts Ontario calendar days from a date-only YYYY-MM-DD string', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T16:00:00.000Z')); // 12:00 EDT

    expect(daysUntil('2026-09-15')).toBe(6);
  });

  it('uses the Toronto calendar date of a Date instant', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T16:00:00.000Z'));

    // 2026-09-15T00:00:00Z is still Sept 14 in America/Toronto (EDT).
    expect(daysUntil(new Date('2026-09-15T00:00:00.000Z'))).toBe(5);
    expect(daysUntil(new Date('2026-09-15T04:00:00.000Z'))).toBe(6);
  });

  it('clamps a past date to zero', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T16:00:00.000Z'));

    expect(daysUntil('2020-01-01')).toBe(0);
    expect(daysUntil(new Date('2026-09-08T00:00:00.000Z'))).toBe(0);
  });

  it('returns zero on the last Ontario calendar day, including after UTC midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T16:00:00.000Z'));
    expect(daysUntil('2026-09-09')).toBe(0);

    // 9pm EDT is already Sept 10 UTC; Ontario calendar day is still Sept 9.
    vi.setSystemTime(new Date('2026-09-10T01:00:00.000Z'));
    expect(daysUntil('2026-09-09')).toBe(0);
    expect(daysUntil('2026-09-15')).toBe(6);
  });

  it('returns NaN for an invalid input', () => {
    expect(daysUntil('not-a-date')).toBeNaN();
  });
});
