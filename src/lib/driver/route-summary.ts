import type { SupabaseClient } from "@supabase/supabase-js";

type StopRow = {
  id: string;
  status: string;
  stop_order: number;
  appointment: {
    address: {
      line1: string | null;
      city: string | null;
      state: string | null;
    } | null;
    profile: {
      full_name: string | null;
    } | null;
  } | null;
};

type RouteRow = {
  id: string;
  name: string | null;
  status: string | null;
  week_of: string | null;
  start_time: string | null;
  end_time: string | null;
  delivery_stops: StopRow[] | null;
};

const COMPLETED_STOP_STATUSES = new Set(["completed", "delivered"]);

export type DriverRouteSummary = {
  id: string;
  name: string;
  status: string;
  week_of: string | null;
  start_time: string | null;
  end_time: string | null;
  stop_count: number;
  completed_count: number;
  next_stop: {
    address: string;
    customer_name: string;
  } | null;
};

function formatAddress(stop: StopRow | null) {
  if (!stop?.appointment?.address) {
    return "Address unavailable";
  }

  const { line1, city, state } = stop.appointment.address;
  return [line1, city, state].filter(Boolean).join(", ");
}

export async function getDriverRouteSummaries(options: {
  supabase: SupabaseClient;
  driverId: string;
  status?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
}) {
  const { supabase, driverId, status, dateStart, dateEnd } = options;

  let query = supabase
    .from("delivery_routes")
    .select(
      "id, name, status, week_of, start_time, end_time, delivery_stops(id, status, stop_order, appointment:delivery_appointments(address:addresses(line1,city,state), profile:profiles(full_name)))",
    )
    .eq("driver_id", driverId)
    .order("start_time", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  if (dateStart && dateEnd) {
    query = query.gte("start_time", dateStart).lt("start_time", dateEnd);
  }

  const { data } = await query;

  const routes = (data ?? []) as unknown as RouteRow[];

  return routes.map((route) => {
    const stops = route.delivery_stops ?? [];
    const completedCount = stops.filter((stop) =>
      COMPLETED_STOP_STATUSES.has(stop.status),
    ).length;
    const nextStop = stops
      .filter((stop) => !COMPLETED_STOP_STATUSES.has(stop.status))
      .sort((a, b) => a.stop_order - b.stop_order)[0];

    return {
      id: route.id,
      name: route.name ?? "Route",
      status: route.status ?? "pending",
      week_of: route.week_of,
      start_time: route.start_time,
      end_time: route.end_time,
      stop_count: stops.length,
      completed_count: completedCount,
      next_stop: nextStop
        ? {
            address: formatAddress(nextStop),
            customer_name: nextStop.appointment?.profile?.full_name ?? "Customer",
          }
        : null,
    } satisfies DriverRouteSummary;
  });
}
