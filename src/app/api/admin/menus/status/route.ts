import { bad, ok } from "@/lib/api/response";
import { updateWeeklyMenuStatusSchema } from "@/lib/admin/weeklyMenuSystemSchemas";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { sendMenuPublishedNotice } from "@/lib/email";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const payload = await request.json().catch(() => null);
  const parsed = updateWeeklyMenuStatusSchema.safeParse(payload);

  if (!parsed.success) {
    return bad("Invalid status payload.", {
      status: 422,
      headers: noStoreHeaders,
      details: parsed.error.flatten(),
    });
  }

  const { weekly_menu_id, status } = parsed.data;
  const supabase = createSupabaseServiceClient();

  const update = {
    status,
    ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
  };

  const { data, error } = await supabase
    .from("weekly_menus")
    .update(update)
    .eq("id", weekly_menu_id)
    .select("id, status, published_at")
    .maybeSingle();

  if (error || !data) {
    return bad("Failed to update menu status.", { status: 500, headers: noStoreHeaders });
  }

  if (status === "published") {
    const { data: menuDetails } = await supabase
      .from("weekly_menus")
      .select("id, week_start_date, delivery_date, notification_sent_at")
      .eq("id", weekly_menu_id)
      .maybeSingle();

    if (menuDetails && !menuDetails.notification_sent_at) {
      const { data: subscribers } = await supabase
        .from("subscriptions")
        .select("user_id, status, profile:profiles(full_name, email)")
        .in("status", ["active", "trialing"]);

      await Promise.allSettled(
        (subscribers ?? []).map(async (subscriber) => {
          const profile = Array.isArray(subscriber.profile)
            ? subscriber.profile[0]
            : subscriber.profile;

          if (!profile?.email) {
            return;
          }

          await sendMenuPublishedNotice(
            profile.email,
            profile.full_name ?? "there",
            "en",
            {
              weekStart: menuDetails.week_start_date ?? "This week",
              deliveryDate: menuDetails.delivery_date ?? "Upcoming delivery",
            },
          );
        }),
      );

      await supabase
        .from("weekly_menus")
        .update({ notification_sent_at: new Date().toISOString() })
        .eq("id", weekly_menu_id);
    }
  }

  return ok({ menu: data }, { headers: noStoreHeaders });
}
