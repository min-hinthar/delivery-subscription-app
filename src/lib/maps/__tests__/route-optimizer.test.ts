import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { optimizeRoute, type RouteOptimizerStop } from "../route-optimizer";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("optimizeRoute", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Empty and single stop routes", () => {
    it("handles empty stops array", async () => {
      const result = await optimizeRoute("123 Main St", []);

      expect(result).toEqual({
        orderedStops: [],
        totalDistanceMeters: 0,
        totalDurationSeconds: 0,
        polyline: null,
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("handles single stop", async () => {
      const stops: RouteOptimizerStop[] = [
        { id: "stop-1", address: "456 Oak Ave, Covina, CA 91723" },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          ok: true,
          data: {
            routes: [
              {
                legs: [{ distance: { value: 5000 }, duration: { value: 600 } }],
                overview_polyline: { points: "encoded_polyline_data" },
              },
            ],
          },
        }),
      });

      const result = await optimizeRoute("123 Main St", stops);

      expect(result.orderedStops).toHaveLength(1);
      expect(result.orderedStops[0].id).toBe("stop-1");
      expect(result.totalDistanceMeters).toBe(5000);
      expect(result.totalDurationSeconds).toBe(600);
    });
  });

  describe("Multi-stop optimization", () => {
    it("optimizes route with multiple stops", async () => {
      const stops: RouteOptimizerStop[] = [
        { id: "stop-1", address: "456 Oak Ave, Covina, CA 91723" },
        { id: "stop-2", address: "789 Pine St, Covina, CA 91723" },
        { id: "stop-3", address: "321 Elm Dr, Covina, CA 91723" },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          ok: true,
          data: {
            routes: [
              {
                legs: [
                  { distance: { value: 2000 }, duration: { value: 300 } },
                  { distance: { value: 1500 }, duration: { value: 240 } },
                  { distance: { value: 2500 }, duration: { value: 360 } },
                ],
                waypoint_order: [1, 0], // Google reordered: stop-2, stop-1, then stop-3 (destination)
                overview_polyline: { points: "optimized_polyline" },
              },
            ],
          },
        }),
      });

      const result = await optimizeRoute("123 Main St", stops);

      expect(result.orderedStops).toHaveLength(3);
      // waypoint_order [1, 0] means: stops[1] (stop-2), stops[0] (stop-1), stops[2] (stop-3 as destination)
      expect(result.orderedStops[0].id).toBe("stop-2");
      expect(result.orderedStops[1].id).toBe("stop-1");
      expect(result.orderedStops[2].id).toBe("stop-3");
      expect(result.totalDistanceMeters).toBe(6000);
      expect(result.totalDurationSeconds).toBe(900);
      expect(result.polyline).toBe("optimized_polyline");
    });

    it("uses waypoints correctly with optimization flag", async () => {
      const stops: RouteOptimizerStop[] = [
        { id: "stop-1", address: "456 Oak Ave" },
        { id: "stop-2", address: "789 Pine St" },
        { id: "stop-3", address: "321 Elm Dr" },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          ok: true,
          data: {
            routes: [
              {
                legs: [
                  { distance: { value: 1000 }, duration: { value: 120 } },
                  { distance: { value: 1000 }, duration: { value: 120 } },
                  { distance: { value: 1000 }, duration: { value: 120 } },
                ],
                waypoint_order: [0, 1],
                overview_polyline: { points: "test_polyline" },
              },
            ],
          },
        }),
      });

      await optimizeRoute("123 Main St", stops);

      expect(mockFetch).toHaveBeenCalledWith("/api/maps/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: "123 Main St",
          destination: "321 Elm Dr", // Last stop is destination
          waypoints: ["456 Oak Ave", "789 Pine St"], // First n-1 stops are waypoints
          optimize: true,
        }),
      });
    });
  });

  describe("Edge cases and error handling", () => {
    it("throws error when API returns not ok", async () => {
      const stops: RouteOptimizerStop[] = [
        { id: "stop-1", address: "456 Oak Ave" },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          ok: false,
          error: { message: "Invalid API key" },
        }),
      });

      await expect(optimizeRoute("123 Main St", stops)).rejects.toThrow(
        "Invalid API key",
      );
    });

    it("throws error when API returns generic error without message", async () => {
      const stops: RouteOptimizerStop[] = [
        { id: "stop-1", address: "456 Oak Ave" },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          ok: false,
        }),
      });

      await expect(optimizeRoute("123 Main St", stops)).rejects.toThrow(
        "Unable to optimize route.",
      );
    });

    it("throws error when no routes returned", async () => {
      const stops: RouteOptimizerStop[] = [
        { id: "stop-1", address: "456 Oak Ave" },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          ok: true,
          data: { routes: [] },
        }),
      });

      await expect(optimizeRoute("123 Main St", stops)).rejects.toThrow(
        "No route could be calculated",
      );
    });

    it("handles missing waypoint_order gracefully", async () => {
      const stops: RouteOptimizerStop[] = [
        { id: "stop-1", address: "456 Oak Ave" },
        { id: "stop-2", address: "789 Pine St" },
        { id: "stop-3", address: "321 Elm Dr" },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          ok: true,
          data: {
            routes: [
              {
                legs: [
                  { distance: { value: 1000 }, duration: { value: 120 } },
                  { distance: { value: 1000 }, duration: { value: 120 } },
                  { distance: { value: 1000 }, duration: { value: 120 } },
                ],
                // No waypoint_order provided
                overview_polyline: { points: "test_polyline" },
              },
            ],
          },
        }),
      });

      const result = await optimizeRoute("123 Main St", stops);

      // Should maintain original order when waypoint_order is missing
      expect(result.orderedStops[0].id).toBe("stop-1");
      expect(result.orderedStops[1].id).toBe("stop-2");
      expect(result.orderedStops[2].id).toBe("stop-3");
    });

    it("handles missing distance and duration values", async () => {
      const stops: RouteOptimizerStop[] = [
        { id: "stop-1", address: "456 Oak Ave" },
        { id: "stop-2", address: "789 Pine St" },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          ok: true,
          data: {
            routes: [
              {
                legs: [
                  {}, // Missing distance and duration
                  { distance: { value: 1000 }, duration: { value: 120 } },
                ],
                overview_polyline: { points: "test_polyline" },
              },
            ],
          },
        }),
      });

      const result = await optimizeRoute("123 Main St", stops);

      expect(result.totalDistanceMeters).toBe(1000);
      expect(result.totalDurationSeconds).toBe(120);
    });

    it("handles missing polyline", async () => {
      const stops: RouteOptimizerStop[] = [
        { id: "stop-1", address: "456 Oak Ave" },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          ok: true,
          data: {
            routes: [
              {
                legs: [{ distance: { value: 1000 }, duration: { value: 120 } }],
                // No overview_polyline
              },
            ],
          },
        }),
      });

      const result = await optimizeRoute("123 Main St", stops);

      expect(result.polyline).toBeNull();
    });

    it("handles empty waypoint_order array", async () => {
      const stops: RouteOptimizerStop[] = [
        { id: "stop-1", address: "456 Oak Ave" },
        { id: "stop-2", address: "789 Pine St" },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          ok: true,
          data: {
            routes: [
              {
                legs: [
                  { distance: { value: 1000 }, duration: { value: 120 } },
                  { distance: { value: 1000 }, duration: { value: 120 } },
                ],
                waypoint_order: [], // Empty array
                overview_polyline: { points: "test_polyline" },
              },
            ],
          },
        }),
      });

      const result = await optimizeRoute("123 Main St", stops);

      // Should maintain original order
      expect(result.orderedStops[0].id).toBe("stop-1");
      expect(result.orderedStops[1].id).toBe("stop-2");
    });
  });

  describe("Large route handling", () => {
    it("handles route with exactly 26 stops (Google limit: 25 waypoints + destination)", async () => {
      const stops: RouteOptimizerStop[] = Array.from({ length: 26 }, (_, i) => ({
        id: `stop-${i + 1}`,
        address: `${100 + i} Street ${i + 1}`,
      }));

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          ok: true,
          data: {
            routes: [
              {
                legs: Array.from({ length: 26 }, () => ({
                  distance: { value: 1000 },
                  duration: { value: 120 },
                })),
                waypoint_order: Array.from({ length: 25 }, (_, i) => i),
                overview_polyline: { points: "large_route_polyline" },
              },
            ],
          },
        }),
      });

      const result = await optimizeRoute("123 Main St", stops);

      expect(result.orderedStops).toHaveLength(26);
      expect(result.totalDistanceMeters).toBe(26000);
      expect(result.totalDurationSeconds).toBe(3120);
    });

    it("throws error when route exceeds Google's 26 stop limit", async () => {
      const stops: RouteOptimizerStop[] = Array.from({ length: 27 }, (_, i) => ({
        id: `stop-${i + 1}`,
        address: `${100 + i} Street ${i + 1}`,
      }));

      await expect(optimizeRoute("123 Main St", stops)).rejects.toThrow(
        "Too many stops (27). Google Directions API supports a maximum of 26 stops",
      );
    });

    it("throws error when stops are missing addresses", async () => {
      const stops: RouteOptimizerStop[] = [
        { id: "stop-1", address: "456 Oak Ave" },
        { id: "stop-2", address: "" }, // Missing address
        { id: "stop-3", address: "   " }, // Whitespace only
      ];

      await expect(optimizeRoute("123 Main St", stops)).rejects.toThrow(
        "2 stop(s) are missing addresses",
      );
    });
  });

  describe("Network errors", () => {
    it("throws error when fetch fails", async () => {
      const stops: RouteOptimizerStop[] = [
        { id: "stop-1", address: "456 Oak Ave" },
      ];

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(optimizeRoute("123 Main St", stops)).rejects.toThrow(
        "Network error",
      );
    });

    it("throws error when response is not valid JSON", async () => {
      const stops: RouteOptimizerStop[] = [
        { id: "stop-1", address: "456 Oak Ave" },
      ];

      mockFetch.mockResolvedValueOnce({
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(optimizeRoute("123 Main St", stops)).rejects.toThrow(
        "Invalid JSON",
      );
    });
  });
});
