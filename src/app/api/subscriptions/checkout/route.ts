import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { getStripeClient, getStripeWeeklyPriceId } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const checkoutInputSchema = z.object({
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return bad("Authentication required.", { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = checkoutInputSchema.safeParse(payload);

  if (!parsed.success) {
    return bad("Invalid checkout request.", { status: 422 });
  }

  const stripe = getStripeClient();
  const admin = createSupabaseAdminClient();

  const { data: existingCustomers, error: customerError } = await admin
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1);

  if (customerError) {
    return bad("Unable to load Stripe customer.", { status: 500 });
  }

  let stripeCustomerId = existingCustomers?.[0]?.stripe_customer_id ?? null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    stripeCustomerId = customer.id;

    const { error: insertError } = await admin.from("stripe_customers").insert({
      user_id: user.id,
      stripe_customer_id: stripeCustomerId,
    });

    if (insertError) {
      return bad("Unable to save Stripe customer.", { status: 500 });
    }
  }

  const successUrl = normalizeReturnUrl(request.url, parsed.data.successUrl, "/account");
  const cancelUrl = normalizeReturnUrl(request.url, parsed.data.cancelUrl, "/pricing");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [
      {
        price: getStripeWeeklyPriceId(),
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    client_reference_id: user.id,
    metadata: {
      supabase_user_id: user.id,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
      },
    },
  });

  return ok({ url: session.url });
}
