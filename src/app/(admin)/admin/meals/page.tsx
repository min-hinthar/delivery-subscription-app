import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MealRow = {
  id: string;
  name: string;
  price_cents: number;
  is_active: boolean;
};

type TemplateRow = {
  id: string;
  name: string;
  is_active: boolean;
};

export default async function AdminMealsPage() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load
          meal planning.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: meals } = await supabase
    .from("meal_items")
    .select("id, name, price_cents, is_active")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: templates } = await supabase
    .from("meal_plan_templates")
    .select("id, name, is_active")
    .order("created_at", { ascending: false })
    .limit(4);

  const mealRows = (meals ?? []) as unknown as MealRow[];
  const templateRows = (templates ?? []) as unknown as TemplateRow[];

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-white via-slate-50 to-amber-50/70 dark:from-slate-950 dark:via-slate-900/70 dark:to-amber-950/30">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
            Menu ops
          </div>
          <h1 className="text-2xl font-semibold">Meals & templates</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage menu items and the weekly default templates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin"
            className="rounded-md border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
            Back to dashboard
          </Link>
          <LogoutButton />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          id="meal-items"
          className="space-y-4 bg-gradient-to-br from-white via-slate-50 to-amber-50/40 dark:from-slate-950 dark:via-slate-900/70 dark:to-amber-950/20"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Meal items</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
              {mealRows.length} items
            </span>
          </div>
          <div className="space-y-3">
            {mealRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  No meal items yet.
                </p>
                <p className="mt-1">
                  Add your first menu items to start planning weekly templates.
                </p>
                <Link
                  href="/admin/subscriptions"
                  className="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:text-slate-100"
                >
                  Check subscriber demand
                </Link>
              </div>
            ) : (
              mealRows.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white/80 p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-950/40"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {meal.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ${(meal.price_cents / 100).toFixed(2)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {meal.is_active ? "Active" : "Paused"}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card
          id="meal-templates"
          className="space-y-4 bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 dark:from-slate-950 dark:via-slate-900/70 dark:to-emerald-950/20"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Meal plan templates</h2>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
              {templateRows.length} templates
            </span>
          </div>
          <div className="space-y-3">
            {templateRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  No templates yet.
                </p>
                <p className="mt-1">
                  Build a weekly meal plan to generate upcoming delivery orders.
                </p>
                <Link
                  href="#meal-items"
                  className="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:text-slate-100"
                >
                  Add meal items
                </Link>
              </div>
            ) : (
              templateRows.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white/80 p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-950/40"
                >
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {template.name}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {template.is_active ? "Active" : "Draft"}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
