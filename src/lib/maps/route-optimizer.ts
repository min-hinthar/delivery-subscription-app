export type RouteOptimizerStop = {
  id: string;
  address: string;
};

export type OptimizedRoute = {
  orderedStops: RouteOptimizerStop[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  polyline: string | null;
};

type DirectionsLeg = {
  distance: { value: number };
  duration: { value: number };
};

type DirectionsRoute = {
  legs: DirectionsLeg[];
  waypoint_order?: number[];
  overview_polyline?: { points: string };
};

type DirectionsResponse = {
  routes?: DirectionsRoute[];
};

/**
 * Maximum number of waypoints supported by Google Directions API.
 * This is the limit for waypoints EXCLUDING the origin and destination.
 */
const MAX_WAYPOINTS = 25;

export async function optimizeRoute(
  origin: string,
  stops: RouteOptimizerStop[],
): Promise<OptimizedRoute> {
  if (stops.length === 0) {
    return {
      orderedStops: [],
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      polyline: null,
    };
  }

  // Validate waypoint count (Google limit: 25 waypoints + origin + destination = 27 total locations)
  const waypointCount = stops.length - 1; // Destination is not a waypoint
  if (waypointCount > MAX_WAYPOINTS) {
    throw new Error(
      `Too many stops (${stops.length}). Google Directions API supports a maximum of ${MAX_WAYPOINTS + 1} stops (including origin and destination). Consider splitting this route into multiple segments.`,
    );
  }

  // Validate that all stops have addresses
  const stopsWithoutAddresses = stops.filter((stop) => !stop.address?.trim());
  if (stopsWithoutAddresses.length > 0) {
    throw new Error(
      `${stopsWithoutAddresses.length} stop(s) are missing addresses. All stops must have valid addresses for route optimization.`,
    );
  }

  const destination = stops[stops.length - 1].address;
  const waypoints = stops.slice(0, -1).map((stop) => stop.address);

  let response;
  try {
    response = await fetch("/api/maps/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin,
        destination,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
        optimize: true,
      }),
    });
  } catch (error) {
    throw new Error(
      `Network error while optimizing route: ${error instanceof Error ? error.message : "Unknown error"}. Please check your internet connection.`,
    );
  }

  const payload = await response.json();
  if (!payload.ok) {
    const errorCode = payload.error?.code;
    const errorMessage = payload.error?.message;

    // Provide specific error messages based on error code
    if (errorCode === "RATE_LIMITED") {
      throw new Error("Too many route optimization requests. Please wait a moment and try again.");
    }
    if (errorCode === "DIRECTIONS_ERROR") {
      throw new Error(
        `Google Maps couldn't find a route: ${errorMessage ?? "Unknown error"}. Check that all addresses are valid and accessible.`,
      );
    }

    throw new Error(errorMessage ?? "Unable to optimize route. Please try again.");
  }

  const data = payload.data as DirectionsResponse;
  const route = data.routes?.[0];

  if (!route) {
    throw new Error(
      "No route could be calculated. This may happen if locations are inaccessible or too far apart. Try reducing the number of stops or verifying addresses.",
    );
  }

  const waypointOrder = route.waypoint_order ?? [];

  // Validate waypoint_order integrity
  if (waypointOrder.length > 0 && waypointOrder.length !== waypoints.length) {
    console.warn(
      `[Route Optimizer] Waypoint order mismatch: expected ${waypoints.length} waypoints, received ${waypointOrder.length}. Using original order.`,
    );
  }

  const orderedWaypoints = waypointOrder.length && waypointOrder.length === waypoints.length
    ? waypointOrder.map((index) => stops[index])
    : stops.slice(0, -1);

  const orderedStops = [...orderedWaypoints, stops[stops.length - 1]];

  const totalDistanceMeters = (route.legs ?? []).reduce(
    (sum, leg) => sum + (leg.distance?.value ?? 0),
    0,
  );
  const totalDurationSeconds = (route.legs ?? []).reduce(
    (sum, leg) => sum + (leg.duration?.value ?? 0),
    0,
  );

  return {
    orderedStops,
    totalDistanceMeters,
    totalDurationSeconds,
    polyline: route.overview_polyline?.points ?? null,
  };
}
