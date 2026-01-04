import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const stopUpdateSchema = z.object({
  stop_id: z.string().uuid(),
  status: z.enum(["pending", "in_progress", "completed", "issue"]),
  driver_notes: z.string().max(1000).optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
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
  const parsed = stopUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid stop update payload.", {
      status: 422,
      details: parsed.error.flatten(),
      headers: privateHeaders,
    });
  }

  const { stop_id: stopId, status, driver_notes, photo_url } = parsed.data;

  const { data: stop } = await supabase
    .from("delivery_stops")
    .select("id, route_id")
    .eq("id", stopId)
    .maybeSingle();

  if (!stop) {
    return bad("Stop not found.", { status: 404, headers: privateHeaders });
  }

  const { data: route } = await supabase
    .from("delivery_routes")
    .select("id, driver_id")
    .eq("id", stop.route_id)
    .maybeSingle();

  if (!route || route.driver_id !== user.id) {
    return bad("You do not have access to this stop.", { status: 403, headers: privateHeaders });
  }

  const updates: Record<string, string | null> = {
    status,
    driver_notes: driver_notes ?? null,
    photo_url: photo_url ?? null,
  };

  if (status === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabase
    .from("delivery_stops")
    .update(updates)
    .eq("id", stopId)
    .select("id, status, driver_notes, photo_url, completed_at")
    .maybeSingle();

  if (updateError || !updated) {
    return bad("Unable to update stop.", { status: 500, headers: privateHeaders });
  }

  return ok(
    {
      id: updated.id,
      status: updated.status,
      driver_notes: updated.driver_notes,
      photo_url: updated.photo_url,
      completed_at: updated.completed_at,
    },
    { headers: privateHeaders },
  );
}
