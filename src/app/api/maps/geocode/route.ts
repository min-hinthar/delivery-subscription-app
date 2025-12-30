import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { applyCanonicalAddress, geocodeAddress } from "@/lib/maps/google";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const geocodeSchema = z.object({
  address_id: z.string().uuid(),
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

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  const rate = rateLimit({
    key: `maps:geocode:${auth.user.id ?? clientIp}`,
    max: 10,
    windowMs: 60_000,
  });

  if (!rate.allowed) {
    return bad("Too many map requests. Please wait and try again.", {
      status: 429,
      headers: {
        "Retry-After": Math.ceil(rate.resetMs / 1000).toString(),
      },
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = geocodeSchema.safeParse(body);

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to geocode address.";
    return bad(message, { status: 422 });
  }

  const canonical = applyCanonicalAddress(geocode);

  const { error } = await supabase
    .from("addresses")
    .update({
      line1: canonical.line1 ?? parsed.data.line1,
      line2: parsed.data.line2 ?? null,
      city: canonical.city ?? parsed.data.city,
      state: canonical.state ?? parsed.data.state,
      postal_code: canonical.postal_code ?? parsed.data.postal_code,
      country: canonical.country ?? parsed.data.country,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.address_id)
    .eq("user_id", auth.user.id);

  if (error) {
    return bad("Failed to update address.", { status: 500 });
  }

  return ok({
    formatted_address: geocode.formattedAddress,
    location: geocode.location,
  });
}
