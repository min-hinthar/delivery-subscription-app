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

  if (error || !driver) {
    return bad("Unable to update driver status.", { status: 500, headers: privateHeaders });
  }

  return ok({ driver }, { headers: privateHeaders });
}
