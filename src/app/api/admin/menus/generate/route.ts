import { bad, ok } from "@/lib/api/response";
import { generateWeeklyMenuSchema } from "@/lib/admin/weeklyMenuSystemSchemas";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  getWeekNumberForDate,
  getWeeklyMenuDeadline,
  getWeeklyMenuDeliveryDate,
} from "@/lib/menu/weekly-schedule";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const payload = await request.json().catch(() => null);
  const parsed = generateWeeklyMenuSchema.safeParse(payload);

  if (!parsed.success) {
    return bad("Invalid weekly menu payload.", {
      status: 422,
      headers: noStoreHeaders,
      details: parsed.error.flatten(),
    });
  }

  const supabase = createSupabaseServiceClient();
  const { template_id, week_start_date } = parsed.data;

  const { data: existingMenu } = await supabase
    .from("weekly_menus")
    .select("id, week_start_date, status")
    .eq("week_start_date", week_start_date)
    .maybeSingle();

  if (existingMenu) {
    return ok({ menu: existingMenu }, { headers: noStoreHeaders });
  }

  const { data: template, error: templateError } = await supabase
    .from("menu_templates")
    .select("id, template_dishes(id, dish_id, day_of_week, meal_position)")
    .eq("id", template_id)
    .maybeSingle();

  if (templateError || !template) {
    return bad("Menu template not found.", { status: 404, headers: noStoreHeaders });
  }

  const weekNumber = getWeekNumberForDate(week_start_date);
  const orderDeadline = getWeeklyMenuDeadline(week_start_date);
  const deliveryDate = getWeeklyMenuDeliveryDate(week_start_date);

  const { data: menu, error: menuError } = await supabase
    .from("weekly_menus")
    .insert({
      template_id,
      week_start_date,
      week_number: weekNumber,
      order_deadline: orderDeadline,
      delivery_date: deliveryDate,
      status: "draft",
    })
    .select("id, week_start_date, status")
    .maybeSingle();

  if (menuError || !menu) {
    return bad("Failed to create weekly menu.", { status: 500, headers: noStoreHeaders });
  }

  const templateDishes = template.template_dishes ?? [];

  if (templateDishes.length > 0) {
    const weeklyItems = templateDishes.map((dish) => ({
      weekly_menu_id: menu.id,
      dish_id: dish.dish_id,
      day_of_week: dish.day_of_week,
      meal_position: dish.meal_position,
      is_available: true,
    }));

    const { error: itemsError } = await supabase.from("weekly_menu_items").insert(weeklyItems);

    if (itemsError) {
      await supabase.from("weekly_menus").delete().eq("id", menu.id);
      return bad("Failed to copy template dishes.", {
        status: 500,
        headers: noStoreHeaders,
      });
    }
  }

  return ok({ menu }, { headers: noStoreHeaders });
}
