import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { MealManagement } from "@/components/admin/meal-management";
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
            href={"/admin"}
            className="rounded-md border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
            Back to dashboard
          </Link>
          <LogoutButton />
        </div>
      </Card>

      <MealManagement meals={mealRows} templates={templateRows} />
    </div>
  );
}
