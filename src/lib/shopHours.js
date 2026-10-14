/**
 * Confirmed Harris Boat Works public hours.
 *
 * Monday–Saturday 08:00–17:00.
 * Sunday 09:00–16:00 from May through Canadian Thanksgiving;
 * closed Thanksgiving weekend and all other Sundays.
 *
 * Canadian Thanksgiving is the second Monday of October. Thanksgiving
 * weekend Sunday is the day before that Monday, so Sunday hours end the
 * Saturday before that weekend.
 */

export const WEEKDAY_OPENS = '08:00';
export const WEEKDAY_CLOSES = '17:00';
export const SUNDAY_OPENS = '09:00';
export const SUNDAY_CLOSES = '16:00';

export const SHOP_HOURS_AGENT_LINE =
  'Monday-Saturday 08:00-17:00. Sunday 09:00-16:00 from May through Canadian Thanksgiving; closed Thanksgiving weekend and all other Sundays.';

function pad2(value) {
  return String(value).padStart(2, '0');
}

/** Second Monday of October (ISO date YYYY-MM-DD, America/Toronto calendar). */
export function canadianThanksgivingMonday(year) {
  const weekday = new Date(Date.UTC(year, 9, 1)).getUTCDay();
  const firstMonday = weekday === 1 ? 1 : ((8 - weekday) % 7) + 1;
  return `${year}-10-${pad2(firstMonday + 7)}`;
}

/** Last calendar day Sunday hours apply (Saturday before Thanksgiving Sunday). */
export function sundaySeasonValidThrough(year) {
  const mondayDay = Number(canadianThanksgivingMonday(year).slice(8, 10));
  return `${year}-10-${pad2(mondayDay - 2)}`;
}

export function sundaySeasonValidFrom(year) {
  return `${year}-05-01`;
}

function torontoYear(now = new Date()) {
  return Number(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric' }).format(now),
  );
}

export function seasonalSundayOpeningHours(now = new Date()) {
  const year = torontoYear(now);
  return [year, year + 1].map((seasonYear) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: 'Sunday',
    opens: SUNDAY_OPENS,
    closes: SUNDAY_CLOSES,
    validFrom: sundaySeasonValidFrom(seasonYear),
    validThrough: sundaySeasonValidThrough(seasonYear),
  }));
}

export function withSeasonalSundayHours(openingHoursSpecification, now = new Date()) {
  const weekdays = (Array.isArray(openingHoursSpecification) ? openingHoursSpecification : [])
    .filter((item) => item?.dayOfWeek !== 'Sunday');
  return [...weekdays, ...seasonalSundayOpeningHours(now)];
}
