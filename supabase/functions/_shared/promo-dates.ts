/**
 * Single convention for promotion start/end dates.
 *
 * Stored values are calendar dates (YYYY-MM-DD), not instants. A promotion
 * that "ends March 31" is live until 23:59:59.999 in America/Toronto,
 * including across EST/EDT. Do not use a hardcoded UTC offset.
 */

export const DEALER_TIME_ZONE = 'America/Toronto';

const DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

export function parsePromoCalendarDate(
  value: string,
): { year: number; month: number; day: number } | null {
  const match = DATE_PREFIX.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  // formatToParts is second-precision. Align the instant so milliseconds
  // cannot skew the offset (23:59:59.999 must not land after next midnight).
  const secondAligned = new Date(Math.floor(instant.getTime() / 1000) * 1000);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = dtf.formatToParts(secondAligned);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const piece = parts.find((part) => part.type === type);
    return piece ? Number(piece.value) : NaN;
  };
  const asUTC = Date.UTC(
    read('year'),
    read('month') - 1,
    read('day'),
    read('hour'),
    read('minute'),
    read('second'),
  );
  return asUTC - secondAligned.getTime();
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  const offset1 = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  const instant1 = utcGuess - offset1;
  const offset2 = getTimeZoneOffsetMs(new Date(instant1), timeZone);
  return new Date(utcGuess - offset2);
}

function calendarPartsOf(value: string | Date): { year: number; month: number; day: number } | null {
  if (typeof value === 'string') {
    const parsed = parsePromoCalendarDate(value);
    if (parsed) return parsed;
    const asDate = new Date(value);
    if (Number.isNaN(asDate.getTime())) return null;
    return parsePromoCalendarDate(dealerCalendarDate(asDate));
  }
  if (Number.isNaN(value.getTime())) return null;
  return parsePromoCalendarDate(dealerCalendarDate(value));
}

/** America/Toronto calendar date (YYYY-MM-DD) for an instant. */
export function dealerCalendarDate(now: Date = new Date()): string {
  if (Number.isNaN(now.getTime())) return '';
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: DEALER_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = dtf.formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${read('year')}-${read('month')}-${read('day')}`;
}

/** Ontario "today" for DATE comparisons. Inclusive end_date.gte.today. */
export function dealerToday(now: Date = new Date()): string {
  return dealerCalendarDate(now);
}

export function addDealerCalendarDays(ymd: string, days: number): string {
  const parts = parsePromoCalendarDate(ymd);
  if (!parts) return ymd;
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return `${utc.getUTCFullYear()}-${pad2(utc.getUTCMonth() + 1)}-${pad2(utc.getUTCDate())}`;
}

export function promoStartOfDay(dateStr: string): Date {
  const parts = parsePromoCalendarDate(dateStr);
  if (!parts) return new Date(dateStr);
  return zonedDateTimeToUtc(parts.year, parts.month, parts.day, 0, 0, 0, 0, DEALER_TIME_ZONE);
}

/**
 * Inclusive end of the stored calendar date in America/Toronto.
 * Date-only strings and ISO timestamps with a YYYY-MM-DD prefix use that
 * calendar date, not the viewer's local timezone.
 */
export function promoEndOfDay(dateStr: string): Date {
  const parts = parsePromoCalendarDate(dateStr) ?? calendarPartsOf(dateStr);
  if (!parts) return new Date(dateStr);
  const ymd = `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
  const next = parsePromoCalendarDate(addDealerCalendarDays(ymd, 1));
  if (!next) return new Date(dateStr);
  const nextMidnight = zonedDateTimeToUtc(
    next.year,
    next.month,
    next.day,
    0,
    0,
    0,
    0,
    DEALER_TIME_ZONE,
  );
  return new Date(nextMidnight.getTime() - 1);
}

/**
 * Remaining Ontario calendar days until the promo end date.
 * 0 on the last day (still live). Past dates clamp to 0. Invalid input is NaN.
 */
export function daysUntil(date: Date | string, now: Date = new Date()): number {
  const endParts = calendarPartsOf(date);
  if (!endParts) return NaN;
  const todayParts = parsePromoCalendarDate(dealerCalendarDate(now));
  if (!todayParts) return NaN;
  const diffMs = Date.UTC(endParts.year, endParts.month - 1, endParts.day)
    - Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day);
  return Math.max(0, Math.round(diffMs / 86_400_000));
}

export function isPromotionLive(input: {
  startDate?: string | null;
  endDate?: string | null;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  if (input.startDate) {
    const start = promoStartOfDay(input.startDate);
    if (Number.isNaN(start.getTime()) || start > now) return false;
  }
  if (input.endDate) {
    const end = promoEndOfDay(input.endDate);
    if (Number.isNaN(end.getTime()) || end < now) return false;
  }
  return true;
}

export function formatPromoCalendarDate(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const parts = calendarPartsOf(value);
  if (!parts) return '';
  const noon = zonedDateTimeToUtc(parts.year, parts.month, parts.day, 12, 0, 0, 0, DEALER_TIME_ZONE);
  return new Intl.DateTimeFormat('en-CA', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: DEALER_TIME_ZONE,
    ...options,
  }).format(noon);
}

export function formatPromoDaysLeft(days: number): string {
  if (!Number.isFinite(days) || days <= 0) return 'Ends today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

/** PostgREST `.or()` clauses for DATE start/end columns. Inclusive of today. */
export function activePromotionDateOrFilters(now?: Date): {
  today: string;
  startOr: string;
  endOr: string;
} {
  const today = dealerToday(now);
  return {
    today,
    startOr: `start_date.is.null,start_date.lte.${today}`,
    endOr: `end_date.is.null,end_date.gte.${today}`,
  };
}
