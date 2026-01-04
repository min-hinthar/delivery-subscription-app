import { describe, expect, it } from "vitest";

import { calculateDistance, formatDistance, formatDuration } from "../map-utils";

describe("Map Utilities", () => {
  describe("calculateDistance", () => {
    it("calculates distance between two points", () => {
      // Yangon to Mandalay (approx 630km)
      const distance = calculateDistance(16.8661, 96.1951, 21.9588, 96.0891);
      expect(distance).toBeGreaterThan(550000);
      expect(distance).toBeLessThan(600000);
    });

    it("returns 0 for same point", () => {
      const distance = calculateDistance(16.8661, 96.1951, 16.8661, 96.1951);
      expect(distance).toBe(0);
    });
  });

  describe("formatDistance", () => {
    it("formats meters", () => {
      expect(formatDistance(500)).toBe("500m");
      expect(formatDistance(999)).toBe("999m");
    });

    it("formats kilometers", () => {
      expect(formatDistance(1000)).toBe("1.0km");
      expect(formatDistance(5432)).toBe("5.4km");
    });
  });

  describe("formatDuration", () => {
    it("formats seconds", () => {
      expect(formatDuration(45)).toBe("45s");
    });

    it("formats minutes", () => {
      expect(formatDuration(180)).toBe("3min");
      expect(formatDuration(3599)).toBe("60min");
    });

    it("formats hours", () => {
      expect(formatDuration(3600)).toBe("1h");
      expect(formatDuration(5400)).toBe("1h 30min");
    });
  });
});
