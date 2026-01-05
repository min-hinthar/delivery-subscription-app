import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const privateHeaders = { "Cache-Control": "no-store" };

const cancelSchema = z.object({
  order_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return bad("Authentication required.", { status: 401, headers: privateHeaders });
  }

  const payload = await request.json().catch(() => null);
  const parsed = cancelSchema.safeParse(payload);

  if (!parsed.success) {
    return bad("Invalid cancel payload.", {
      status: 422,
      headers: privateHeaders,
      details: parsed.error.flatten(),
    });
  }

  const { order_id } = parsed.data;
  const { data: existing } = await supabase
    .from("weekly_orders")
    .select("id, status, driver_id")
    .eq("id", order_id)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!existing) {
    return bad("Order not found.", { status: 404, headers: privateHeaders });
  }

  if (existing.status !== "pending" || existing.driver_id) {
    return bad("This order can no longer be cancelled.", {
      status: 409,
      headers: privateHeaders,
    });
  }

  const { data: order, error } = await supabase
    .from("weekly_orders")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", order_id)
    .select("id, status, cancelled_at")
    .maybeSingle();

  if (error || !order) {
    return bad("Failed to cancel order.", { status: 500, headers: privateHeaders });
  }

  return ok({ order }, { headers: privateHeaders });
}
