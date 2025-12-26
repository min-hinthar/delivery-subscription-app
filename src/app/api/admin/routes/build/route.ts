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
  const appointmentIds = orderedStops.map((stop) => stop.appointment_id);

  const { data: route, error: routeError } = await supabase
    .from("delivery_routes")
    .insert({
      week_of: parsed.data.week_of,
      name: parsed.data.name ?? "Weekend Route",
      status: "planned",
    })
    .select("id, week_of, name")
    .maybeSingle();

  if (routeError || !route) {
    return bad("Failed to create route.", { status: 500 });
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
    .in("id", appointmentIds);

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

  if (addressList.length >= 2) {
    try {
      const directions = await directionsRoute({
        origin: addressList[0],
        destination: addressList[addressList.length - 1],
        waypoints: addressList.slice(1, -1),
      });

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

  return ok({ route_id: route.id });
}
