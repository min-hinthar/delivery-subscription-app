import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { updateWeeklyMenuSchema } from "@/lib/admin/menuSchemas";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function PATCH(request: Request) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateWeeklyMenuSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid menu update payload.", { status: 422, headers: noStoreHeaders });
  }

  const supabase = createSupabaseServiceClient();
  const { menu_id, title, is_published } = parsed.data;

  const { data: existing } = await supabase
    .from("weekly_menus")
    .select("id, published_at")
    .eq("id", menu_id)
    .maybeSingle();

  if (!existing) {
    return bad("Menu not found.", { status: 404, headers: noStoreHeaders });
  }

  const updates: Record<string, unknown> = {};
  if (title !== undefined) {
    updates.title = title;
  }
  if (is_published !== undefined) {
    updates.is_published = is_published;
    if (is_published && !existing.published_at) {
      updates.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("weekly_menus")
    .update(updates)
    .eq("id", menu_id)
    .select(
      "id, week_of, title, is_published, published_at, weekly_menu_items(id, name, description, price_cents, sort_order)",
    )
    .order("sort_order", { foreignTable: "weekly_menu_items", ascending: true })
    .maybeSingle();

  if (error || !data) {
    return bad("Failed to update menu.", { status: 500, headers: noStoreHeaders });
  }

  return ok({ menu: data }, { headers: noStoreHeaders });
}
