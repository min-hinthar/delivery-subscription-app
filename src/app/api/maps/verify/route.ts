import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { applyCanonicalAddress, assertValidAddress, geocodeAddress } from "@/lib/maps/google";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const verifySchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  postal_code: z.string().min(1),
  country: z.string().min(1).default("US"),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    return bad("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid address payload.", { status: 422 });
  }

  const addressString = [
    parsed.data.line1,
    parsed.data.line2,
    parsed.data.city,
    parsed.data.state,
    parsed.data.postal_code,
    parsed.data.country,
  ]
    .filter(Boolean)
    .join(", ");

  let geocode;

  try {
    geocode = await geocodeAddress(addressString);
    assertValidAddress(geocode);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify address.";
    return bad(message, { status: 422 });
  }

  const canonical = applyCanonicalAddress(geocode);

  return ok({
    formatted_address: geocode.formattedAddress,
    canonical,
  });
}
