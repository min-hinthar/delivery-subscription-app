import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  cacheTrackingData,
  getCachedTrackingData,
  clearCachedTrackingData,
  clearAllTrackingCaches,
} from "../offline-cache";

/**
 * Tests for offline caching functionality
 */

describe("Offline Cache", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("cacheTrackingData", () => {
    it("should store tracking data in localStorage", () => {
      const routeId = "route-123";
      const driverLocation = {
        lat: 16.8409,
        lng: 96.1735,
        heading: 45,
        updatedAt: new Date().toISOString(),
      };
      const stops = [
        {
          id: "stop-1",
          stopOrder: 1,
          status: "pending",
          estimatedArrival: new Date().toISOString(),
          completedAt: null,
        },
      ];

      cacheTrackingData(routeId, driverLocation, stops);

      const cached = getCachedTrackingData(routeId);
      expect(cached).not.toBeNull();
      expect(cached?.routeId).toBe(routeId);
      expect(cached?.driverLocation?.lat).toBe(driverLocation.lat);
      expect(cached?.stops).toHaveLength(1);
    });

    it("should handle null driver location", () => {
      const routeId = "route-456";
      const stops = [
        {
          id: "stop-1",
          stopOrder: 1,
          status: "pending",
          estimatedArrival: null,
          completedAt: null,
        },
      ];

      cacheTrackingData(routeId, null, stops);

      const cached = getCachedTrackingData(routeId);
      expect(cached?.driverLocation).toBeNull();
      expect(cached?.stops).toHaveLength(1);
    });

    it("should update existing cache", () => {
      const routeId = "route-789";
      const initialStops = [
        {
          id: "stop-1",
          stopOrder: 1,
          status: "pending",
          estimatedArrival: null,
          completedAt: null,
        },
      ];
      const updatedStops = [
        {
          id: "stop-1",
          stopOrder: 1,
          status: "completed",
          estimatedArrival: null,
          completedAt: new Date().toISOString(),
        },
      ];

      cacheTrackingData(routeId, null, initialStops);
      cacheTrackingData(routeId, null, updatedStops);

      const cached = getCachedTrackingData(routeId);
      expect(cached?.stops[0]?.status).toBe("completed");
    });
  });

  describe("getCachedTrackingData", () => {
    it("should return null for non-existent route", () => {
      const cached = getCachedTrackingData("non-existent-route");
      expect(cached).toBeNull();
    });

    it("should return null for expired cache", () => {
      const routeId = "route-expired";
      const stops = [
        {
          id: "stop-1",
          stopOrder: 1,
          status: "pending",
          estimatedArrival: null,
          completedAt: null,
        },
      ];

      // Cache with timestamp 2 hours ago (expired)
      const expiredData = {
        routeId,
        driverLocation: null,
        stops,
        lastCached: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      };

      localStorage.setItem(`tracking_cache_${routeId}`, JSON.stringify(expiredData));

      const cached = getCachedTrackingData(routeId);
      expect(cached).toBeNull();
    });

    it("should return cached data if not expired", () => {
      const routeId = "route-valid";
      const stops = [
        {
          id: "stop-1",
          stopOrder: 1,
          status: "pending",
          estimatedArrival: null,
          completedAt: null,
        },
      ];

      cacheTrackingData(routeId, null, stops);

      const cached = getCachedTrackingData(routeId);
      expect(cached).not.toBeNull();
      expect(cached?.routeId).toBe(routeId);
    });
  });

  describe("clearCachedTrackingData", () => {
    it("should remove specific route cache", () => {
      const routeId = "route-to-clear";
      const stops = [
        {
          id: "stop-1",
          stopOrder: 1,
          status: "pending",
          estimatedArrival: null,
          completedAt: null,
        },
      ];

      cacheTrackingData(routeId, null, stops);
      expect(getCachedTrackingData(routeId)).not.toBeNull();

      clearCachedTrackingData(routeId);
      expect(getCachedTrackingData(routeId)).toBeNull();
    });
  });

  describe("clearAllTrackingCaches", () => {
    it("should clear all tracking caches", () => {
      const stops = [
        {
          id: "stop-1",
          stopOrder: 1,
          status: "pending",
          estimatedArrival: null,
          completedAt: null,
        },
      ];

      cacheTrackingData("route-1", null, stops);
      cacheTrackingData("route-2", null, stops);
      cacheTrackingData("route-3", null, stops);

      // Also add non-tracking data to ensure it's not deleted
      localStorage.setItem("other-data", "should-remain");

      clearAllTrackingCaches();

      expect(getCachedTrackingData("route-1")).toBeNull();
      expect(getCachedTrackingData("route-2")).toBeNull();
      expect(getCachedTrackingData("route-3")).toBeNull();
      expect(localStorage.getItem("other-data")).toBe("should-remain");
    });
  });
});
