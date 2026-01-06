import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { directionsRoute, toPrintableAddress } from "@/lib/maps/google";
import { KITCHEN_ORIGIN } from "@/lib/maps/route";

const buildRouteSchema = z.object({
  week_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().max(120).optional().nullable(),
  optimize: z.boolean().optional().default(true),
  driver_id: z.string().uuid().optional().nullable(),
  start_time: z.string().datetime().optional().nullable(),
  stop_order: z
    .array(
      z.object({
        appointment_id: z.string().uuid(),
        order: z.number().int().min(1),
      }),
    )
    .min(1),
});

type Address = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
};

type AppointmentRow = {
  id: string;
  address: Address | null;
};

export async function POST(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = buildRouteSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid route payload.", { status: 422 });
  }

  const orderedStops = [...parsed.data.stop_order].sort((a, b) => a.order - b.order);
  const orderValues = orderedStops.map((stop) => stop.order);
  const uniqueOrders = new Set(orderValues);
  if (uniqueOrders.size !== orderedStops.length) {
    return bad("Stop order values must be unique.", { status: 422 });
  }

  const appointmentIds = orderedStops.map((stop) => stop.appointment_id);
  const uniqueAppointments = new Set(appointmentIds);
  if (uniqueAppointments.size !== appointmentIds.length) {
    return bad("Stop appointments must be unique.", { status: 422 });
  }

  const baseRouteName = parsed.data.name ?? "Weekend Route";
  const { data: existingNames } = await supabase
    .from("delivery_routes")
    .select("name")
    .eq("week_of", parsed.data.week_of)
    .like("name", `${baseRouteName}%`);

  const normalizedNames = new Set(
    (existingNames ?? [])
      .map((row) => row.name)
      .filter((name): name is string => Boolean(name)),
  );
  let routeName = baseRouteName;
  if (normalizedNames.has(routeName)) {
    let suffix = 2;
    while (normalizedNames.has(`${baseRouteName} (${suffix})`)) {
      suffix += 1;
    }
    routeName = `${baseRouteName} (${suffix})`;
  }

  const routePayload = {
    week_of: parsed.data.week_of,
    name: routeName,
    status: "pending",
    driver_id: parsed.data.driver_id ?? null,
    start_time: parsed.data.start_time ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data: route, error: routeError } = await supabase
    .from("delivery_routes")
    .insert(routePayload)
    .select("id, week_of, name")
    .maybeSingle();

  if (routeError || !route) {
    return bad("Failed to create route.", { status: 500 });
  }

  const { data: appointments, error: appointmentsError } = await supabase
    .from("delivery_appointments")
    .select("id, address:addresses(line1,line2,city,state,postal_code)")
    .eq("week_of", parsed.data.week_of)
    .in("id", appointmentIds);

  if (appointmentsError) {
    console.error('Failed to fetch appointments:', appointmentsError);
    return bad("Failed to fetch appointments.", { status: 500, details: { error: appointmentsError.message } });
  }

  const appointmentIdsFromWeek = appointments?.map((appointment) => appointment.id) ?? [];
  if (appointmentIdsFromWeek.length !== appointmentIds.length) {
    return bad("Some appointments are missing for this week.", { status: 422 });
  }

  const addressMap = new Map(
    ((appointments ?? []) as unknown as AppointmentRow[]).map((appointment) => [
      appointment.id,
      appointment.address,
    ]),
  );

  const addressList = orderedStops
    .map((stop) => addressMap.get(stop.appointment_id))
    .filter(Boolean)
    .map((address) =>
      toPrintableAddress({
        line1: address?.line1 ?? null,
        line2: address?.line2 ?? null,
        city: address?.city ?? null,
        state: address?.state ?? null,
        postal_code: address?.postal_code ?? null,
      }),
    )
    .filter((value) => value.length > 0);

  if (addressList.length !== orderedStops.length) {
    return bad("Missing addresses for one or more stops.", { status: 422 });
  }

  let finalStops = orderedStops;

  if (addressList.length >= 1) {
    try {
      const waypoints = addressList.length > 1 ? addressList.slice(0, -1) : undefined;
      const optimizeWaypoints = parsed.data.optimize ?? true;

      const optimizedDirections = await directionsRoute({
        origin: KITCHEN_ORIGIN,
        destination: addressList[addressList.length - 1],
        waypoints,
        optimizeWaypoints,
      });

      const fallbackDirections =
        optimizeWaypoints && waypoints && waypoints.length > 1
          ? await directionsRoute({
              origin: KITCHEN_ORIGIN,
              destination: addressList[addressList.length - 1],
              waypoints,
              optimizeWaypoints: false,
            })
          : null;

      const directions =
        fallbackDirections && fallbackDirections.durationSeconds < optimizedDirections.durationSeconds
          ? fallbackDirections
          : optimizedDirections;

      const now = Date.now();
      let cumulativeSeconds = 0;

      if (directions.waypointOrder && directions.waypointOrder.length > 0) {
        const waypointStops = orderedStops.slice(0, -1);
        const reorderedWaypoints = directions.waypointOrder.map((index) => waypointStops[index]);
        finalStops = [...reorderedWaypoints, orderedStops[orderedStops.length - 1]];
      }

      const stopRows = finalStops.map((stop, index) => ({
        route_id: route.id,
        appointment_id: stop.appointment_id,
        stop_order: index + 1,
        status: "pending",
      }));

      const { error: stopsError } = await supabase.from("delivery_stops").insert(stopRows);

      if (stopsError) {
        return bad("Failed to create route stops.", { status: 500 });
      }

      const etaUpdates = directions.legs.map((leg, index) => {
        cumulativeSeconds += leg.durationSeconds;
        const targetStop = finalStops[index];
        return {
          appointment_id: targetStop.appointment_id,
          eta: new Date(now + cumulativeSeconds * 1000).toISOString(),
        };
      });

      for (const update of etaUpdates) {
        const { error: etaUpdateError } = await supabase
          .from("delivery_stops")
          .update({ eta: update.eta })
          .eq("route_id", route.id)
          .eq("appointment_id", update.appointment_id);

        if (etaUpdateError) {
          console.error('Failed to update ETA for appointment:', update.appointment_id, etaUpdateError);
          return bad("Failed to update delivery stop ETAs.", { status: 500, details: { error: etaUpdateError.message } });
        }
      }

      const { error: routeUpdateError } = await supabase
        .from("delivery_routes")
        .update({
          polyline: directions.polyline,
          distance_meters: directions.distanceMeters,
          duration_seconds: directions.durationSeconds,
          start_time: parsed.data.start_time ?? null,
          end_time: parsed.data.start_time
            ? new Date(
                new Date(parsed.data.start_time).getTime() +
                  directions.durationSeconds * 1000,
              ).toISOString()
            : null,
          driver_id: parsed.data.driver_id ?? null,
          updated_at: new Date().toISOString(),
          status: "built",
        })
        .eq("id", route.id);

      if (routeUpdateError) {
        console.error('Failed to update route with directions:', routeUpdateError);
        return bad("Failed to update route with directions.", { status: 500, details: { error: routeUpdateError.message } });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Route created, but directions failed.";
      return bad(message, { status: 502 });
    }
  } else {
    const stopRows = orderedStops.map((stop, index) => ({
      route_id: route.id,
      appointment_id: stop.appointment_id,
      stop_order: index + 1,
      status: "pending",
    }));

    const { error: stopsError } = await supabase.from("delivery_stops").insert(stopRows);

    if (stopsError) {
      return bad("Failed to create route stops.", { status: 500 });
    }
  }

  const { data: updatedRoute, error: fetchRouteError } = await supabase
    .from("delivery_routes")
    .select("id, week_of, name, status, polyline, distance_meters, duration_seconds, created_at")
    .eq("id", route.id)
    .maybeSingle();

  if (fetchRouteError) {
    console.error('Failed to fetch updated route:', fetchRouteError);
    return bad("Failed to fetch updated route.", { status: 500, details: { error: fetchRouteError.message } });
  }

  return ok({
    route: updatedRoute ?? {
      id: route.id,
      week_of: parsed.data.week_of,
      status: "planned",
      polyline: null,
      distance_meters: null,
      duration_seconds: null,
    },
    ordered_stop_ids: finalStops.map((stop) => stop.appointment_id),
  });
}
