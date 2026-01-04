import { notFound } from "next/navigation";

import { RouteView, type DriverStop } from "@/components/driver/route-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AddressRow = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  instructions: string | null;
};

type ProfileRow = {
  full_name: string | null;
  phone: string | null;
};

type StopRow = {
  id: string;
  stop_order: number;
  status: string;
  estimated_arrival: string | null;
  completed_at: string | null;
  driver_notes: string | null;
  photo_url: string | null;
  appointment: {
    address: AddressRow | null;
    profile: ProfileRow | null;
  } | null;
};

function formatAddress(address: AddressRow | null) {
  if (!address) {
    return "Address unavailable";
  }
  return [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
}

export default async function DriverRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable
          driver routing.
        </p>
      </div>
    );
  }

  const resolvedParams = await params;
  const routeId = resolvedParams.id;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    notFound();
  }

  const { data: route } = await supabase
    .from("delivery_routes")
    .select("id, name, status, start_time, end_time, driver_id")
    .eq("id", routeId)
    .eq("driver_id", auth.user.id)
    .maybeSingle();

  if (!route) {
    notFound();
  }

  const { data: stops } = await supabase
    .from("delivery_stops")
    .select(
      "id, stop_order, status, estimated_arrival, completed_at, driver_notes, photo_url, appointment:delivery_appointments(address:addresses(line1,line2,city,state,postal_code,instructions), profile:profiles(full_name,phone))",
    )
    .eq("route_id", routeId)
    .order("stop_order", { ascending: true });

  const formattedStops: DriverStop[] = ((stops ?? []) as unknown as StopRow[]).map((stop) => ({
    id: stop.id,
    stopOrder: stop.stop_order,
    status: stop.status,
    estimatedArrival: stop.estimated_arrival,
    completedAt: stop.completed_at,
    address: formatAddress(stop.appointment?.address ?? null),
    instructions: stop.appointment?.address?.instructions ?? null,
    customerName: stop.appointment?.profile?.full_name ?? "Customer",
    customerPhone: stop.appointment?.profile?.phone ?? null,
    driverNotes: stop.driver_notes,
    photoUrl: stop.photo_url,
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <RouteView
        route={{
          id: route.id,
          name: route.name,
          status: route.status ?? "pending",
          startTime: route.start_time,
          endTime: route.end_time,
        }}
        stops={formattedStops}
      />
    </div>
  );
}
