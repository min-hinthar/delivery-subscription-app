import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  createWeeklyMenuItemSchema,
  weeklyMenuItemsQuerySchema,
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

async function getNextSortOrder(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  menuId: string,
) {
  const { data } = await supabase
    .from("weekly_menu_items")
    .select("sort_order")
    .eq("weekly_menu_id", menuId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.sort_order ?? 0) + 10;
}

export async function GET(request: Request) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const url = new URL(request.url);
  const parsed = weeklyMenuItemsQuerySchema.safeParse({
    weekly_menu_id: url.searchParams.get("weekly_menu_id"),
  });

  if (!parsed.success) {
    return bad("Invalid weekly_menu_id.", { status: 422, headers: noStoreHeaders });
  }

  const supabase = createSupabaseServiceClient();
  const items = await fetchItems(supabase, parsed.data.weekly_menu_id);

  return ok({ items }, { headers: noStoreHeaders });
}

export async function POST(request: Request) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const body = await request.json().catch(() => null);
  const parsed = createWeeklyMenuItemSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid menu item payload.", { status: 422, headers: noStoreHeaders });
  }

  const supabase = createSupabaseServiceClient();
  const payload = parsed.data;
  const sortOrder = await getNextSortOrder(supabase, payload.weekly_menu_id);

  if ("meal_item_id" in payload) {
    const { data: mealItem } = await supabase
      .from("meal_items")
      .select("name, description, price_cents")
      .eq("id", payload.meal_item_id)
      .maybeSingle();

    if (!mealItem) {
      return bad("Meal item not found.", { status: 404, headers: noStoreHeaders });
    }

    const { error } = await supabase.from("weekly_menu_items").insert({
      weekly_menu_id: payload.weekly_menu_id,
      name: mealItem.name,
      description: mealItem.description,
      price_cents: mealItem.price_cents ?? 0,
      sort_order: sortOrder,
    });

    if (error) {
      return bad("Failed to add menu item.", { status: 500, headers: noStoreHeaders });
    }
  } else {
    const { error } = await supabase.from("weekly_menu_items").insert({
      weekly_menu_id: payload.weekly_menu_id,
      name: payload.name,
      description: payload.description ?? null,
      price_cents: payload.price_cents,
      sort_order: sortOrder,
    });

    if (error) {
      return bad("Failed to add menu item.", { status: 500, headers: noStoreHeaders });
    }
  }

  const items = await fetchItems(supabase, payload.weekly_menu_id);
  return ok({ items }, { headers: noStoreHeaders });
}
