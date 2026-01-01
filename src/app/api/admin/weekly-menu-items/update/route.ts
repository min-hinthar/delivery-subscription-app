import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  deleteWeeklyMenuItemSchema,
  updateWeeklyMenuItemSchema,
} from "@/lib/admin/menuSchemas";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const noStoreHeaders = { "Cache-Control": "no-store" };

async function fetchItems(supabase: ReturnType<typeof createSupabaseServiceClient>, menuId: string) {
  const { data } = await supabase
    .from("weekly_menu_items")
    .select("id, weekly_menu_id, name, description, price_cents, sort_order")
    .eq("weekly_menu_id", menuId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function PATCH(request: Request) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateWeeklyMenuItemSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid menu item update payload.", { status: 422, headers: noStoreHeaders });
  }

  const supabase = createSupabaseServiceClient();
  const { item_id, ...updates } = parsed.data;

  const { data: existing } = await supabase
    .from("weekly_menu_items")
    .select("weekly_menu_id")
    .eq("id", item_id)
    .maybeSingle();

  if (!existing) {
    return bad("Menu item not found.", { status: 404, headers: noStoreHeaders });
  }

  const { error } = await supabase
    .from("weekly_menu_items")
    .update({
      ...updates,
      ...(updates.description === undefined ? {} : { description: updates.description }),
    })
    .eq("id", item_id);

  if (error) {
    return bad("Failed to update menu item.", { status: 500, headers: noStoreHeaders });
  }

  const items = await fetchItems(supabase, existing.weekly_menu_id);
  return ok({ items }, { headers: noStoreHeaders });
}

export async function DELETE(request: Request) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const body = await request.json().catch(() => null);
  const parsed = deleteWeeklyMenuItemSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid menu item delete payload.", { status: 422, headers: noStoreHeaders });
  }

  const supabase = createSupabaseServiceClient();
  const { item_id } = parsed.data;

  const { data: existing } = await supabase
    .from("weekly_menu_items")
    .select("weekly_menu_id")
    .eq("id", item_id)
    .maybeSingle();

  if (!existing) {
    return bad("Menu item not found.", { status: 404, headers: noStoreHeaders });
  }

  const { error } = await supabase.from("weekly_menu_items").delete().eq("id", item_id);

  if (error) {
    return bad("Failed to delete menu item.", { status: 500, headers: noStoreHeaders });
  }

  const items = await fetchItems(supabase, existing.weekly_menu_id);
  return ok({ items }, { headers: noStoreHeaders });
}
