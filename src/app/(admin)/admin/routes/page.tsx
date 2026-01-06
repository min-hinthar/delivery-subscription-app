import { RouteBuilder } from "@/components/admin/route-builder";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card } from "@/components/ui/card";
import { RouteBuilderErrorBoundary } from "@/components/error-boundary";
import { formatDateYYYYMMDD, getUpcomingWeekStarts } from "@/lib/scheduling";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/utils/async";

type DeliveryWindow = {
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
};

type Address = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
};

type Profile = {
  full_name: string | null;
};

type AppointmentRow = {
  id: string;
  delivery_window: DeliveryWindow | null;
  address: Address | null;
  profile: Profile | null;
};

type RouteRow = {
  id: string;
  week_of: string;
  name: string | null;
  status: string;
  polyline: string | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  created_at: string;
};

function formatWindow(window: {
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
}) {
  if (!window.day_of_week || !window.start_time || !window.end_time) {
    return "";
  }

  return `${window.day_of_week} ${window.start_time}–${window.end_time}`;
}

export default async function AdminRoutesPage({
  searchParams,
}: {
  searchParams?: Promise<{ week_of?: string }>;
}) {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load
          route planning.
        </p>
      </div>
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const weekOptions = getUpcomingWeekStarts(4).map((date) =>
    formatDateYYYYMMDD(date),
  );
  const selectedWeek = weekOptions.includes(resolvedSearchParams?.week_of ?? "")
    ? (resolvedSearchParams?.week_of as string)
    : weekOptions[0];

  if (!selectedWeek) {
    return null;
  }

  let formattedAppointments: Array<{
    id: string;
    customer: string;
    window: string;
    address: string;
    hasAddress: boolean;
  }> = [];
  let availableRoutes: RouteRow[] = [];

  try {
    const [appointmentsResult, routesResult] = await withTimeout(
      Promise.all([
        supabase
          .from("delivery_appointments")
          .select(
            "id, delivery_window:delivery_windows(day_of_week,start_time,end_time), address:addresses(line1,line2,city,state,postal_code), profile:profiles(full_name)",
          )
          .eq("week_of", selectedWeek)
          .order("created_at", { ascending: true }),
        supabase
          .from("delivery_routes")
          .select(
            "id, week_of, name, status, polyline, distance_meters, duration_seconds, created_at",
          )
          .eq("week_of", selectedWeek)
          .order("created_at", { ascending: false }),
      ]),
      10000,
      "Timed out loading route appointments.",
    );

    formattedAppointments = ((appointmentsResult.data ?? []) as unknown as AppointmentRow[]).map(
      (appointment) => ({
        id: appointment.id,
        customer: appointment.profile?.full_name ?? "Unnamed subscriber",
        window: formatWindow(
          appointment.delivery_window ?? {
            day_of_week: null,
            start_time: null,
            end_time: null,
          },
        ),
        address: [
          appointment.address?.line1,
          appointment.address?.line2,
          [
            appointment.address?.city,
            appointment.address?.state,
            appointment.address?.postal_code,
          ]
            .filter(Boolean)
            .join(" "),
        ]
          .filter(Boolean)
        .join(", "),
        hasAddress: Boolean(appointment.address?.line1),
      }),
    );
    availableRoutes = (routesResult.data ?? []) as unknown as RouteRow[];
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load route appointments.";
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Routes unavailable</h1>
        <p className="text-slate-500 dark:text-slate-400">{message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 dark:from-slate-950 dark:via-slate-900/70 dark:to-blue-950/30">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
            Operations
          </div>
          <h1 className="text-2xl font-semibold">Route planning</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Build delivery routes, assign stops, and sync driver directions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LogoutButton />
        </div>
      </Card>
      <RouteBuilderErrorBoundary>
        <RouteBuilder
          key={selectedWeek}
          weekOptions={weekOptions}
          selectedWeek={selectedWeek}
          appointments={formattedAppointments}
          initialRoutes={availableRoutes}
        />
      </RouteBuilderErrorBoundary>
    </div>
  );
}
