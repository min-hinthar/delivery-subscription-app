import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403 });
  }

  const url = new URL(request.url);
  const weekOf = url.searchParams.get("week_of");
  const routeId = url.searchParams.get("route_id");

  if (!weekOf && !routeId) {
    return bad("Missing week_of or route_id.", { status: 422 });
  }

  const routeQuery = supabase
    .from("delivery_routes")
    .select("id, week_of, name, status, polyline, distance_meters, duration_seconds, created_at");

  const { data: route } = routeId
    ? await routeQuery.eq("id", routeId).maybeSingle()
    : await routeQuery
        .eq("week_of", weekOf)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

  return ok({ route });
}
