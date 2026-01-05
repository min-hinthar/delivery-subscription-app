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

    expect(deadline.startsWith("2025-01-08")).toBe(true);
    expect(delivery).toBe("2025-01-11");
  });
});
