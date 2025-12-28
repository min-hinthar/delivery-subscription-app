import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Card } from "@/components/ui/card";
import { formatDateYYYYMMDD, getUpcomingWeekStarts } from "@/lib/scheduling";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/utils/async";

export default async function AdminHomePage() {
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

  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const [weekStart] = getUpcomingWeekStarts(1);
  const weekOf = weekStart ? formatDateYYYYMMDD(weekStart) : null;

  let deliveriesCount = 0;
  let routesCount = 0;
  let mealsCount = 0;
  let subscriptionsCount = 0;

  try {
    const [
      deliveriesResult,
      routesResult,
      mealsResult,
      subscriptionsResult,
    ] = await withTimeout(
      Promise.all([
        weekOf
          ? supabase
              .from("delivery_appointments")
              .select("id", { count: "exact", head: true })
              .eq("week_of", weekOf)
          : Promise.resolve({ count: 0 }),
        supabase.from("delivery_routes").select("id", { count: "exact", head: true }),
        supabase
          .from("meal_items")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }),
      ]),
      10000,
      "Timed out loading admin stats.",
    );

    deliveriesCount = deliveriesResult.count ?? 0;
    routesCount = routesResult.count ?? 0;
    mealsCount = mealsResult.count ?? 0;
    subscriptionsCount = subscriptionsResult.count ?? 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load admin stats.";
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Admin data unavailable</h1>
        <p className="text-slate-500 dark:text-slate-400">{message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-white via-slate-50 to-purple-50/70 dark:from-slate-950 dark:via-slate-900/70 dark:to-purple-950/30">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
            Operations Hub
          </div>
          <h1 className="text-2xl font-semibold">Admin dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Stay ahead of weekend delivery operations with live stats and quick actions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/deliveries"
            className="rounded-md bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            View deliveries
          </Link>
          <LogoutButton />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Deliveries this week",
            value: deliveriesCount ?? 0,
            href: "/admin/deliveries",
            accent: "from-emerald-50/80 to-emerald-100/40",
          },
          {
            label: "Active routes",
            value: routesCount ?? 0,
            href: "/admin/routes",
            accent: "from-blue-50/80 to-blue-100/40",
          },
          {
            label: "Active meals",
            value: mealsCount ?? 0,
            href: "/admin/meals",
            accent: "from-amber-50/80 to-amber-100/40",
          },
          {
            label: "Subscriptions",
            value: subscriptionsCount ?? 0,
            href: "/admin/subscriptions",
            accent: "from-purple-50/80 to-purple-100/40",
          },
        ].map((card) => (
          <Card
            key={card.label}
            className={`bg-gradient-to-br ${card.accent} dark:from-slate-950 dark:via-slate-900/70 dark:to-slate-950/40`}
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {card.label}
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {card.value}
              </p>
              <Link
                href={card.href}
                className="text-sm font-medium text-slate-900 underline-offset-4 transition hover:-translate-y-0.5 hover:underline dark:text-slate-100"
              >
                Open dashboard
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
