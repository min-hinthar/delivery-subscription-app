import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const privateHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user, isAdmin } = await requireAdmin();

  if (!isAdmin || !user) {
    return bad("Admin access required.", { status: 403, headers: privateHeaders });
  }

  const { data: driver } = await supabase
    .from("driver_profiles")
    .select("id, email, status")
    .eq("id", params.id)
    .maybeSingle();

  if (!driver) {
    return bad("Driver not found.", { status: 404, headers: privateHeaders });
  }

  if (driver.status !== "pending") {
    return bad("Only pending drivers can be re-invited.", { status: 409, headers: privateHeaders });
  }

  const adminClient = createSupabaseAdminClient();
  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/driver/onboarding")}`;

  const { error } = await adminClient.auth.admin.inviteUserByEmail(driver.email, { redirectTo });

  if (error) {
    return bad("Unable to resend invite email.", { status: 500, headers: privateHeaders });
  }

  await supabase
    .from("driver_profiles")
    .update({ invited_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", driver.id);

  return ok({ sent_at: new Date().toISOString() }, { headers: privateHeaders });
}
