import Link from "next/link";
import { redirect } from "next/navigation";

import { RouteSummaryCard } from "@/components/driver/route-summary-card";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card } from "@/components/ui/card";
import { getDriverRouteSummaries } from "@/lib/driver/route-summary";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DriverDashboardPage() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load the
          driver dashboard.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/driver/login");
  }

  const { data: profile } = await supabase
    .from("driver_profiles")
    .select("full_name, status")
    .eq("id", data.user.id)
    .maybeSingle();

  const routes = await getDriverRouteSummaries({
    supabase,
    driverId: data.user.id,
  });

  const completedRoutes = routes.filter((route) => route.status === "completed");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Driver dashboard
            </p>
            <h1 className="text-3xl font-semibold text-foreground">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/driver/onboarding"
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-white"
            >
              Profile
            </Link>
            <LogoutButton />
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Keep tabs on today&apos;s routes and head to the next stop with one tap.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-foreground">Assigned routes</h2>
          {completedRoutes.length ? (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Completed routes: {completedRoutes.length}
            </span>
          ) : null}
        </div>

        {routes.length ? (
          <div className="grid gap-4">
            {routes.map((route) => (
              <RouteSummaryCard key={route.id} route={route} />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center gap-2 border-dashed p-8 text-center">
            <h3 className="text-lg font-semibold">No routes assigned yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Once operations assigns a route, it will appear here with the next stop.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
