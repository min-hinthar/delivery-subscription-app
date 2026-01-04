import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  stop_id: z.string().uuid(),
  photo_path: z.string().min(1),
});

const privateHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return bad("Not authenticated.", { status: 401, headers: privateHeaders });
  }

  const rate = rateLimit({
    key: `track:photo-url:${user.id}`,
    max: 15,
    windowMs: 60_000,
  });

  if (!rate.allowed) {
    return bad("Too many photo requests. Please wait a moment and try again.", {
      status: 429,
      headers: {
        "Retry-After": Math.ceil(rate.resetMs / 1000).toString(),
        ...privateHeaders,
      },
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid request payload.", {
      status: 422,
      details: parsed.error.flatten(),
      headers: privateHeaders,
    });
  }

  const { stop_id: stopId, photo_path: photoPath } = parsed.data;

  const { data: stop } = await supabase
    .from("delivery_stops")
    .select("id, appointment:delivery_appointments(user_id)")
    .eq("id", stopId)
    .maybeSingle();

  const appointment = Array.isArray(stop?.appointment) ? stop?.appointment[0] : stop?.appointment;

  if (!stop || appointment?.user_id !== user.id) {
    return bad("You do not have access to this photo.", { status: 403, headers: privateHeaders });
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin.storage
    .from("delivery-proofs")
    .createSignedUrl(photoPath, 60 * 60);

  if (!data?.signedUrl) {
    return bad("Unable to create photo URL.", { status: 500, headers: privateHeaders });
  }

  return ok({ signed_url: data.signedUrl }, { headers: privateHeaders });
}
