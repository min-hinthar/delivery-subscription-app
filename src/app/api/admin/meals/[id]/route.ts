import { z } from "zod";
import { NextRequest } from "next/server";

import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const noStoreHeaders = { "Cache-Control": "no-store" };

const updateMealSchema = z.object({
  is_active: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const payload = await request.json().catch(() => null);
  const parsed = updateMealSchema.safeParse(payload);

  if (!parsed.success) {
    return bad("Invalid meal payload.", {
      status: 422,
      headers: noStoreHeaders,
      details: parsed.error.flatten(),
    });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("meal_items")
    .update({ is_active: parsed.data.is_active })
    .eq("id", id)
    .select("id, name, price_cents, is_active")
    .maybeSingle();

  if (error || !data) {
    return bad("Failed to update meal.", { status: 500, headers: noStoreHeaders });
  }

  return ok({ meal: data }, { headers: noStoreHeaders });
}
