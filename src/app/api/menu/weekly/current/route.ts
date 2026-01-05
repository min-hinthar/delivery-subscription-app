import { bad, ok } from "@/lib/api/response";
import { groupMenuItemsByDay } from "@/lib/menu/weekly";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WeeklyMenuItem } from "@/types";

const publicHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("weekly_menus")
    .select(
      `
      id,
      template_id,
      week_start_date,
      week_number,
      order_deadline,
      delivery_date,
      status,
      published_at,
      created_at,
      updated_at,
      template:menu_templates(id, name, description, theme),
      items:weekly_menu_items(
        id,
        weekly_menu_id,
        dish_id,
        day_of_week,
        meal_position,
        is_available,
        max_portions,
        current_orders,
        created_at,
        dish:meal_items(id, name, description, price_cents)
      )
    `,
    )
    .eq("status", "published")
    .gte("order_deadline", new Date().toISOString())
    .order("week_start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return bad("Failed to fetch weekly menu.", { status: 500, headers: publicHeaders });
  }

  if (!data) {
    return bad("No menu available for this week.", {
      status: 404,
      headers: publicHeaders,
    });
  }

  const items = (data.items ?? [])
    .map((item) => ({
      ...item,
      dish: Array.isArray(item.dish) ? item.dish[0] : item.dish,
    }))
    .filter((item) => item.dish) as WeeklyMenuItem[];
  const weekStartDate = data.week_start_date ?? "";
  const dayMenus = weekStartDate ? groupMenuItemsByDay(items, weekStartDate) : [];

  return ok(
    {
      menu: {
        ...data,
        day_menus: dayMenus,
      },
    },
    { headers: publicHeaders },
  );
}
