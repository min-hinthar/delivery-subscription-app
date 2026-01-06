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

  // Check for existing driver profile
  const { data: existing } = await supabase
    .from("driver_profiles")
    .select("id, status")
    .eq("email", payload.email)
    .maybeSingle();

  if (existing) {
    return bad("Driver already invited.", {
      status: 409,
      headers: privateHeaders,
      details: {
        message: existing.status === "pending"
          ? "This driver has a pending invite. Use the resend option instead."
          : "This driver already has an active profile."
      }
    });
  }

  // Check if email already exists in auth.users to avoid race condition
  const adminClient = createSupabaseAdminClient();
  const { data: existingAuthUser } = await adminClient.auth.admin.listUsers();
  const userExists = existingAuthUser?.users?.some(u => u.email === payload.email);

  if (userExists) {
    return bad("A user with this email already exists.", {
      status: 409,
      headers: privateHeaders
    });
  }

  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/driver/onboarding")}`;

  // Invite user via Supabase Auth
  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(payload.email, {
      redirectTo,
      data: {
        invited_by: user.id,
        invite_message: payload.message ?? null,
      },
    });

  if (inviteError) {
    console.error("Driver invite error:", inviteError);
    return bad(
      inviteError.message || "Unable to send invite email.",
      {
        status: inviteError.status || 500,
        headers: privateHeaders,
        details: {
          code: inviteError.code,
          message: inviteError.message
        }
      }
    );
  }

  if (!inviteData.user) {
    return bad("Invite succeeded but no user data returned.", {
      status: 500,
      headers: privateHeaders
    });
  }

  // Create driver profile with defensive null values for full_name and phone
  // These will be filled during onboarding
  const { error: insertError } = await supabase.from("driver_profiles").insert({
    id: inviteData.user.id,
    email: payload.email,
    full_name: null, // Defensive: nullable, will be filled during onboarding
    phone: null, // Defensive: nullable, will be filled during onboarding
    status: "pending",
    invited_by: user.id,
  });

  if (insertError) {
    console.error("Driver profile insert error:", insertError);

    // If insert fails, attempt to delete the invited user to maintain consistency
    try {
      await adminClient.auth.admin.deleteUser(inviteData.user.id);
    } catch (cleanupError) {
      console.error("Failed to cleanup invited user after profile insert failure:", cleanupError);
    }

    return bad("Failed to create driver profile.", {
      status: 500,
      headers: privateHeaders,
      details: {
        code: insertError.code,
        message: insertError.message
      }
    });
  }

  return ok(
    { driver_id: inviteData.user.id, invited_at: new Date().toISOString() },
    { headers: privateHeaders },
  );
}
