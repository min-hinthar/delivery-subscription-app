import { bad, ok } from "@/lib/api/response";
import { createMenuTemplateWithDishesSchema } from "@/lib/admin/weeklyMenuSystemSchemas";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const { isAdmin, user } = await requireAdmin();

  if (!isAdmin || !user) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createMenuTemplateWithDishesSchema.safeParse(payload);

  if (!parsed.success) {
    return bad("Invalid template payload.", {
      status: 422,
      headers: noStoreHeaders,
      details: parsed.error.flatten(),
    });
  }

  const supabase = createSupabaseServiceClient();
  const { dishes, ...templateData } = parsed.data;

  const { data: template, error: templateError } = await supabase
    .from("menu_templates")
    .insert({
      ...templateData,
      created_by: user.id,
      is_active: true,
    })
    .select("id, name, name_my, description, description_my, theme, is_active, created_at")
    .maybeSingle();

  if (templateError || !template) {
    return bad("Failed to create menu template.", { status: 500, headers: noStoreHeaders });
  }

  const dishPayload = dishes.map((dish) => ({
    ...dish,
    template_id: template.id,
  }));

  const { details: { error: dishesError  }} = await supabase.from("template_dishes").insert(dishPayload);

  if (dishesError) {
    await supabase.from("menu_templates").delete().eq("id", template.id);
    return bad("Failed to save template dishes.", { status: 500, headers: noStoreHeaders });
  }

  return ok({ template }, { headers: noStoreHeaders });
}
