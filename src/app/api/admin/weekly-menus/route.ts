import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createWeeklyMenuSchema, weeklyMenuQuerySchema } from "@/lib/admin/menuSchemas";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const url = new URL(request.url);
  const parsed = weeklyMenuQuerySchema.safeParse({
    week_of: url.searchParams.get("week_of"),
  });

  if (!parsed.success) {
    return bad("Invalid week_of value.", { status: 422, headers: noStoreHeaders });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("weekly_menus")
    .select(
      "id, week_of, title, is_published, published_at, weekly_menu_items(id, name, description, price_cents, sort_order)",
    )
    .eq("week_of", parsed.data.week_of)
    .order("sort_order", { foreignTable: "weekly_menu_items", ascending: true })
    .maybeSingle();

  if (error) {
    return bad("Failed to load weekly menu.", { status: 500, headers: noStoreHeaders });
  }

  return ok({ menu: data }, { headers: noStoreHeaders });
}

export async function POST(request: Request) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const body = await request.json().catch(() => null);
  const parsed = createWeeklyMenuSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid menu payload.", { status: 422, headers: noStoreHeaders });
  }

  const supabase = createSupabaseServiceClient();
  const { week_of, title } = parsed.data;

  const { data: existing } = await supabase
    .from("weekly_menus")
    .select(
      "id, week_of, title, is_published, published_at, weekly_menu_items(id, name, description, price_cents, sort_order)",
    )
    .eq("week_of", week_of)
    .order("sort_order", { foreignTable: "weekly_menu_items", ascending: true })
    .maybeSingle();

  if (existing) {
    return ok({ menu: existing }, { headers: noStoreHeaders });
  }

  const defaultTitle = title ?? `Weekly Menu · Week of ${week_of}`;
  const { data, error } = await supabase
    .from("weekly_menus")
    .insert({
      week_of,
      title: defaultTitle,
      is_published: false,
    })
    .select(
      "id, week_of, title, is_published, published_at, weekly_menu_items(id, name, description, price_cents, sort_order)",
    )
    .maybeSingle();

  if (error || !data) {
    return bad("Failed to create weekly menu.", { status: 500, headers: noStoreHeaders });
  }

  return ok({ menu: data }, { headers: noStoreHeaders });
}
