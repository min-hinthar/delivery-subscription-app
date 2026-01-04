import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DriverLocation = {
  latitude: number;
  longitude: number;
  updated_at: string;
};

type RouteStop = {
  id: string;
  stop_order: number;
  status: string;
  completed_at: string | null;
  geocoded_lat: number | null;
  geocoded_lng: number | null;
};

type DistanceMatrixResponse = {
  status: string;
  error_message?: string;
  rows: Array<{
    elements: Array<{
      status: string;
      duration?: { value: number };
      duration_in_traffic?: { value: number };
    }>;
  }>;
};

const COMPLETED_STATUSES = new Set(["completed", "delivered"]);

const DEFAULT_STOP_DURATION_MINUTES = 6;

function getGoogleMapsKey() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GOOGLE_MAPS_API_KEY.");
  }

  return apiKey;
}

function buildLatLng(lat: number, lng: number) {
  return `${lat},${lng}`;
}

function isStopIncomplete(stop: RouteStop) {
  return !stop.completed_at && !COMPLETED_STATUSES.has(stop.status);
}

export async function calculateRouteEtas({
  routeId,
  averageStopMinutes = DEFAULT_STOP_DURATION_MINUTES,
}: {
  routeId: string;
  averageStopMinutes?: number;
}) {
  const supabase = createSupabaseAdminClient();

  const { data: driverLocation } = await supabase
    .from("driver_locations")
    .select("latitude, longitude, updated_at")
    .eq("route_id", routeId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<DriverLocation>();

  if (!driverLocation) {
    return { updated: false, reason: "missing_driver_location" };
  }

  const { data: stops } = await supabase
    .from("delivery_stops")
    .select("id, stop_order, status, completed_at, geocoded_lat, geocoded_lng")
    .eq("route_id", routeId)
    .order("stop_order", { ascending: true });

  const routeStops = (stops ?? []).filter(
    (stop): stop is RouteStop =>
      Boolean(stop.id) && typeof stop.stop_order === "number",
  );

  const stopsWithCoordinates = routeStops.filter(
    (stop) => stop.geocoded_lat !== null && stop.geocoded_lng !== null,
  );

  if (stopsWithCoordinates.length === 0) {
    return { updated: false, reason: "missing_stop_coordinates" };
  }

  const apiKey = getGoogleMapsKey();
  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", buildLatLng(driverLocation.latitude, driverLocation.longitude));
  url.searchParams.set(
    "destinations",
    stopsWithCoordinates
      .map((stop) => buildLatLng(stop.geocoded_lat ?? 0, stop.geocoded_lng ?? 0))
      .join("|"),
  );
  url.searchParams.set("departure_time", "now");
  url.searchParams.set("traffic_model", "best_guess");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  const data = (await response.json()) as DistanceMatrixResponse;

  if (data.status !== "OK") {
    throw new Error(data.error_message || "Failed to fetch distance matrix.");
  }

  const elements = data.rows?.[0]?.elements ?? [];

  let incompleteBefore = 0;
  const updates: Array<{ id: string; estimated_arrival: string }> = [];

  stopsWithCoordinates.forEach((stop, index) => {
    const element = elements[index];
    if (!element || element.status !== "OK") {
      return;
    }

    const baseSeconds = element.duration_in_traffic?.value ?? element.duration?.value ?? 0;
    const extraStopSeconds = incompleteBefore * averageStopMinutes * 60;
    const etaSeconds = baseSeconds + extraStopSeconds;
    const etaTimestamp = new Date(Date.now() + etaSeconds * 1000).toISOString();

    if (isStopIncomplete(stop)) {
      updates.push({ id: stop.id, estimated_arrival: etaTimestamp });
      incompleteBefore += 1;
    }
  });

  if (updates.length === 0) {
    return { updated: false, reason: "no_incomplete_stops" };
  }

  const updatePromises = updates.map((update) =>
    supabase
      .from("delivery_stops")
      .update({ estimated_arrival: update.estimated_arrival })
      .eq("id", update.id),
  );

  const results = await Promise.all(updatePromises);
  const hasError = results.some((result) => result.error);

  return { updated: !hasError, updates: updates.length };
}
