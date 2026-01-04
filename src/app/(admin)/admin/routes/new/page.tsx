import { RouteBuilderWorkspace } from "@/components/admin/route-builder-workspace";
import type { DriverOption, RouteStop } from "@/components/admin/route-builder-types";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card } from "@/components/ui/card";
import { toPrintableAddress } from "@/lib/maps/google";
import { formatDateYYYYMMDD, getUpcomingWeekStarts } from "@/lib/scheduling";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/utils/async";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  phone: string | null;
};

type AppointmentRow = {
  id: string;
  delivery_window: DeliveryWindow | null;
  address: Address | null;
  profile: Profile | null;
};

type StopRow = {
  appointment_id: string;
};

type DriverRow = {
  id: string;
  full_name: string | null;
};

function formatWindow(window: DeliveryWindow | null) {
  if (!window?.day_of_week || !window.start_time || !window.end_time) {
    return "";
  }

  return `${window.day_of_week} ${window.start_time}–${window.end_time}`;
}

async function loadRouteBuilderData(
  supabase: SupabaseClient,
  selectedWeek: string,
) {
  try {
    const appointmentsQuery = supabase
      .from("delivery_appointments")
      .select(
        "id, delivery_window:delivery_windows(day_of_week,start_time,end_time), address:addresses(line1,line2,city,state,postal_code), profile:profiles(full_name,phone)",
      )
      .eq("week_of", selectedWeek)
      .order("created_at", { ascending: true });

    const appointmentsResult = (await withTimeout(
      Promise.resolve(appointmentsQuery),
      10000,
      "Timed out loading route builder data.",
    )) as { data: AppointmentRow[] | null };

    const appointmentRows = (appointmentsResult.data ?? []) as AppointmentRow[];
    const appointmentIds = appointmentRows.map((appointment) => appointment.id);

    const stopsQuery =
      appointmentIds.length > 0
        ? supabase
            .from("delivery_stops")
            .select("appointment_id")
            .in("appointment_id", appointmentIds)
        : Promise.resolve({ data: [] as StopRow[] });
    const driversQuery = supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_admin", false)
      .order("full_name", { ascending: true });

    const [stopsResult, driversResult] = (await withTimeout(
      Promise.all([Promise.resolve(stopsQuery), Promise.resolve(driversQuery)]),
      10000,
      "Timed out loading route builder data.",
    )) as [{ data: StopRow[] | null }, { data: DriverRow[] | null }];

    const stopRows = (stopsResult.data ?? []) as StopRow[];
    const assignedIds = new Set(stopRows.map((stop) => stop.appointment_id));

    const mappedStops = appointmentRows
      .filter((appointment) => !assignedIds.has(appointment.id))
      .map((appointment) => {
        const address = appointment.address
          ? toPrintableAddress({
              line1: appointment.address.line1,
              line2: appointment.address.line2,
              city: appointment.address.city,
              state: appointment.address.state,
              postal_code: appointment.address.postal_code,
            })
          : "";

        return {
          id: appointment.id,
          name: appointment.profile?.full_name ?? "Unnamed subscriber",
          address,
          window: formatWindow(appointment.delivery_window),
          day: appointment.delivery_window?.day_of_week ?? null,
          postalCode: appointment.address?.postal_code ?? null,
          hasAddress: Boolean(appointment.address?.line1),
          phone: appointment.profile?.phone ?? null,
        };
      });

    const unassignedStops: RouteStop[] = mappedStops;
    const driverRows = (driversResult.data ?? []) as DriverRow[];
    const driverOptions: DriverOption[] = driverRows.map((driver) => ({
      id: driver.id,
      name: driver.full_name ?? "Driver",
    }));
    const missingAddressCount = mappedStops.filter((stop) => !stop.hasAddress).length;

    return {
      ok: true as const,
      data: { unassignedStops, driverOptions, missingAddressCount },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load route planning.";
    return { ok: false as const, message };
  }
}

export default async function AdminRoutesNewPage({
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

  const dataResult = await loadRouteBuilderData(supabase, selectedWeek);

  if (!dataResult.ok) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Routes unavailable</h1>
        <p className="text-slate-500 dark:text-slate-400">{dataResult.message}</p>
      </div>
    );
  }

  const { unassignedStops, driverOptions, missingAddressCount } = dataResult.data;

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 p-4 dark:from-slate-950 dark:via-slate-900/70 dark:to-blue-950/30">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
            Operations
          </div>
          <h1 className="text-2xl font-semibold">Route planning</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Build routes visually, optimize with Google Maps, and export driver sheets.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LogoutButton />
        </div>
      </Card>

      <RouteBuilderWorkspace
        weekOptions={weekOptions}
        selectedWeek={selectedWeek}
        unassignedStops={unassignedStops}
        driverOptions={driverOptions}
        missingAddressCount={missingAddressCount}
      />
    </div>
  );
}
