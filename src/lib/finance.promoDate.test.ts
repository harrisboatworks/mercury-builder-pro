import { afterEach, describe, expect, it, vi } from 'vitest';

import { daysUntil } from './finance';

describe('finance promo date countdown', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps a date-only promotion active through the end of its local calendar day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 31, 23, 59, 0));

    expect(daysUntil('2026-08-31')).toBe(1);

    vi.setSystemTime(new Date(2026, 8, 1, 0, 0, 0));
    expect(daysUntil('2026-08-31')).toBe(0);
  });

  it('counts the final promotion day once across the autumn DST transition', () => {
    const previousTimeZone = process.env.TZ;
    process.env.TZ = 'America/Toronto';

    try {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 10, 1, 0, 0, 0));

      expect(daysUntil('2026-11-01')).toBe(1);
    } finally {
      vi.useRealTimers();
      if (previousTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = previousTimeZone;
      }
    }
  });

  it.each([
    '2026-13-40',
    '2026-02-30',
    'not-a-date',
  ])('preserves invalid-input behavior for %s', (value) => {
    expect(daysUntil(value)).toBeNaN();
  });
});
