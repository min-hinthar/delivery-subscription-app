import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const inviteSchema = z.object({
  email: z.string().email(),
  message: z.string().max(500).optional(),
});

const privateHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const { supabase, user, isAdmin } = await requireAdmin();

  if (!isAdmin || !user) {
    return bad("Admin access required.", { status: 403, headers: privateHeaders });
  }

  const rate = rateLimit({
    key: `admin:driver-invite:${user.id}`,
    max: 10,
    windowMs: 60 * 60 * 1000,
  });

  if (!rate.allowed) {
    return bad("Invite limit reached. Try again later.", {
      status: 429,
      headers: {
        "Retry-After": Math.ceil(rate.resetMs / 1000).toString(),
        ...privateHeaders,
      },
    });
  }

  let payload: z.infer<typeof inviteSchema>;

  try {
    payload = inviteSchema.parse(await request.json());
  } catch (error) {
    return bad("Invalid invite request.", { status: 422, details: error, headers: privateHeaders });
  }

  const { data: existing } = await supabase
    .from("driver_profiles")
    .select("id")
    .eq("email", payload.email)
    .maybeSingle();

  if (existing) {
    return bad("Driver already invited.", { status: 409, headers: privateHeaders });
  }

  const adminClient = createSupabaseAdminClient();
  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/driver/onboarding")}`;

  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(payload.email, {
      redirectTo,
      data: {
        invited_by: user.id,
        invite_message: payload.message ?? null,
      },
    });

  if (inviteError || !inviteData.user) {
    return bad("Unable to send invite email.", { status: 500, headers: privateHeaders });
  }

  const { error: insertError } = await supabase.from("driver_profiles").insert({
    id: inviteData.user.id,
    email: payload.email,
    status: "pending",
    invited_by: user.id,
  });

  if (insertError) {
    return bad("Failed to create driver profile.", { status: 500, headers: privateHeaders });
  }

  return ok(
    { driver_id: inviteData.user.id, invited_at: new Date().toISOString() },
    { headers: privateHeaders },
  );
}
