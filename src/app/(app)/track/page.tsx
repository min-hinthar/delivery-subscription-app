import Link from "next/link";
import { redirect } from "next/navigation";

import { TrackingDashboard } from "@/components/track/tracking-dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateYYYYMMDD, getUpcomingWeekStarts } from "@/lib/scheduling";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export default async function TrackPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect("/login?reason=auth");
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
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 dark:text-slate-900 dark:focus-visible:ring-slate-100"
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
    .select("id")
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
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 dark:text-slate-900 dark:focus-visible:ring-slate-100"
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

  const { data: stops } = await supabase
    .from("delivery_stops")
    .select(
      "id, stop_order, status, eta, route_id, appointment:delivery_appointments(address:addresses(line1,line2,city,state,postal_code))",
    )
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

  const formattedStops =
    ((stops ?? []) as unknown as Array<{
      id: string;
      stop_order: number;
      status: string;
      eta: string | null;
      route_id: string;
      appointment: {
        address: {
          line1: string | null;
          line2: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
        } | null;
      } | null;
    }>).map((stop) => ({
      id: stop.id,
      stop_order: stop.stop_order,
      status: stop.status,
      eta: stop.eta,
      route_id: stop.route_id,
      address: [
        stop.appointment?.address?.line1,
        stop.appointment?.address?.line2,
        [
          stop.appointment?.address?.city,
          stop.appointment?.address?.state,
          stop.appointment?.address?.postal_code,
        ]
          .filter(Boolean)
          .join(" "),
      ]
        .filter(Boolean)
        .join(", "),
    })) ?? [];

  const isRoutePending = !route && formattedStops.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Track"
        description="Follow your driver progress and upcoming stop ETAs in real time."
        cta={
          <Link
            href="/schedule"
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 px-5 text-sm font-medium text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 dark:border-slate-800 dark:text-slate-100 dark:focus-visible:ring-slate-100"
          >
            Update schedule
          </Link>
        }
      />
      {isRoutePending ? (
        <div className="rounded-xl border border-slate-200/70 bg-slate-50 px-5 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-300">
          Tracking will appear once your delivery is assigned to a driver route.
        </div>
      ) : null}
      <TrackingDashboard route={route} initialStops={formattedStops} />
    </div>
  );
}
