import { bad, ok } from "@/lib/api/response";
import { updateWeeklyMenuStatusSchema } from "@/lib/admin/weeklyMenuSystemSchemas";
import { requireAdmin } from "@/lib/auth/requireAdmin";
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

  return ok({ menu: data }, { headers: noStoreHeaders });
}
