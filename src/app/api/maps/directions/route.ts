import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { directionsRoute } from "@/lib/maps/google";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const directionsSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  waypoints: z.array(z.string().min(1)).optional().default([]),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    return bad("Unauthorized", { status: 401 });
  }

  const body = await request.json();
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
