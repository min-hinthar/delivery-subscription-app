import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { reorderWeeklyMenuItemsSchema } from "@/lib/admin/menuSchemas";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const body = await request.json().catch(() => null);
  const parsed = reorderWeeklyMenuItemsSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid reorder payload.", { status: 422, headers: noStoreHeaders });
  }

  const supabase = createSupabaseServiceClient();
  const { weekly_menu_id, item_id, direction } = parsed.data;

  const { data: items } = await supabase
    .from("weekly_menu_items")
    .select("id, weekly_menu_id, name, description, price_cents, sort_order")
    .eq("weekly_menu_id", weekly_menu_id)
    .order("sort_order", { ascending: true });

  if (!items) {
    return bad("Menu items not found.", { status: 404, headers: noStoreHeaders });
  }

  const index = items.findIndex((item) => item.id === item_id);
  if (index === -1) {
    return bad("Menu item not found.", { status: 404, headers: noStoreHeaders });
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return ok({ items }, { headers: noStoreHeaders });
  }

  const current = items[index];
  const target = items[targetIndex];

  const updates = [
    supabase
      .from("weekly_menu_items")
      .update({ sort_order: target.sort_order })
      .eq("id", current.id),
    supabase
      .from("weekly_menu_items")
      .update({ sort_order: current.sort_order })
      .eq("id", target.id),
  ];

  const results = await Promise.all(updates);
  const hasError = results.some((result) => result.error);

  if (hasError) {
    return bad("Failed to reorder menu items.", { status: 500, headers: noStoreHeaders });
  }

  const { data: refreshed } = await supabase
    .from("weekly_menu_items")
    .select("id, weekly_menu_id, name, description, price_cents, sort_order")
    .eq("weekly_menu_id", weekly_menu_id)
    .order("sort_order", { ascending: true });

  return ok({ items: refreshed ?? [] }, { headers: noStoreHeaders });
}
