import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { applyCanonicalAddress, autocompleteAddress, lookupPlaceDetails } from "@/lib/maps/google";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const placesSchema = z.union([
  z.object({
    mode: z.literal("search"),
    query: z.string().min(3),
    country: z.string().min(2).max(2).optional(),
  }),
  z.object({
    mode: z.literal("details"),
    place_id: z.string().min(1),
  }),
]);

const privateHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    return bad("Unauthorized", { status: 401, headers: privateHeaders });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  const rate = rateLimit({
    key: `maps:places:${auth.user.id ?? clientIp}`,
    max: 12,
    windowMs: 60_000,
  });

  if (!rate.allowed) {
    return bad("Too many map requests. Please wait and try again.", {
      status: 429,
      headers: {
        "Retry-After": Math.ceil(rate.resetMs / 1000).toString(),
        ...privateHeaders,
      },
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = placesSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid places payload.", { status: 422, headers: privateHeaders });
  }

  if (parsed.data.mode === "search") {
    try {
      const predictions = await autocompleteAddress(parsed.data.query, {
        country: parsed.data.country ?? "US",
      });
      return ok({ predictions }, { headers: privateHeaders });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to search addresses.";
      return bad(message, { status: 422, headers: privateHeaders });
    }
  }

  try {
    const details = await lookupPlaceDetails(parsed.data.place_id);
    const canonical = applyCanonicalAddress(details);
    return ok(
      {
        formatted_address: details.formattedAddress,
        address: {
          line1: canonical.line1 ?? null,
          city: canonical.city ?? null,
          state: canonical.state ?? null,
          postal_code: canonical.postal_code ?? null,
          country: canonical.country ?? "US",
        },
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch address details.";
    return bad(message, { status: 422, headers: privateHeaders });
  }
}
