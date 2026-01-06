import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";

const statusSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

const privateHeaders = { "Cache-Control": "no-store" };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Validate ID is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return bad("Invalid driver ID format.", { status: 422, headers: privateHeaders });
  }

  const { supabase, user, isAdmin } = await requireAdmin();

  if (!isAdmin || !user) {
    return bad("Admin access required.", { status: 403, headers: privateHeaders });
  }

  let payload: z.infer<typeof statusSchema>;

  try {
    payload = statusSchema.parse(await request.json());
  } catch (error) {
    return bad("Invalid status update.", { status: 422, details: error, headers: privateHeaders });
  }

  const { data: driver, error } = await supabase
    .from("driver_profiles")
    .update({ status: payload.status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();

  if (error) {
    console.error('Failed to update driver status:', error);
    return bad("Unable to update driver status.", { status: 500, headers: privateHeaders, details: { error: error.message } });
  }

  if (!driver) {
    return bad("Driver not found.", { status: 404, headers: privateHeaders });
  }

  return ok({ driver }, { headers: privateHeaders });
}
