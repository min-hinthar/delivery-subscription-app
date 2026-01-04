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

  const destination = stops[stops.length - 1].address;
  const waypoints = stops.slice(0, -1).map((stop) => stop.address);

  const response = await fetch("/api/maps/directions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin,
      destination,
      waypoints: waypoints.length > 0 ? waypoints : undefined,
      optimize: true,
    }),
  });

  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Unable to optimize route.");
  }

  const data = payload.data as DirectionsResponse;
  const route = data.routes?.[0];

  if (!route) {
    throw new Error("No route returned from Google Directions.");
  }

  const waypointOrder = route.waypoint_order ?? [];
  const orderedWaypoints = waypointOrder.length
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
