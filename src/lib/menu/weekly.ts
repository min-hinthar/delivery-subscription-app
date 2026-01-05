import type { DayMenu, WeeklyMenuItem } from "@/types";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function groupMenuItemsByDay(
  items: WeeklyMenuItem[],
  weekStartDate: string,
): DayMenu[] {
  const start = new Date(weekStartDate);
  const grouped = new Map<number, DayMenu>();

  items.forEach((item) => {
    if (item.day_of_week === null || item.day_of_week === undefined) {
      return;
    }

    if (!item.dish) {
      return;
    }

    if (!grouped.has(item.day_of_week)) {
      const date = new Date(start);
      date.setDate(date.getDate() + item.day_of_week);

      grouped.set(item.day_of_week, {
        dayOfWeek: item.day_of_week,
        dayName: DAY_LABELS[item.day_of_week] ?? "",
        date: date.toISOString().split("T")[0],
        dishes: [],
      });
    }

    grouped.get(item.day_of_week)?.dishes.push({
      ...item,
      dish: item.dish,
    });
  });

  const days = Array.from(grouped.values());

  days.forEach((day) => {
    day.dishes.sort((a, b) => (a.meal_position ?? 0) - (b.meal_position ?? 0));
  });

  return days.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}
