import { describe, expect, it } from "vitest";

import {
  getWeekNumberForDate,
  getWeeklyMenuDeadline,
  getWeeklyMenuDeliveryDate,
} from "@/lib/menu/weekly-schedule";

describe("weekly menu schedule helpers", () => {
  it("calculates a rotating week number", () => {
    const weekNumber = getWeekNumberForDate("2025-01-05");
    expect(weekNumber).toBeGreaterThanOrEqual(1);
    expect(weekNumber).toBeLessThanOrEqual(4);
  });

  it("calculates order deadline and delivery date", () => {
    const deadline = getWeeklyMenuDeadline("2025-01-05");
    const delivery = getWeeklyMenuDeliveryDate("2025-01-05");

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date(deadline)).reduce<Record<string, string>>(
      (acc, part) => {
        if (part.type !== "literal") {
          acc[part.type] = part.value;
        }
        return acc;
      },
      {},
    );

    expect(parts.year).toBe("2025");
    expect(parts.month).toBe("01");
    expect(parts.day).toBe("08");
    expect(parts.hour).toBe("23");
    expect(parts.minute).toBe("59");
    expect(delivery).toBe("2025-01-11");
  });
});
