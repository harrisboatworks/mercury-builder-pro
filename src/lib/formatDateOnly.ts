/**
 * Format a date-only YYYY-MM-DD value on that calendar day in both
 * America/Toronto and UTC. `new Date("YYYY-MM-DD")` is UTC midnight, which
 * displays as the previous evening in Toronto.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/;

export type DateOnlyTimeZone = "America/Toronto" | "UTC";

export function dateOnlyUtcNoon(value: string): Date | null {
  const match = DATE_ONLY.exec(String(value || "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function calendarDateOnly(value: string, timeZone: DateOnlyTimeZone): string {
  const date = dateOnlyUtcNoon(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDateOnly(
  value: string,
  locale: string,
  timeZone: DateOnlyTimeZone = "America/Toronto",
): string {
  const date = dateOnlyUtcNoon(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
