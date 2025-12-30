import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";

const deleteRouteSchema = z.object({
  route_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = deleteRouteSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid route payload.", { status: 422 });
  }

  const { error } = await supabase
    .from("delivery_routes")
    .delete()
    .eq("id", parsed.data.route_id);

  if (error) {
    return bad("Failed to delete route.", { status: 500 });
  }

  return ok({ deleted: true });
}
