import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { directionsRoute, toPrintableAddress } from "@/lib/maps/google";

const buildRouteSchema = z.object({
  week_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().max(120).optional().nullable(),
  stop_order: z
    .array(
      z.object({
        appointment_id: z.string().uuid(),
        order: z.number().int().min(1),
      }),
    )
    .min(2),
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

  const body = await request.json();
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

  const { data: existingRoute } = await supabase
    .from("delivery_routes")
    .select("id")
    .eq("week_of", parsed.data.week_of)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const routePayload = {
    week_of: parsed.data.week_of,
    name: parsed.data.name ?? "Weekend Route",
    status: "planned",
    updated_at: new Date().toISOString(),
  };

  const { data: route, error: routeError } = existingRoute?.id
    ? await supabase
        .from("delivery_routes")
        .update(routePayload)
        .eq("id", existingRoute.id)
        .select("id, week_of, name")
        .maybeSingle()
    : await supabase
        .from("delivery_routes")
        .insert(routePayload)
        .select("id, week_of, name")
        .maybeSingle();

  if (routeError || !route) {
    return bad("Failed to create route.", { status: 500 });
  }

  if (existingRoute?.id) {
    await supabase.from("delivery_stops").delete().eq("route_id", route.id);
  }

  const stopRows = orderedStops.map((stop) => ({
    route_id: route.id,
    appointment_id: stop.appointment_id,
    stop_order: stop.order,
    status: "pending",
  }));

  const { error: stopsError } = await supabase.from("delivery_stops").insert(stopRows);

  if (stopsError) {
    return bad("Failed to create route stops.", { status: 500 });
  }

  const { data: appointments } = await supabase
    .from("delivery_appointments")
    .select("id, address:addresses(line1,line2,city,state,postal_code)")
    .eq("week_of", parsed.data.week_of)
    .in("id", appointmentIds);
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

  if (addressList.length >= 2) {
    try {
      const directions = await directionsRoute({
        origin: addressList[0],
        destination: addressList[addressList.length - 1],
        waypoints: addressList.slice(1, -1),
      });

      const now = Date.now();
      let cumulativeSeconds = 0;

      const etaUpdates = directions.legs.map((leg, index) => {
        cumulativeSeconds += leg.durationSeconds;
        const targetStop = orderedStops[index + 1];
        return {
          appointment_id: targetStop.appointment_id,
          eta: new Date(now + cumulativeSeconds * 1000).toISOString(),
        };
      });

      await supabase
        .from("delivery_stops")
        .update({ eta: new Date(now).toISOString() })
        .eq("route_id", route.id)
        .eq("appointment_id", orderedStops[0]?.appointment_id ?? "");

      for (const update of etaUpdates) {
        await supabase
          .from("delivery_stops")
          .update({ eta: update.eta })
          .eq("route_id", route.id)
          .eq("appointment_id", update.appointment_id);
      }

      await supabase
        .from("delivery_routes")
        .update({
          polyline: directions.polyline,
          distance_meters: directions.distanceMeters,
          duration_seconds: directions.durationSeconds,
          updated_at: new Date().toISOString(),
        })
        .eq("id", route.id);
    } catch {
      return bad("Route created, but directions failed.", { status: 502 });
    }
  }

  const { data: updatedRoute } = await supabase
    .from("delivery_routes")
    .select("id, week_of, status, polyline, distance_meters, duration_seconds")
    .eq("id", route.id)
    .maybeSingle();

  return ok({
    route: updatedRoute ?? {
      id: route.id,
      week_of: parsed.data.week_of,
      status: "planned",
      polyline: null,
      distance_meters: null,
      duration_seconds: null,
    },
  });
}
