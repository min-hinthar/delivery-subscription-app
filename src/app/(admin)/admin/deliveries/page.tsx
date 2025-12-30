import Link from "next/link";
import { Download, Route } from "lucide-react";

import { DeliveryFilters } from "@/components/admin/delivery-filters";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card } from "@/components/ui/card";
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
  phone: string | null;
  email: string | null;
};

type AppointmentRow = {
  id: string;
  week_of: string;
  status: string;
  notes: string | null;
  delivery_window: DeliveryWindow | null;
  address: Address | null;
  profile: Profile | null;
};

type OrderItemRow = {
  quantity: number;
  meal_item: { name: string | null } | null;
};

type OrderRow = {
  id: string;
  order_items: OrderItemRow[] | null;
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

export default async function AdminDeliveriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ week_of?: string; status?: string }>;
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
          operations dashboards.
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
  const statusFilter = resolvedSearchParams?.status;

  if (!selectedWeek) {
    return null;
  }

  let appointments: AppointmentRow[] = [];
  let orders: OrderRow[] = [];

  try {
    const appointmentsQuery = supabase
      .from("delivery_appointments")
      .select(
        "id, week_of, status, notes, delivery_window:delivery_windows(day_of_week,start_time,end_time), address:addresses(line1,line2,city,state,postal_code), profile:profiles(full_name,phone,email)",
      )
      .eq("week_of", selectedWeek)
      .order("created_at", { ascending: true });

    const appointmentsPromise = statusFilter
      ? appointmentsQuery.eq("status", statusFilter)
      : appointmentsQuery;

    const [appointmentsResult, ordersResult] = await withTimeout(
      Promise.all([
        appointmentsPromise,
        supabase
          .from("orders")
          .select("id, order_items(quantity, meal_item:meal_items(name))")
          .eq("week_of", selectedWeek),
      ]),
      10000,
      "Timed out loading deliveries data.",
    );

    appointments = (appointmentsResult.data ?? []) as unknown as AppointmentRow[];
    orders = (ordersResult.data ?? []) as unknown as OrderRow[];
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load deliveries data.";
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Deliveries unavailable</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    );
  }

  const prepTotals = new Map<string, number>();
  for (const order of orders ?? []) {
    for (const item of order.order_items ?? []) {
      const name = item.meal_item?.name ?? "Unknown item";
      prepTotals.set(name, (prepTotals.get(name) ?? 0) + item.quantity);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-white via-slate-50 to-emerald-50/70 dark:from-slate-950 dark:via-slate-900/70 dark:to-emerald-950/30">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
            Operations
          </div>
          <h1 className="text-2xl font-semibold">Deliveries</h1>
          <p className="text-sm text-muted-foreground">
            Manage weekend schedules, prep totals, and manifest exports.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/api/admin/manifest.csv?week_of=${selectedWeek}`}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export manifest CSV
          </Link>
          <Link
            href="/admin/routes"
            className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-primary via-primary/90 to-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:from-primary/90 hover:via-primary hover:to-primary/80 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            <Route className="h-4 w-4" aria-hidden="true" />
            Build routes
          </Link>
          <LogoutButton />
        </div>
      </Card>

      <Card className="space-y-4 bg-gradient-to-br from-white via-slate-50 to-amber-50/60 dark:from-slate-950 dark:via-slate-900/70 dark:to-amber-950/30">
        <DeliveryFilters
          weekOptions={weekOptions}
          selectedWeek={selectedWeek}
          statusFilter={statusFilter}
        />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
            <p className="text-muted-foreground">Appointments</p>
            <p className="text-xl font-semibold">{appointments.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
            <p className="text-muted-foreground">Orders</p>
            <p className="text-xl font-semibold">{orders.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
            <p className="text-muted-foreground">Prep items</p>
            <p className="text-xl font-semibold">{prepTotals.size}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">Prep totals</h2>
        <div className="grid gap-2 text-sm">
          {prepTotals.size === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground dark:border-slate-800">
              <p className="font-medium text-foreground">No prep totals yet.</p>
              <p className="mt-1">
                Build a weekly template and generate orders to populate prep counts.
              </p>
              <Link
                href="/admin/meals"
                className="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:transform-none"
              >
                Review meal templates
              </Link>
            </div>
          ) : (
            Array.from(prepTotals.entries()).map(([name, quantity]) => (
              <div key={name} className="flex items-center justify-between">
                <span>{name}</span>
                <span className="font-medium">{quantity}</span>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">Appointments</h2>
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {appointment.profile?.full_name ?? "Unnamed subscriber"}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {appointment.profile?.phone ?? "No phone"} · {appointment.profile?.email ?? ""}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {appointment.status}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400 md:grid-cols-2">
                <span>
                  {formatWindow(
                    appointment.delivery_window ?? {
                      day_of_week: null,
                      start_time: null,
                      end_time: null,
                    },
                  )}
                </span>
                <span>
                  {[
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
                    .join(", ")}
                </span>
              </div>
              {appointment.notes ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Notes: {appointment.notes}
                </p>
              ) : null}
            </div>
          ))}
          {appointments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <p className="font-medium text-slate-700 dark:text-slate-200">
                No appointments scheduled for this week.
              </p>
              <p className="mt-1">
                Invite subscribers to book a weekend window and check back for new orders.
              </p>
              <Link
                href="/admin/subscriptions"
                className="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:text-slate-100"
              >
                Review subscriptions
              </Link>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
