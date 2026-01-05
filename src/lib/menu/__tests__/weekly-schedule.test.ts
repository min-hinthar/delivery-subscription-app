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

    // Verify deadline is an ISO string
    expect(deadline).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // Verify deadline in LA timezone is 3 days after start date at 11:59 PM
    const deadlineDate = new Date(deadline);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(deadlineDate).reduce<Record<string, string>>(
      (acc, part) => {
        if (part.type !== "literal") {
          acc[part.type] = part.value;
        }
        return acc;
      },
      {},
    );

    // 2025-01-05 + 3 days = 2025-01-08 at 23:59 LA time
    expect(parts.year).toBe("2025");
    expect(parts.month).toBe("01");
    expect(parts.day).toBe("08");
    expect(parts.hour).toBe("23");
    expect(parts.minute).toBe("59");

    // Delivery should be 6 days after start date
    expect(delivery).toBe("2025-01-11");
  });
});
