import Stripe from "stripe";

import { bad, ok } from "@/lib/api/response";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function toDateTime(timestamp: number | null | undefined) {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp * 1000).toISOString();
}

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!customer) {
    return null;
  }

  if (typeof customer === "string") {
    return customer;
  }

  return customer.id;
}

async function resolveUserId(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  stripeCustomerId: string | null,
  fallbackUserId: string | null,
) {
  if (!stripeCustomerId) {
    return fallbackUserId;
  }

  const { data, error } = await adminClient
    .from("stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .limit(1);

  if (error) {
    return fallbackUserId;
  }

  const userId = data?.[0]?.user_id ?? fallbackUserId;

  if (!data?.length && fallbackUserId) {
    await adminClient.from("stripe_customers").upsert(
      {
        user_id: fallbackUserId,
        stripe_customer_id: stripeCustomerId,
      },
      {
        onConflict: "stripe_customer_id",
      },
    );
  }

  return userId;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return bad("Missing Stripe signature.", { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature.";
    return bad(`Stripe webhook error: ${message}`, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const stripeCustomerId = getCustomerId(session.customer ?? null);
    const userId =
      session.client_reference_id ?? session.metadata?.supabase_user_id ?? null;

    if (stripeCustomerId && userId) {
      const { error } = await admin.from("stripe_customers").upsert(
        {
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
        },
        {
          onConflict: "stripe_customer_id",
        },
      );

      if (error) {
        return bad("Failed to sync Stripe customer.", { status: 500 });
      }
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeCustomerId = getCustomerId(subscription.customer ?? null);
    const userId = await resolveUserId(
      admin,
      stripeCustomerId,
      subscription.metadata?.supabase_user_id ?? null,
    );

    if (!userId) {
      return ok({ received: true });
    }

    const subscriptionItem = subscription.items.data[0];
    const priceId = subscriptionItem?.price?.id ?? null;

    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: subscription.status,
        current_period_start: toDateTime(subscriptionItem?.current_period_start),
        current_period_end: toDateTime(subscriptionItem?.current_period_end),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "stripe_subscription_id",
      },
    );

    if (error) {
      return bad("Failed to sync subscription.", { status: 500 });
    }
  }

  if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const stripeCustomerId = getCustomerId(invoice.customer ?? null);
    const userId = await resolveUserId(
      admin,
      stripeCustomerId,
      invoice.metadata?.supabase_user_id ?? null,
    );

    if (!userId) {
      return ok({ received: true });
    }

    const paymentIntent = (
      invoice as Stripe.Invoice & {
        payment_intent?: string | Stripe.PaymentIntent;
      }
    ).payment_intent;
    const paymentIntentId =
      typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id ?? null;

    const { error } = await admin.from("payments").upsert(
      {
        user_id: userId,
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: paymentIntentId,
        amount_cents: invoice.amount_paid ?? invoice.amount_due ?? 0,
        currency: invoice.currency ?? "usd",
        status: invoice.status ?? "pending",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "stripe_invoice_id",
      },
    );

    if (error) {
      return bad("Failed to sync payment.", { status: 500 });
    }
  }

  return ok({ received: true });
}
