import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { getStripeClient } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const portalInputSchema = z.object({
  returnUrl: z.string().url().optional(),
});

function buildReturnUrl(requestUrl: string, fallbackPath: string) {
  const url = new URL(requestUrl);
  return `${url.origin}${fallbackPath}`;
}

function normalizeReturnUrl(requestUrl: string, value: string | undefined, fallbackPath: string) {
  if (!value) {
    return buildReturnUrl(requestUrl, fallbackPath);
  }

  try {
    const fallback = new URL(buildReturnUrl(requestUrl, fallbackPath));
    const provided = new URL(value);

    if (provided.origin !== fallback.origin) {
      return fallback.toString();
    }

    return provided.toString();
  } catch {
    return buildReturnUrl(requestUrl, fallbackPath);
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return bad("Authentication required.", { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = portalInputSchema.safeParse(payload);

  if (!parsed.success) {
    return bad("Invalid billing portal request.", { status: 422 });
  }

  const admin = createSupabaseAdminClient();
  const { data: customers, error } = await admin
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1);

  if (error) {
    return bad("Unable to load Stripe customer.", { status: 500 });
  }

  const stripeCustomerId = customers?.[0]?.stripe_customer_id;

  if (!stripeCustomerId) {
    return bad("No Stripe customer on file.", { status: 404 });
  }

  const stripe = getStripeClient();
  const returnUrl = normalizeReturnUrl(request.url, parsed.data.returnUrl, "/account");

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return ok({ url: session.url });
}
