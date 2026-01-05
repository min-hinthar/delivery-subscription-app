import { bad, ok } from "@/lib/api/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const publicHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("meal_packages")
    .select(
      "id, name, name_my, description, description_my, dishes_per_day, total_dishes, price_cents, display_order, badge_text, badge_text_my, is_active, created_at, updated_at",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    return bad("Failed to fetch packages.", { status: 500, headers: publicHeaders });
  }

  return ok({ packages: data ?? [] }, { headers: publicHeaders });
}
