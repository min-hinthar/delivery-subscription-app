import { bad, ok } from "@/lib/api/response";
import { formatDateYYYYMMDD, getUpcomingWeekStarts } from "@/lib/scheduling";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ACTIVE_STATUSES = ["active", "trialing"];

type TemplateItemRow = {
  meal_item_id: string;
  quantity: number;
  meal_items: { price_cents: number | null } | null;
};

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return bad("Missing CRON_SECRET.", { status: 500 });
  }

  const headerSecret =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    request.headers.get("x-cron-secret");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("cron_secret");
  const providedSecret = headerSecret ?? querySecret;

  if (providedSecret !== secret) {
    return bad("Unauthorized", { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const [weekStart] = getUpcomingWeekStarts(1);
  const weekOf = formatDateYYYYMMDD(weekStart ?? new Date());

  const { data: template } = await admin
    .from("meal_plan_templates")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!template) {
    return bad("No active meal plan template.", { status: 400 });
  }

  const { data: templateItems } = await admin
    .from("meal_plan_template_items")
    .select("meal_item_id, quantity, meal_items(price_cents)")
    .eq("template_id", template.id);

  const typedTemplateItems = (templateItems ?? []) as unknown as TemplateItemRow[];

  if (typedTemplateItems.length === 0) {
    return bad("Active template has no items.", { status: 400 });
  }

  const { data: subscriptions } = await admin
    .from("subscriptions")
    .select("user_id, status")
    .in("status", ACTIVE_STATUSES);

  const activeUserIds = subscriptions?.map((subscription) => subscription.user_id) ?? [];

  if (activeUserIds.length === 0) {
    return ok({ week_of: weekOf, orders_created: 0, items_created: 0 });
  }

  const { data: appointments } = await admin
    .from("delivery_appointments")
    .select("id, user_id")
    .eq("week_of", weekOf)
    .in("user_id", activeUserIds);

  if (!appointments || appointments.length === 0) {
    return ok({ week_of: weekOf, orders_created: 0, items_created: 0 });
  }

  const ordersPayload = appointments.map((appointment) => ({
    user_id: appointment.user_id,
    week_of: weekOf,
    appointment_id: appointment.id,
    status: "pending",
    updated_at: new Date().toISOString(),
  }));

  const { data: orders, error: ordersError } = await admin
    .from("orders")
    .upsert(ordersPayload, { onConflict: "user_id,week_of" })
    .select("id, user_id");

  if (ordersError) {
    return bad("Failed to create orders.", { status: 500 });
  }

  const orderIds = orders?.map((order) => order.id) ?? [];

  if (orderIds.length === 0) {
    return ok({ week_of: weekOf, orders_created: 0, items_created: 0 });
  }

  await admin.from("order_items").delete().in("order_id", orderIds);

  const templateTotal = typedTemplateItems.reduce(
    (sum, item) => sum + (item.meal_items?.price_cents ?? 0) * item.quantity,
    0,
  );

  const itemsPayload = orderIds.flatMap((orderId) =>
    typedTemplateItems.map((item) => ({
      order_id: orderId,
      meal_item_id: item.meal_item_id,
      quantity: item.quantity,
      unit_price_cents: item.meal_items?.price_cents ?? 0,
    })),
  );

  const { details: { error: itemsError  }} = await admin.from("order_items").insert(itemsPayload);

  if (itemsError) {
    return bad("Failed to create order items.", { status: 500 });
  }

  await admin
    .from("orders")
    .update({ total_cents: templateTotal, updated_at: new Date().toISOString() })
    .in("id", orderIds);

  console.info("cron_generate_week_complete", {
    weekOf,
    ordersCreated: orderIds.length,
    itemsCreated: itemsPayload.length,
  });

  return ok({
    week_of: weekOf,
    orders_created: orderIds.length,
    items_created: itemsPayload.length,
  });
}
