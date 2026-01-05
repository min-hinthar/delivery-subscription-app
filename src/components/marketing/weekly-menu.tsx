import Link from "next/link";
import { ArrowRight, Flame, Leaf, Sparkles } from "lucide-react";

import { ButtonV2 } from "@/components/ui/button-v2";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatWeekLabel(weekStartDate?: string | null) {
  if (!weekStartDate) {
    return "Upcoming week";
  }
  const date = new Date(`${weekStartDate}T00:00:00Z`);
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
  const weekStartDate = null;

  const { data, error } =
    supabase && weekStartDate
      ? await supabase
        .from("weekly_menus")
        .select(
          "id, week_start_date, template:menu_templates(name), weekly_menu_items(id, day_of_week, meal_position, dish:meal_items(id, name, description, price_cents))",
        )
        .eq("status", "published")
        .gte("order_deadline", new Date().toISOString())
        .order("week_start_date", { ascending: true })
        .maybeSingle()
      : { data: null, error: null };

  const items =
    error || !data
      ? []
      : [...(data.weekly_menu_items ?? [])]
        .map((item) => ({
          ...item,
          dish: Array.isArray(item.dish) ? item.dish[0] : item.dish,
        }))
        .sort((a, b) => {
          const dayDiff = (a.day_of_week ?? 0) - (b.day_of_week ?? 0);
          if (dayDiff !== 0) return dayDiff;
          return (a.meal_position ?? 0) - (b.meal_position ?? 0);
        });
  const template = data?.template
    ? Array.isArray(data.template)
      ? data.template[0]
      : data.template
    : null;
  const title =
    template?.name ??
    `Chef-curated menu • Week of ${formatWeekLabel(data?.week_start_date ?? weekStartDate)}`;
  const previewItems = items.slice(0, 4);
  const hasPublishedMenu = items.length > 0;
  const totalItems = items.length;

  return (
    <section id="weekly-menu" className="mx-auto max-w-7xl space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            This Week’s Menu
          </p>
          <h2 className="text-3xl font-semibold text-foreground">{title}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Discover four signature dishes from our rotating weekly lineup—crafted in small
            batches and inspired by classic Burmese flavors.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/pricing">
            <ButtonV2 size="lg" variant="secondary">
              View Full Menu
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </ButtonV2>
          </Link>
          <Link href="/signup?next=/onboarding">
            <ButtonV2 size="lg">Start my subscription</ButtonV2>
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1 font-medium text-foreground/80">
            <Sparkles className="h-4 w-4 text-[#D4A574]" aria-hidden="true" />
            {hasPublishedMenu ? "Published menu for this week" : "Menu drops every Friday"}
          </span>
          {hasPublishedMenu ? (
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#D4A574]" aria-hidden="true" />
              {totalItems} dishes available this week
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2">
            <Leaf className="h-4 w-4 text-[#8B4513]" aria-hidden="true" />
            Vegetarian options every week
          </span>
          <span className="inline-flex items-center gap-2">
            <Flame className="h-4 w-4 text-[#DC143C]" aria-hidden="true" />
            Heat level clearly labeled
          </span>
        </div>

        {hasPublishedMenu ? (
          <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0 md:grid-cols-2 lg:grid-cols-4">
            {previewItems.map((item, index) => (
              <Card
                key={item.id}
                className="group flex min-w-[240px] flex-col overflow-hidden border border-border/60 bg-background/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg md:min-w-0"
              >
                <div className="relative h-36 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4A574]/20 via-[#C19663]/20 to-[#8B4513]/20" />
                  <div className="absolute inset-0 bg-[url('/patterns/burmese-pattern.svg')] opacity-20" />
                  <div className="relative flex h-full items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-[#8B4513] shadow-sm">
                      <Sparkles className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </div>
                  {item.dish?.price_cents !== null && item.dish?.price_cents !== undefined && (
                    <div className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#8B4513] shadow-sm">
                      {priceFormatter.format((item.dish.price_cents ?? 0) / 100)}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">
                      {item.dish?.name ?? "Chef's special"}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.dish?.description ||
                        "Chef-crafted Burmese favorite with seasonal sides."}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Chef&apos;s pick #{index + 1}</span>
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-foreground/70">
                      Limited batch
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl border border-dashed border-border bg-background/60 p-6 text-sm text-muted-foreground">
            The chef-curated menu is being finalized. Check back soon or start your
            subscription to get notified when it drops.
          </Card>
        )}
      </div>
    </section>
  );
}
