import Link from "next/link";

import { TrackingDashboard } from "@/components/track/tracking-dashboard";
import { formatDateYYYYMMDD, getUpcomingWeekStarts } from "@/lib/scheduling";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TrackPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 text-center">
        <h1 className="text-2xl font-semibold">Sign in to track deliveries</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Tracking is available once you have an upcoming delivery appointment.
        </p>
        <div className="flex justify-center">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const [weekStart] = getUpcomingWeekStarts(1);
  const weekOf = formatDateYYYYMMDD(weekStart ?? new Date());

  const { data: appointment } = await supabase
    .from("delivery_appointments")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("week_of", weekOf)
    .maybeSingle();

  if (!appointment) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 text-center">
        <h1 className="text-2xl font-semibold">No delivery scheduled</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Schedule your delivery window to enable live tracking.
        </p>
        <div className="flex justify-center">
          <Link
            href="/schedule"
            className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
          >
            Schedule delivery
          </Link>
        </div>
      </div>
    );
  }

  const { data: stops } = await supabase
    .from("delivery_stops")
    .select("id, stop_order, status, eta, route_id")
    .eq("appointment_id", appointment.id)
    .order("stop_order", { ascending: true });

  const routeId = stops?.[0]?.route_id;
  let route = null;

  if (routeId) {
    const admin = createSupabaseAdminClient();
    const { data: routeRow } = await admin
      .from("delivery_routes")
      .select("id, status, polyline, distance_meters, duration_seconds")
      .eq("id", routeId)
      .maybeSingle();
    route = routeRow ?? null;
  }

  return <TrackingDashboard route={route} initialStops={stops ?? []} />;
}
