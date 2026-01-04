import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
});

const privateHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let payload: z.infer<typeof loginSchema>;

  try {
    payload = loginSchema.parse(await request.json());
  } catch (error) {
    return bad("Invalid login request.", { status: 422, details: error, headers: privateHeaders });
  }

  const emailKey = payload.email.trim().toLowerCase();
  const rate = rateLimit({
    key: `driver:login:${emailKey}`,
    max: 3,
    windowMs: 15 * 60 * 1000,
  });

  if (!rate.allowed) {
    return bad("Too many login attempts. Try again later.", {
      status: 429,
      headers: {
        "Retry-After": Math.ceil(rate.resetMs / 1000).toString(),
        ...privateHeaders,
      },
    });
  }

  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const origin = new URL(request.url).origin;

  const { error } = await supabase.auth.signInWithOtp({
    email: payload.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/driver/dashboard")}`,
      shouldCreateUser: false,
    },
  });

  if (error) {
    return bad("Unable to send login link.", { status: 500, headers: privateHeaders });
  }

  return ok({ sent: true }, { headers: privateHeaders });
}
