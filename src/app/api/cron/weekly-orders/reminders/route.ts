import { bad, ok } from "@/lib/api/response";
import { sendDeliveryReminder } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const privateHeaders = { "Cache-Control": "no-store" };
const KITCHEN_TIME_ZONE = "America/Los_Angeles";

function getSecret(request: Request) {
  const headerSecret =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    request.headers.get("x-cron-secret");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("cron_secret");
  return headerSecret ?? querySecret;
}

function getDateString(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return bad("Missing CRON_SECRET.", { status: 500 });
  }

  if (getSecret(request) !== secret) {
    return bad("Unauthorized", { status: 401, headers: privateHeaders });
  }

  const admin = createSupabaseAdminClient();
  const tomorrow = getDateString(new Date(Date.now() + 24 * 60 * 60 * 1000), KITCHEN_TIME_ZONE);

  const { data: orders } = await admin
    .from("weekly_orders")
    .select(
      `
      id,
      reminder_sent_at,
      delivery_window,
      customer:profiles(full_name, email),
      package:meal_packages(name),
      weekly_menu:weekly_menus(delivery_date)
    `,
    )
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .eq("weekly_menu.delivery_date", tomorrow);

  let sent = 0;

  for (const order of orders ?? []) {
    const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer;
    const packageInfo = Array.isArray(order.package) ? order.package[0] : order.package;
    const weeklyMenu = Array.isArray(order.weekly_menu) ? order.weekly_menu[0] : order.weekly_menu;
    if (!customer?.email) {
      continue;
    }

    try {
      await sendDeliveryReminder(customer.email, customer.full_name ?? "there", "en", {
        packageName: packageInfo?.name ?? "Weekly package",
        deliveryDate: weeklyMenu?.delivery_date ?? tomorrow,
        deliveryWindow: order.delivery_window,
      });

      await admin
        .from("weekly_orders")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", order.id);

      sent += 1;
    } catch (error) {
      console.warn("weekly_order_reminder_failed", {
        orderId: order.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  return ok({ sent }, { headers: privateHeaders });
}
