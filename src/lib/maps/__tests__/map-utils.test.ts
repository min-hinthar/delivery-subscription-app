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

    describe("edge cases", () => {
      it("handles North Pole", () => {
        // Distance from North Pole to a point 1 degree south
        const distance = calculateDistance(90, 0, 89, 0);
        expect(distance).toBeGreaterThan(110000); // ~111km per degree at poles
        expect(distance).toBeLessThan(112000);
      });

      it("handles South Pole", () => {
        const distance = calculateDistance(-90, 0, -89, 0);
        expect(distance).toBeGreaterThan(110000);
        expect(distance).toBeLessThan(112000);
      });

      it("handles antimeridian crossing (180/-180)", () => {
        // Two points on opposite sides of the date line
        const distance = calculateDistance(0, 179, 0, -179);
        // Should calculate the short distance (2 degrees) not the long way (358 degrees)
        expect(distance).toBeLessThan(250000); // ~222km for 2 degrees at equator
      });

      it("handles antimeridian crossing (negative to positive)", () => {
        const distance = calculateDistance(10, -179.5, 10, 179.5);
        // 1 degree apart across antimeridian
        expect(distance).toBeLessThan(120000);
      });

      it("handles equator crossing", () => {
        const distance = calculateDistance(-1, 0, 1, 0);
        expect(distance).toBeGreaterThan(220000); // ~222km for 2 degrees
        expect(distance).toBeLessThan(225000);
      });

      it("throws error for invalid latitude (too high)", () => {
        expect(() => calculateDistance(91, 0, 0, 0)).toThrow(
          /latitude must be between -90 and 90/
        );
      });

      it("throws error for invalid latitude (too low)", () => {
        expect(() => calculateDistance(-91, 0, 0, 0)).toThrow(
          /latitude must be between -90 and 90/
        );
      });

      it("throws error for invalid longitude (too high)", () => {
        expect(() => calculateDistance(0, 181, 0, 0)).toThrow(
          /longitude must be between -180 and 180/
        );
      });

      it("throws error for invalid longitude (too low)", () => {
        expect(() => calculateDistance(0, -181, 0, 0)).toThrow(
          /longitude must be between -180 and 180/
        );
      });

      it("throws error for NaN latitude", () => {
        expect(() => calculateDistance(NaN, 0, 0, 0)).toThrow(/must be finite numbers/);
      });

      it("throws error for NaN longitude", () => {
        expect(() => calculateDistance(0, NaN, 0, 0)).toThrow(/must be finite numbers/);
      });

      it("throws error for Infinity", () => {
        expect(() => calculateDistance(Infinity, 0, 0, 0)).toThrow(/must be finite numbers/);
      });

      it("handles very small distances (sub-meter precision)", () => {
        // Two points 1 meter apart (approximately)
        const lat1 = 16.8661;
        const lng1 = 96.1951;
        const lat2 = 16.8661 + 0.000009; // ~1 meter north
        const lng2 = 96.1951;

        const distance = calculateDistance(lat1, lng1, lat2, lng2);
        expect(distance).toBeGreaterThan(0.5);
        expect(distance).toBeLessThan(2); // Should be ~1 meter
      });

      it("handles maximum distance (antipodal points)", () => {
        // Opposite sides of Earth
        const distance = calculateDistance(0, 0, 0, 180);
        // Half Earth's circumference at equator
        expect(distance).toBeGreaterThan(20000000); // ~20,000 km
        expect(distance).toBeLessThan(20100000);
      });
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

    it("handles zero distance", () => {
      expect(formatDistance(0)).toBe("0m");
    });

    it("handles very large distances", () => {
      expect(formatDistance(1234567)).toBe("1234.6km");
    });

    it("handles sub-meter distances", () => {
      expect(formatDistance(0.5)).toBe("1m"); // Rounds to 1m
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

    it("handles zero duration", () => {
      expect(formatDuration(0)).toBe("0s");
    });

    it("formats hours without minutes when exact", () => {
      expect(formatDuration(7200)).toBe("2h");
    });

    it("handles very long durations", () => {
      expect(formatDuration(86400)).toBe("24h"); // 1 day
    });
  });
});
