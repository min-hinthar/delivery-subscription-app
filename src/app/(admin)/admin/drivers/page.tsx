import { DriverList } from "@/components/admin/driver-list";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DriverRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  license_plate: string | null;
  status: string;
  invited_at: string | null;
  confirmed_at: string | null;
};

type RouteRow = {
  id: string;
  driver_id: string | null;
};

export default async function AdminDriversPage() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to manage
          drivers.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient({ allowSetCookies: true });

  const { data: drivers } = await supabase
    .from("driver_profiles")
    .select(
      "id, email, full_name, phone, vehicle_make, vehicle_model, vehicle_color, license_plate, status, invited_at, confirmed_at",
    )
    .order("created_at", { ascending: false });

  const driverIds = (drivers ?? []).map((driver) => driver.id);
  const { data: routes } = driverIds.length
    ? await supabase
        .from("delivery_routes")
        .select("id, driver_id")
        .in("driver_id", driverIds)
    : { data: [] as RouteRow[] };

  const routeCounts = new Map<string, number>();
  (routes ?? []).forEach((route) => {
    if (!route.driver_id) {
      return;
    }
    routeCounts.set(route.driver_id, (routeCounts.get(route.driver_id) ?? 0) + 1);
  });

  const enrichedDrivers = ((drivers ?? []) as DriverRow[]).map((driver) => ({
    ...driver,
    routeCount: routeCounts.get(driver.id) ?? 0,
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Card className="flex flex-col gap-3 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
        <h1 className="text-3xl font-semibold text-foreground">Drivers</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Invite, activate, and manage delivery drivers across active routes.
        </p>
      </Card>
      <DriverList initialDrivers={enrichedDrivers} />
    </div>
  );
}
