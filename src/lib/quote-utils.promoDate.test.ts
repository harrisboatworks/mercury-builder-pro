import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addDealerCalendarDays,
  daysUntil as sharedDaysUntil,
  dealerToday,
  isPromotionLive,
  promoEndOfDay as sharedPromoEndOfDay,
  promoStartOfDay,
} from '../../supabase/functions/_shared/promo-dates';
import { daysUntil, formatExpiry, isPromotionLive as reexportedLive, promoEndOfDay } from './quote-utils';

describe('promo date convention (America/Toronto)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is the same helper from quote-utils and the edge shared module', () => {
    expect(promoEndOfDay).toBe(sharedPromoEndOfDay);
    expect(daysUntil).toBe(sharedDaysUntil);
    expect(reexportedLive).toBe(isPromotionLive);
  });

  it('treats date-only end_date as Toronto end of day in EDT and EST', () => {
    expect(promoEndOfDay('2026-08-31').toISOString()).toBe('2026-09-01T03:59:59.999Z');
    expect(promoEndOfDay('2026-12-31').toISOString()).toBe('2027-01-01T04:59:59.999Z');
    expect(promoEndOfDay('2026-01-31').toISOString()).toBe('2026-02-01T04:59:59.999Z');
    expect(promoEndOfDay('2026-08-31').getTime()).toBe(promoStartOfDay('2026-09-01').getTime() - 1);
    expect(promoStartOfDay('2026-08-31').toISOString()).toBe('2026-08-31T04:00:00.000Z');
    expect(promoStartOfDay('2026-01-31').toISOString()).toBe('2026-01-31T05:00:00.000Z');
  });

  it('reads the calendar date from an ISO timestamp prefix, not the viewer timezone', () => {
    expect(promoEndOfDay('2026-08-31T23:59:59.000Z').toISOString()).toBe('2026-09-01T03:59:59.999Z');
  });

  it('keeps a promotion live at 9am and 11:59pm Ontario on the last day (EDT)', () => {
    const end = '2026-08-31';
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-08-31T13:00:00.000Z')); // 9am EDT
    expect(isPromotionLive({ endDate: end })).toBe(true);
    expect(daysUntil(end)).toBe(0);
    expect(formatExpiry(end)).toBe('Expires today');

    vi.setSystemTime(new Date('2026-09-01T03:59:00.000Z')); // 11:59pm EDT
    expect(isPromotionLive({ endDate: end })).toBe(true);
    expect(daysUntil(end)).toBe(0);

    vi.setSystemTime(new Date('2026-09-01T04:01:00.000Z')); // 12:01am EDT next day
    expect(isPromotionLive({ endDate: end })).toBe(false);
    expect(daysUntil(end)).toBe(0);
  });

  it('keeps a promotion live at 9am and 11:59pm Ontario on the last day (EST)', () => {
    const end = '2026-01-31';
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-01-31T14:00:00.000Z')); // 9am EST
    expect(isPromotionLive({ endDate: end })).toBe(true);
    expect(daysUntil(end)).toBe(0);
    expect(formatExpiry(end)).toBe('Expires today');

    vi.setSystemTime(new Date('2026-02-01T04:59:00.000Z')); // 11:59pm EST
    expect(isPromotionLive({ endDate: end })).toBe(true);
    expect(daysUntil(end)).toBe(0);

    vi.setSystemTime(new Date('2026-02-01T05:01:00.000Z')); // 12:01am EST next day
    expect(isPromotionLive({ endDate: end })).toBe(false);
    expect(daysUntil(end)).toBe(0);
  });

  it('uses the Ontario calendar date for SQL-style today, not UTC', () => {
    vi.useFakeTimers();
    // 9pm EDT Aug 31 is already Sept 1 UTC.
    vi.setSystemTime(new Date('2026-09-01T01:00:00.000Z'));
    expect(dealerToday()).toBe('2026-08-31');
    expect(isPromotionLive({ endDate: '2026-08-31' })).toBe(true);

    vi.setSystemTime(new Date('2026-02-01T03:00:00.000Z')); // 10pm EST Jan 31
    expect(dealerToday()).toBe('2026-01-31');
    expect(addDealerCalendarDays('2026-01-31', 7)).toBe('2026-02-07');
  });

  it('does not depend on the machine timezone', () => {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // eslint-disable-next-line no-console
    console.log(`promo-date tests running with TZ=${process.env.TZ || '(unset)'} resolved=${resolved}`);
    expect(promoEndOfDay('2026-08-31').toISOString()).toBe('2026-09-01T03:59:59.999Z');
    expect(promoEndOfDay('2026-12-31').toISOString()).toBe('2027-01-01T04:59:59.999Z');
  });
});
