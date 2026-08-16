import { afterEach, describe, expect, it, vi } from 'vitest';

import { daysUntil } from './finance';

describe('finance promo date countdown', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps a date-only promotion active through the end of its local calendar day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 31, 12, 0, 0));

    expect(daysUntil('2026-08-31')).toBe(1);
  });
});
