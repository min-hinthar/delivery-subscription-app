import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403, headers: noStoreHeaders });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("meal_items")
    .select("id, name, description, price_cents, is_active")
    .order("name", { ascending: true });

  if (error) {
    return bad("Failed to load meal catalog.", { status: 500, headers: noStoreHeaders });
  }

  return ok({ meals: data ?? [] }, { headers: noStoreHeaders });
}
