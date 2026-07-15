import { describe, expect, it } from 'vitest';
import { promoEndOfDay } from './quote-utils';

describe('promoEndOfDay', () => {
  it('parses a date-only value as the end of that local calendar day', () => {
    const result = promoEndOfDay('2026-08-31');

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(7);
    expect(result.getDate()).toBe(31);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });
});
