import Link from "next/link";
import { getLocale } from "next-intl/server";

import { ChefHat, PlusCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export default async function MenuTemplatesPage() {
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
          admin templates.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: templates } = await supabase
    .from("menu_templates")
    .select("id, name, theme, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Menu templates
          </p>
          <h1 className="text-3xl font-bold">Templates</h1>
        </div>
        <div className="flex gap-3">
          <Link href={localizedLink("/admin/menus")}>
            <Button variant="secondary">
              <ChefHat className="mr-2 h-4 w-4" />
              Back to menus
            </Button>
          </Link>
          <Link href={localizedLink("/admin/menus/templates/new")}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New template
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {(templates ?? []).length === 0 ? (
          <Card className="p-6 text-sm text-slate-600">No templates created yet.</Card>
        ) : (
          templates?.map((template) => (
            <Card key={template.id} className="flex items-center justify-between p-6">
              <div>
                <p className="text-lg font-semibold">{template.name}</p>
                <p className="text-sm text-slate-500">
                  Theme: {template.theme ?? "General"} • Created {formatDate(template.created_at)}
                </p>
              </div>
              <Badge variant={template.is_active ? "default" : "outline"}>
                {template.is_active ? "Active" : "Inactive"}
              </Badge>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
