import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const routeStatusSchema = z.object({
  route_id: z.string().uuid(),
  status: z.enum(["active", "completed", "cancelled"]),
});

const privateHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return bad("Not authenticated.", { status: 401, headers: privateHeaders });
  }

  const body = await request.json().catch(() => null);
  const parsed = routeStatusSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid route status payload.", {
      status: 422,
      details: parsed.error.flatten(),
      headers: privateHeaders,
    });
  }

  const { route_id: routeId, status } = parsed.data;

  const { data: route } = await supabase
    .from("delivery_routes")
    .select("id, driver_id, start_time, end_time")
    .eq("id", routeId)
    .maybeSingle();

  if (!route || route.driver_id !== user.id) {
    return bad("Route not found or not assigned to you.", { status: 403, headers: privateHeaders });
  }

  const payload: Record<string, string | null> = {
    status,
  };

  if (status === "active") {
    payload.start_time = route.start_time ?? new Date().toISOString();
  }

  if (status === "completed") {
    payload.end_time = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabase
    .from("delivery_routes")
    .update(payload)
    .eq("id", routeId)
    .select("id, status, start_time, end_time")
    .maybeSingle();

  if (updateError || !updated) {
    return bad("Unable to update route status.", { status: 500, headers: privateHeaders });
  }

  return ok(
    {
      id: updated.id,
      status: updated.status,
      start_time: updated.start_time,
      end_time: updated.end_time,
    },
    { headers: privateHeaders },
  );
}
