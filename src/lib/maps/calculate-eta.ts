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

// Time-of-day factors for more accurate ETAs
// Peak hours have longer stop durations due to traffic, parking, etc.
const TIME_OF_DAY_FACTORS = {
  earlyMorning: { start: 6, end: 9, factor: 1.2 }, // 6am-9am: Rush hour
  midday: { start: 9, end: 11, factor: 0.9 }, // 9am-11am: Lighter traffic
  lunch: { start: 11, end: 14, factor: 1.1 }, // 11am-2pm: Lunch rush
  afternoon: { start: 14, end: 17, factor: 0.9 }, // 2pm-5pm: Moderate
  evening: { start: 17, end: 20, factor: 1.3 }, // 5pm-8pm: Evening rush
  night: { start: 20, end: 24, factor: 1.0 }, // 8pm-midnight: Normal
  lateNight: { start: 0, end: 6, factor: 0.8 }, // Midnight-6am: Fastest
};

// Day-of-week factors
const DAY_OF_WEEK_FACTORS = {
  weekday: 1.0, // Monday-Friday
  saturday: 1.1, // Busier than weekdays
  sunday: 0.9, // Typically lighter
};

function getTimeOfDayFactor(hour: number): number {
  for (const period of Object.values(TIME_OF_DAY_FACTORS)) {
    if (hour >= period.start && hour < period.end) {
      return period.factor;
    }
  }
  return 1.0;
}

function getDayOfWeekFactor(date: Date): number {
  const day = date.getDay();
  if (day === 0) return DAY_OF_WEEK_FACTORS.sunday;
  if (day === 6) return DAY_OF_WEEK_FACTORS.saturday;
  return DAY_OF_WEEK_FACTORS.weekday;
}

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
  useTimeFactors = true,
}: {
  routeId: string;
  averageStopMinutes?: number;
  useTimeFactors?: boolean;
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
  let cumulativeSeconds = 0;

  stopsWithCoordinates.forEach((stop, index) => {
    const element = elements[index];
    if (!element || element.status !== "OK") {
      return;
    }

    // Base driving time with traffic
    const baseDrivingSeconds = element.duration_in_traffic?.value ?? element.duration?.value ?? 0;

    // Calculate adjusted stop duration based on time factors
    let adjustedStopMinutes = averageStopMinutes;
    if (useTimeFactors) {
      const estimatedArrival = new Date(Date.now() + cumulativeSeconds * 1000 + baseDrivingSeconds * 1000);
      const timeOfDayFactor = getTimeOfDayFactor(estimatedArrival.getHours());
      const dayOfWeekFactor = getDayOfWeekFactor(estimatedArrival);
      adjustedStopMinutes = averageStopMinutes * timeOfDayFactor * dayOfWeekFactor;
    }

    // Add driving time to current stop
    cumulativeSeconds += baseDrivingSeconds;

    // Add time for all previous incomplete stops
    cumulativeSeconds += incompleteBefore * adjustedStopMinutes * 60;

    const etaTimestamp = new Date(Date.now() + cumulativeSeconds * 1000).toISOString();

    if (isStopIncomplete(stop)) {
      updates.push({ id: stop.id, estimated_arrival: etaTimestamp });
      incompleteBefore += 1;

      // Reset cumulative for next stop calculation
      cumulativeSeconds = 0;
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
