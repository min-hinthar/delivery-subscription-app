import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createMenuTemplateSchema } from "@/lib/admin/weeklyMenuSystemSchemas";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("menu_templates")
    .select("id, name, name_my, description, description_my, theme, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return bad("Failed to load menu templates.", { status: 500, headers: noStoreHeaders });
  }

  return ok({ templates: data ?? [] }, { headers: noStoreHeaders });
}

export async function POST(request: Request) {
  const { isAdmin, user } = await requireAdmin();

  if (!isAdmin || !user) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createMenuTemplateSchema.safeParse(payload);

  if (!parsed.success) {
    return bad("Invalid template payload.", {
      status: 422,
      headers: noStoreHeaders,
      details: parsed.error.flatten(),
    });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("menu_templates")
    .insert({
      ...parsed.data,
      created_by: user.id,
      is_active: true,
    })
    .select("id, name, name_my, description, description_my, theme, is_active, created_at")
    .maybeSingle();

  if (error || !data) {
    return bad("Failed to create menu template.", { status: 500, headers: noStoreHeaders });
  }

  return ok({ template: data }, { headers: noStoreHeaders });
}
