const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
};

export const PT_TIME_ZONE = "America/Los_Angeles";

function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const timeZoneName = parts.find((part) => part.type === "timeZoneName")?.value;

  if (!timeZoneName) {
    return 0;
  }

  const match = timeZoneName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);

  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number.parseInt(match[2], 10);
  const minutes = Number.parseInt(match[3] ?? "0", 10);

  return sign * (hours * 60 + minutes);
}

export function toUtcFromTimeZone(parts: DateParts, timeZone: string) {
  const hour = parts.hour ?? 0;
  const minute = parts.minute ?? 0;
  const utcGuess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute));
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, timeZone);

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute) - offsetMinutes * 60000);
}

export function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);

  const year = Number.parseInt(parts.find((part) => part.type === "year")?.value ?? "0", 10);
  const month = Number.parseInt(parts.find((part) => part.type === "month")?.value ?? "1", 10);
  const day = Number.parseInt(parts.find((part) => part.type === "day")?.value ?? "1", 10);

  return { year, month, day };
}

export function getWeekdayInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" });
  const label = formatter.format(date);

  return WEEKDAY_SHORT.indexOf(label as (typeof WEEKDAY_SHORT)[number]);
}

export function formatDateYYYYMMDD(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getUpcomingWeekStarts(count = 4, fromDate = new Date()) {
  const results: Date[] = [];
  let cursor = new Date(fromDate.getTime());

  for (let attempts = 0; results.length < count && attempts < 30; attempts += 1) {
    const weekday = getWeekdayInTimeZone(cursor, PT_TIME_ZONE);

    if (weekday === 6) {
      const { year, month, day } = getDatePartsInTimeZone(cursor, PT_TIME_ZONE);
      const saturday = toUtcFromTimeZone({ year, month, day }, PT_TIME_ZONE);
      results.push(saturday);
    }

    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return results;
}

export function getCutoffForWeek(weekOf: Date) {
  const friday = new Date(weekOf.getTime() - 24 * 60 * 60 * 1000);
  const { year, month, day } = getDatePartsInTimeZone(friday, PT_TIME_ZONE);

  return toUtcFromTimeZone({ year, month, day, hour: 17, minute: 0 }, PT_TIME_ZONE);
}

export function isAfterCutoff(weekOf: Date, now = new Date()) {
  const cutoff = getCutoffForWeek(weekOf);
  return now.getTime() > cutoff.getTime();
}
