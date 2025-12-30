import Link from "next/link";

import { Card } from "@/components/ui/card";
import { formatDateYYYYMMDD, getUpcomingWeekStarts } from "@/lib/scheduling";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatWeekLabel(weekOf?: string | null) {
  if (!weekOf) {
    return "Upcoming week";
  }
  const date = new Date(`${weekOf}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export async function WeeklyMenu() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const supabase = hasSupabaseConfig ? await createSupabaseServerClient() : null;
  const [weekStart] = getUpcomingWeekStarts(1);
  const weekOf = weekStart ? formatDateYYYYMMDD(weekStart) : null;

  const { data, error } =
    supabase && weekOf
      ? await supabase
        .from("weekly_menus")
        .select(
          "id, title, week_of, weekly_menu_items ( id, name, description, price_cents, sort_order )",
        )
        .eq("is_published", true)
        .eq("week_of", weekOf)
        .order("sort_order", { foreignTable: "weekly_menu_items", ascending: true })
        .maybeSingle()
      : { data: null, error: null };

  const items = error ? [] : (data?.weekly_menu_items ?? []);
  const title = data?.title ?? `Chef-curated menu • Week of ${formatWeekLabel(weekOf)}`;

  return (
    <section id="weekly-menu" className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          This Week’s Menu
        </p>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Freshly prepared Burmese favorites with rotating sides and seasonal desserts.
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          The chef-curated menu is being finalized. Check back soon or start your
          subscription to get notified when it drops.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className="space-y-2 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-foreground">{item.name}</p>
                <span className="text-xs font-semibold text-muted-foreground">
                  {priceFormatter.format((item.price_cents ?? 0) / 100)}
                </span>
              </div>
              {item.description ? (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/signup?next=/onboarding"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-primary via-primary/90 to-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-primary/90 hover:via-primary hover:to-primary/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none"
        >
          Start my subscription
        </Link>
        <Link
          href="/pricing"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none"
        >
          View plans
        </Link>
      </div>
    </section>
  );
}
