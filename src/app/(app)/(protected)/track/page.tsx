import Link from "next/link";
import { redirect } from "next/navigation";

import { TrackingDashboard } from "@/components/track/tracking-dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateYYYYMMDD, getUpcomingWeekStarts } from "@/lib/scheduling";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Force dynamic rendering - this page needs cookies() for Supabase auth
export const dynamic = "force-dynamic";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

type RouteStopRow = {
  id: string;
  appointment_id: string;
  route_id?: string | null;
  stop_order: number;
  status: string;
  estimated_arrival: string | null;
  completed_at: string | null;
  photo_url: string | null;
  geocoded_lat: number | null;
  geocoded_lng: number | null;
};

type DriverLocationRow = {
  latitude: number;
  longitude: number;
  heading: number | null;
  updated_at: string | null;
};

type RouteRow = {
  id: string;
  status: string | null;
  polyline: string | null;
  driver_id: string | null;
  driver?: { full_name: string | null } | null;
};

async function resolvePhotoUrl(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  photoPath: string,
) {
  if (photoPath.startsWith("http")) {
    return photoPath;
  }

  const { data } = await admin.storage.from("delivery-proofs").createSignedUrl(photoPath, 60 * 60);
  return data?.signedUrl ?? null;
}

export default async function TrackPage() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable
          tracking.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect(`/login?reason=auth&next=${encodeURIComponent("/track")}`);
  }

  const { data: subscriptionRows } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  const subscriptionStatus = subscriptionRows?.[0]?.status ?? null;
  const hasActiveSubscription = subscriptionStatus
    ? ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus)
    : false;

  if (!hasActiveSubscription) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="Track"
          description="Live tracking becomes available once you have an active subscription."
          cta={
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-primary via-primary/90 to-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-primary/90 hover:via-primary hover:to-primary/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none"
            >
              Activate subscription
            </Link>
          }
        />
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
          Tracking unlocks after your subscription is active and a delivery is scheduled.
        </div>
      </div>
    );
  }

  const [weekStart] = getUpcomingWeekStarts(1);
  const weekOf = formatDateYYYYMMDD(weekStart ?? new Date());

  const { data: appointment } = await supabase
    .from("delivery_appointments")
    .select("id, status")
    .eq("user_id", auth.user.id)
    .eq("week_of", weekOf)
    .maybeSingle();

  if (!appointment) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="Track"
          description="Schedule your delivery window to enable live tracking."
          cta={
            <Link
              href="/schedule"
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-primary via-primary/90 to-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-primary/90 hover:via-primary hover:to-primary/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none"
            >
              Schedule delivery
            </Link>
          }
        />
        <div className="rounded-xl border border-slate-200/70 bg-slate-50 px-5 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-300">
          You don’t have a delivery scheduled for the upcoming weekend yet.
        </div>
      </div>
    );
  }

  const { data: customerStop } = await supabase
    .from("delivery_stops")
    .select(
      "id, route_id, appointment_id, stop_order, status, estimated_arrival, completed_at, photo_url, geocoded_lat, geocoded_lng",
    )
    .eq("appointment_id", appointment.id)
    .order("stop_order", { ascending: true })
    .limit(1)
    .maybeSingle<RouteStopRow>();

  const routeId = customerStop?.route_id ?? null;
  const admin = routeId ? createSupabaseAdminClient() : null;
  let route: { id: string; status: string | null; polyline: string | null } | null = null;
  let driverName: string | null = null;
  let driverLocation: DriverLocationRow | null = null;
  let routeStops: RouteStopRow[] = [];

  if (routeId && admin) {
    const { data: routeRow } = await admin
      .from("delivery_routes")
      .select("id, status, polyline, driver_id, driver:profiles(full_name)")
      .eq("id", routeId)
      .maybeSingle<RouteRow>();

    route = routeRow
      ? {
          id: routeRow.id,
          status: routeRow.status,
          polyline: routeRow.polyline,
        }
      : null;

    driverName = routeRow?.driver?.full_name ?? null;

    const { data: stops } = await admin
      .from("delivery_stops")
      .select(
        "id, appointment_id, stop_order, status, estimated_arrival, completed_at, photo_url, geocoded_lat, geocoded_lng",
      )
      .eq("route_id", routeId)
      .order("stop_order", { ascending: true });

    routeStops = (stops ?? []) as RouteStopRow[];

    const { data: location } = await admin
      .from("driver_locations")
      .select("latitude, longitude, heading, updated_at")
      .eq("route_id", routeId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<DriverLocationRow>();

    driverLocation = location ?? null;
  }

  const stopsForView = routeStops.length > 0 && routeId ? routeStops : customerStop ? [customerStop] : [];

  const customerPhotoUrl =
    admin && customerStop?.photo_url && customerStop.appointment_id === appointment.id
      ? await resolvePhotoUrl(admin, customerStop.photo_url)
      : null;

  const formattedStops = stopsForView.map((stop) => {
    const isCustomerStop = stop.appointment_id === appointment.id;
    return {
      id: stop.id,
      appointmentId: stop.appointment_id,
      stopOrder: stop.stop_order,
      status: stop.status,
      estimatedArrival: stop.estimated_arrival,
      completedAt: stop.completed_at,
      photoUrl: isCustomerStop ? customerPhotoUrl : null,
      lat: stop.geocoded_lat,
      lng: stop.geocoded_lng,
      isCustomerStop,
    };
  });

  const customerLocation =
    customerStop?.geocoded_lat != null && customerStop?.geocoded_lng != null
      ? { lat: customerStop.geocoded_lat, lng: customerStop.geocoded_lng }
      : null;

  const isInTransit =
    appointment.status === "in_transit" ||
    route?.status === "active";

  const isRoutePending = !route && formattedStops.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Track"
        description="Follow your driver progress and upcoming stop ETAs in real time."
        cta={
          <Link
            href="/schedule"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            Update schedule
          </Link>
        }
      />
      {isRoutePending ? (
        <div className="rounded-xl border border-border/70 bg-muted px-5 py-4 text-sm text-muted-foreground shadow-sm">
          Tracking will appear once your delivery is assigned to a driver route.
        </div>
      ) : null}
      <TrackingDashboard
        appointmentId={appointment.id}
        route={route}
        initialStops={formattedStops}
        initialUpdatedAt={new Date().toISOString()}
        customerLocation={customerLocation}
        driver={driverName ? { name: driverName } : null}
        initialDriverLocation={
          driverLocation
            ? {
                lat: driverLocation.latitude,
                lng: driverLocation.longitude,
                heading: driverLocation.heading,
                updatedAt: driverLocation.updated_at,
              }
            : null
        }
        isInTransit={isInTransit}
      />
    </div>
  );
}
