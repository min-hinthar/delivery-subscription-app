import Link from "next/link";
import { getLocale } from "next-intl/server";
import { ChefHat, PlusCircle, RefreshCcw } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WeeklyMenuList } from "@/components/admin/weekly-menu-list";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type Locale } from "@/i18n";
import { getLocalizedPathname } from "@/lib/i18n-helpers";

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminMenusPage() {
  const locale = (await getLocale()) as Locale;
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const localizedLink = (href: string) => getLocalizedPathname(href, locale);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable
          admin menus.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: templates } = await supabase
    .from("menu_templates")
    .select("id, name, theme, is_active, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: weeklyMenus } = await supabase
    .from("weekly_menus")
    .select(
      "id, week_start_date, status, order_deadline, delivery_date, template:menu_templates(name)",
    )
    .order("week_start_date", { ascending: false })
    .limit(6);

  const normalizedMenus =
    weeklyMenus?.map((menu) => ({
      ...menu,
      template: Array.isArray(menu.template) ? menu.template[0] : menu.template,
    })) ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Weekly menu system
          </p>
          <h1 className="text-3xl font-bold">Menus</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Build templates, generate weekly menus, and publish by Wednesday night.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={localizedLink("/admin/menus/templates")}>
            <Button variant="secondary">
              <ChefHat className="mr-2 h-4 w-4" />
              View templates
            </Button>
          </Link>
          <Link href={localizedLink("/admin/menus/templates/new")}>
            <Button variant="secondary">
              <PlusCircle className="mr-2 h-4 w-4" />
              New template
            </Button>
          </Link>
          <Link href={localizedLink("/admin/menus/generate")}>
            <Button>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Generate weekly menu
            </Button>
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent templates</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {templates?.length ?? 0} active
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {(templates ?? []).length === 0 ? (
              <p className="text-sm text-slate-600">No templates yet.</p>
            ) : (
              templates?.map((template) => (
                <div key={template.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {template.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Theme: {template.theme ?? "General"} • {formatDate(template.created_at)}
                    </p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200">
                    {template.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <WeeklyMenuList menus={normalizedMenus} />
      </div>
    </div>
  );
}
