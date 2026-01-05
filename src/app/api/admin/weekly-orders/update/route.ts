import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const noStoreHeaders = { "Cache-Control": "no-store" };

const updateSchema = z.object({
  weekly_order_id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]),
  driver_id: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const payload = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(payload);

  if (!parsed.success) {
    return bad("Invalid order update payload.", {
      status: 422,
      headers: noStoreHeaders,
      details: parsed.error.flatten(),
    });
  }

  const supabase = createSupabaseServiceClient();
  const { weekly_order_id, status, driver_id } = parsed.data;
  const timestamp = new Date().toISOString();

  const update: Record<string, string | null> = {
    status,
  };

  if (driver_id !== undefined) {
    update.driver_id = driver_id;
    update.assigned_at = driver_id ? timestamp : null;
  }

  if (status === "delivered") {
    update.delivered_at = timestamp;
  }

  if (status === "cancelled") {
    update.cancelled_at = timestamp;
  }

  const { data, error } = await supabase
    .from("weekly_orders")
    .update(update)
    .eq("id", weekly_order_id)
    .select("id, status, driver_id, assigned_at, delivered_at, cancelled_at")
    .maybeSingle();

  if (error || !data) {
    return bad("Failed to update weekly order.", { status: 500, headers: noStoreHeaders });
  }

  return ok({ order: data }, { headers: noStoreHeaders });
}
