import { describe, expect, it } from "vitest";

import { isWithinDoNotDisturb, type NotificationSettings } from "@/lib/notifications/browser-notifications";

describe("isWithinDoNotDisturb", () => {
  it("handles overnight DnD (21:00-07:00)", () => {
    const settings: NotificationSettings = {
      enabled: true,
      etaThresholdMinutes: 10,
      dndStart: "21:00",
      dndEnd: "07:00",
    };

    expect(isWithinDoNotDisturb(settings, new Date("2026-01-04T22:00:00"))).toBe(true);
    expect(isWithinDoNotDisturb(settings, new Date("2026-01-04T06:00:00"))).toBe(true);
    expect(isWithinDoNotDisturb(settings, new Date("2026-01-04T12:00:00"))).toBe(false);
  });
});
