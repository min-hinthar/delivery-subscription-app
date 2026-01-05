import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { templateDishesSchema } from "@/lib/admin/weeklyMenuSystemSchemas";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const payload = await request.json().catch(() => null);
  const parsed = templateDishesSchema.safeParse(payload);

  if (!parsed.success) {
    return bad("Invalid template dishes payload.", {
      status: 422,
      headers: noStoreHeaders,
      details: parsed.error.flatten(),
    });
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("template_dishes").upsert(parsed.data.dishes, {
    onConflict: "template_id,day_of_week,meal_position",
  });

  if (error) {
    return bad("Failed to save template dishes.", { status: 500, headers: noStoreHeaders });
  }

  return ok({ success: true }, { headers: noStoreHeaders });
}
