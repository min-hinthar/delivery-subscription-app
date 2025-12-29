import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { toPrintableAddress } from "@/lib/maps/google";

type StopRow = {
  appointment_id: string;
  stop_order: number;
  appointment: {
    id: string;
    profile: { full_name: string | null } | null;
    address: {
      line1: string | null;
      line2: string | null;
      city: string | null;
      state: string | null;
      postal_code: string | null;
    } | null;
  } | null;
};

type AppointmentStopRow = {
  id: string;
  profile: { full_name: string | null } | null;
  appointment: {
    address: {
      line1: string | null;
      line2: string | null;
      city: string | null;
      state: string | null;
      postal_code: string | null;
    } | null;
  } | null;
};

export async function GET(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403 });
  }

  const url = new URL(request.url);
  const routeId = url.searchParams.get("route_id");

  if (!routeId) {
    return bad("Missing route_id.", { status: 422 });
  }

  const { data: stops, error } = await supabase
    .from("delivery_stops")
    .select(
      "appointment_id, stop_order, appointment:delivery_appointments(id, profile:profiles(full_name), address:addresses(line1,line2,city,state,postal_code))",
    )
    .eq("route_id", routeId)
    .order("stop_order", { ascending: true });

  if (error) {
    return bad("Failed to load route stops.", { status: 500 });
  }

  const formattedStops = ((stops ?? []) as unknown as StopRow[])
    .map((stop) => ({
      appointment_id: stop.appointment_id,
      name: stop.appointment?.profile?.full_name ?? "Stop",
      stop_order: stop.stop_order,
      address: stop.appointment?.address
        ? toPrintableAddress({
            line1: stop.appointment.address.line1,
            line2: stop.appointment.address.line2,
            city: stop.appointment.address.city,
            state: stop.appointment.address.state,
            postal_code: stop.appointment.address.postal_code,
          })
        : "",
    }))
    .filter((stop) => stop.address.length > 0);

  return ok({ stops: formattedStops });
}
