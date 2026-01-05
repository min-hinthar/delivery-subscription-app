import { bad, ok } from "@/lib/api/response";
import { sendOrderConfirmation } from "@/lib/email";
import { getStripeClient } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const privateHeaders = { "Cache-Control": "no-store" };

function getSecret(request: Request) {
  const headerSecret =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    request.headers.get("x-cron-secret");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("cron_secret");
  return headerSecret ?? querySecret;
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return bad("Missing CRON_SECRET.", { status: 500 });
  }

  if (getSecret(request) !== secret) {
    return bad("Unauthorized", { status: 401, headers: privateHeaders });
  }

  const admin = createSupabaseAdminClient();
  const stripe = getStripeClient();

  const { data: pendingOrders } = await admin
    .from("weekly_orders")
    .select("id, stripe_payment_intent_id, status, confirmation_sent_at")
    .eq("status", "pending")
    .not("stripe_payment_intent_id", "is", null)
    .gte("created_at", new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());

  let reconciled = 0;
  let confirmed = 0;
  let cancelled = 0;

  for (const order of pendingOrders ?? []) {
    const paymentIntentId = order.stripe_payment_intent_id;
    if (!paymentIntentId) continue;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    reconciled += 1;

    if (paymentIntent.status === "succeeded") {
      await admin
        .from("weekly_orders")
        .update({ status: "confirmed", paid_at: new Date().toISOString() })
        .eq("id", order.id);

      confirmed += 1;
    }

    if (paymentIntent.status === "canceled") {
      await admin
        .from("weekly_orders")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", order.id);

      cancelled += 1;
    }
  }

  const paymentIntents = await stripe.paymentIntents.list({
    limit: 100,
    created: { gte: Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000) },
  });

  for (const intent of paymentIntents.data) {
    const metadata = intent.metadata ?? {};
    if (!metadata.order_id || !metadata.weekly_menu_id || !metadata.package_id) {
      continue;
    }

    const { data: existingOrder } = await admin
      .from("weekly_orders")
      .select("id")
      .eq("id", metadata.order_id)
      .maybeSingle();

    if (existingOrder) {
      continue;
    }

    if (!intent.customer || typeof intent.customer !== "string") {
      continue;
    }

    const { data: stripeCustomer } = await admin
      .from("stripe_customers")
      .select("user_id")
      .eq("stripe_customer_id", intent.customer)
      .maybeSingle();

    if (!stripeCustomer?.user_id) {
      continue;
    }

    const insertPayload = {
      id: metadata.order_id,
      weekly_menu_id: metadata.weekly_menu_id,
      customer_id: stripeCustomer.user_id,
      package_id: metadata.package_id,
      total_amount_cents: intent.amount ?? 0,
      delivery_address_id: metadata.delivery_address_id ?? null,
      delivery_window: metadata.delivery_window ?? null,
      stripe_payment_intent_id: intent.id,
      status: intent.status === "succeeded" ? "confirmed" : "pending",
      paid_at: intent.status === "succeeded" ? new Date().toISOString() : null,
    };

    const { data: createdOrder } = await admin
      .from("weekly_orders")
      .insert(insertPayload)
      .select(
        `
        id,
        confirmation_sent_at,
        delivery_window,
        total_amount_cents,
        customer:profiles(full_name, email),
        package:meal_packages(name),
        weekly_menu:weekly_menus(delivery_date)
      `,
      )
      .maybeSingle();

    const normalizedOrder = createdOrder
      ? {
          ...createdOrder,
          customer: Array.isArray(createdOrder.customer)
            ? createdOrder.customer[0] ?? null
            : createdOrder.customer,
          package: Array.isArray(createdOrder.package)
            ? createdOrder.package[0] ?? null
            : createdOrder.package,
          weekly_menu: Array.isArray(createdOrder.weekly_menu)
            ? createdOrder.weekly_menu[0] ?? null
            : createdOrder.weekly_menu,
        }
      : null;

    if (normalizedOrder?.customer?.email && intent.status === "succeeded") {
      try {
        await sendOrderConfirmation(
          normalizedOrder.customer.email,
          normalizedOrder.customer.full_name ?? "there",
          "en",
          {
            packageName: normalizedOrder.package?.name ?? "Weekly package",
            deliveryDate: normalizedOrder.weekly_menu?.delivery_date ?? "Upcoming delivery",
            deliveryWindow: normalizedOrder.delivery_window,
            totalAmount: normalizedOrder.total_amount_cents
              ? `$${(normalizedOrder.total_amount_cents / 100).toFixed(0)}`
              : "$0",
          },
        );

        await admin
          .from("weekly_orders")
          .update({ confirmation_sent_at: new Date().toISOString() })
          .eq("id", normalizedOrder.id);
      } catch (error) {
        console.warn("weekly_order_reconcile_email_failed", {
          orderId: normalizedOrder.id,
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    }
  }

  return ok({ reconciled, confirmed, cancelled }, { headers: privateHeaders });
}
