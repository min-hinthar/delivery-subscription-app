const DAY_MS = 24 * 60 * 60 * 1000;
const KITCHEN_TIME_ZONE = "America/Los_Angeles";

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

function getTimeZoneOffset(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUTC - date.getTime();
}

function zonedTimeToUtc(parts: DateParts, timeZone: string) {
  const utcDate = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      parts.millisecond,
    ),
  );
  const offset = getTimeZoneOffset(utcDate, timeZone);
  return new Date(utcDate.getTime() - offset);
}

function addDays(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  return {
    year: base.getUTCFullYear(),
    month: base.getUTCMonth() + 1,
    day: base.getUTCDate(),
  };
}

export function getWeekNumberForDate(weekStartDate: string) {
  const date = new Date(`${weekStartDate}T00:00:00Z`);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((date.getTime() - yearStart.getTime()) / DAY_MS) + 1;
  const weekNumber = Math.ceil(dayOfYear / 7);
  return ((weekNumber - 1) % 4) + 1;
}

export function getWeeklyMenuDeadline(weekStartDate: string) {
  const target = addDays(weekStartDate, 3);
  const deadline = zonedTimeToUtc(
    {
      ...target,
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    },
    KITCHEN_TIME_ZONE,
  );
  return deadline.toISOString();
}

export function getWeeklyMenuDeliveryDate(weekStartDate: string) {
  const target = addDays(weekStartDate, 6);
  return `${target.year}-${String(target.month).padStart(2, "0")}-${String(
    target.day,
  ).padStart(2, "0")}`;
}
