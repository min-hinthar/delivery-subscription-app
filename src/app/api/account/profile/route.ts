import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { applyCanonicalAddress, assertValidAddress, geocodeAddress } from "@/lib/maps/google";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileUpdateSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().min(7),
  onboarding_completed: z.boolean().optional(),
  address: z.object({
    id: z.string().uuid().optional().nullable(),
    line1: z.string().min(1),
    line2: z.string().optional().nullable(),
    city: z.string().min(1),
    state: z.string().min(1),
    postal_code: z.string().min(3),
    country: z.string().min(1).default("US"),
    instructions: z.string().optional().nullable(),
  }),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    return bad("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid profile payload.", { status: 422 });
  }

  const { full_name, phone, onboarding_completed, address } = parsed.data;

  if (address.id) {
    const { data: existingAddress } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", address.id)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!existingAddress?.id) {
      return bad("Address not available.", { status: 403 });
    }
  }

  const addressString = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");

  let canonical: ReturnType<typeof applyCanonicalAddress>;

  try {
    const geocode = await geocodeAddress(addressString);
    assertValidAddress(geocode);
    canonical = applyCanonicalAddress(geocode);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to validate address.";
    return bad(message, { status: 422 });
  }

  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: {
      full_name,
      phone,
    },
  });

  if (authUpdateError) {
    return bad("Failed to sync user metadata.", { status: 500 });
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: auth.user.id,
    email: auth.user.email,
    full_name,
    phone,
    onboarding_completed: onboarding_completed ?? undefined,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    return bad("Failed to update profile.", { status: 500 });
  }

  const { error: addressError } = await supabase
    .from("addresses")
    .upsert(
      {
        id: address.id ?? undefined,
        user_id: auth.user.id,
        line1: canonical.line1 ?? address.line1,
        line2: address.line2 ?? null,
        city: canonical.city ?? address.city,
        state: canonical.state ?? address.state,
        postal_code: canonical.postal_code ?? address.postal_code,
        country: canonical.country ?? address.country,
        instructions: address.instructions ?? null,
        is_primary: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (addressError) {
    return bad("Failed to update address.", { status: 500 });
  }

  return ok({ updated: true });
}
