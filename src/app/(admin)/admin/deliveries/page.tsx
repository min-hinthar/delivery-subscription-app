import Link from "next/link";

import { DeliveryFilters } from "@/components/admin/delivery-filters";
import { Card } from "@/components/ui/card";
import { formatDateYYYYMMDD, getUpcomingWeekStarts } from "@/lib/scheduling";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  searchParams?: { week_of?: string; status?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const weekOptions = getUpcomingWeekStarts(4).map((date) =>
    formatDateYYYYMMDD(date),
  );
  const selectedWeek = weekOptions.includes(searchParams?.week_of ?? "")
    ? (searchParams?.week_of as string)
    : weekOptions[0];
  const statusFilter = searchParams?.status;

  if (!selectedWeek) {
    return null;
  }

  const appointmentsQuery = supabase
    .from("delivery_appointments")
    .select(
      "id, week_of, status, notes, delivery_window:delivery_windows(day_of_week,start_time,end_time), address:addresses(line1,line2,city,state,postal_code), profile:profiles(full_name,phone,email)",
    )
    .eq("week_of", selectedWeek)
    .order("created_at", { ascending: true });

  const { data: appointments } = statusFilter
    ? await appointmentsQuery.eq("status", statusFilter)
    : await appointmentsQuery;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_items(quantity, meal_item:meal_items(name))")
    .eq("week_of", selectedWeek);

  const prepTotals = new Map<string, number>();
  const typedOrders = (orders ?? []) as unknown as OrderRow[];
  for (const order of typedOrders) {
    for (const item of order.order_items ?? []) {
      const name = item.meal_item?.name ?? "Unknown item";
      prepTotals.set(name, (prepTotals.get(name) ?? 0) + item.quantity);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Deliveries</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage weekend schedules, prep totals, and manifest exports.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/api/admin/manifest.csv?week_of=${selectedWeek}`}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:border-slate-400 dark:border-slate-800 dark:text-slate-100"
          >
            Export manifest CSV
          </Link>
          <Link
            href="/admin/routes"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            Build routes
          </Link>
        </div>
      </div>

      <Card className="space-y-4 p-6">
        <DeliveryFilters
          weekOptions={weekOptions}
          selectedWeek={selectedWeek}
          statusFilter={statusFilter}
        />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400">Appointments</p>
        <p className="text-xl font-semibold">{appointments?.length ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400">Orders</p>
            <p className="text-xl font-semibold">{orders?.length ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400">Prep items</p>
            <p className="text-xl font-semibold">{prepTotals.size}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">Prep totals</h2>
        <div className="grid gap-2 text-sm">
          {prepTotals.size === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">
              No prep totals yet. Generate orders to populate this view.
            </p>
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
          {((appointments ?? []) as unknown as AppointmentRow[]).map((appointment) => (
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
          {(appointments ?? []).length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No appointments scheduled for this week.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
