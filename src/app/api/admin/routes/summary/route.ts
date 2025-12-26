import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403 });
  }

  const url = new URL(request.url);
  const weekOf = url.searchParams.get("week_of");

  if (!weekOf) {
    return bad("Missing week_of.", { status: 422 });
  }

  const { data: route } = await supabase
    .from("delivery_routes")
    .select("id, week_of, status, polyline, distance_meters, duration_seconds")
    .eq("week_of", weekOf)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ok({ route });
}
