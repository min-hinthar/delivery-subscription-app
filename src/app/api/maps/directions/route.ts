import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { directionsRoute } from "@/lib/maps/google";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const directionsSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  waypoints: z.array(z.string().min(1)).optional().default([]),
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
    key: `maps:directions:${auth.user.id ?? clientIp}`,
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
  const parsed = directionsSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid directions payload.", { status: 422 });
  }

  try {
    const route = await directionsRoute({
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      waypoints: parsed.data.waypoints,
    });

    return ok(route);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to build directions.";
    return bad(message, { status: 422 });
  }
}
