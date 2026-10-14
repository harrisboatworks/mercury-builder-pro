import { describe, expect, it } from 'vitest';
import {
  SHOP_HOURS_AGENT_LINE,
  canadianThanksgivingMonday,
  seasonalSundayOpeningHours,
  sundaySeasonValidThrough,
  withSeasonalSundayHours,
} from '../shopHours.js';

describe('shopHours', () => {
  it('computes Canadian Thanksgiving Monday and the Sunday-season end', () => {
    expect(canadianThanksgivingMonday(2025)).toBe('2025-10-13');
    expect(sundaySeasonValidThrough(2025)).toBe('2025-10-11');
    expect(canadianThanksgivingMonday(2026)).toBe('2026-10-12');
    expect(sundaySeasonValidThrough(2026)).toBe('2026-10-10');
    expect(canadianThanksgivingMonday(2027)).toBe('2027-10-11');
    expect(sundaySeasonValidThrough(2027)).toBe('2027-10-09');
  });

  it('emits May-through-pre-Thanksgiving Sunday specs for this year and next', () => {
    const specs = seasonalSundayOpeningHours(new Date('2026-10-14T12:00:00-04:00'));
    expect(specs).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '09:00',
        closes: '16:00',
        validFrom: '2026-05-01',
        validThrough: '2026-10-10',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '09:00',
        closes: '16:00',
        validFrom: '2027-05-01',
        validThrough: '2027-10-09',
      },
    ]);
  });

  it('replaces year-round Sunday cache hours with the seasonal specs', () => {
    const merged = withSeasonalSundayHours(
      [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '08:00', closes: '17:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '09:00', closes: '16:00' },
      ],
      new Date('2026-10-14T12:00:00-04:00'),
    );
    expect(merged.filter((item) => item.dayOfWeek === 'Sunday')).toEqual(
      seasonalSundayOpeningHours(new Date('2026-10-14T12:00:00-04:00')),
    );
    expect(merged.some((item) => item.dayOfWeek === 'Saturday')).toBe(true);
  });

  it('states May-through-Canadian-Thanksgiving Sunday hours, not April-November', () => {
    expect(SHOP_HOURS_AGENT_LINE).toContain('Sunday 09:00-16:00 from May through Canadian Thanksgiving');
    expect(SHOP_HOURS_AGENT_LINE).toContain('closed Thanksgiving weekend');
    expect(SHOP_HOURS_AGENT_LINE).not.toContain('April');
    expect(SHOP_HOURS_AGENT_LINE).not.toContain('November');
  });
});
