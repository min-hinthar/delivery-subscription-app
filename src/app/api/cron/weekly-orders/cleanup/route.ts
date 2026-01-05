import { bad, ok } from "@/lib/api/response";
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
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: staleOrders } = await admin
    .from("weekly_orders")
    .select("id, stripe_payment_intent_id")
    .eq("status", "pending")
    .lt("created_at", cutoff);

  let cancelled = 0;

  for (const order of staleOrders ?? []) {
    if (order.stripe_payment_intent_id) {
      try {
        await stripe.paymentIntents.cancel(order.stripe_payment_intent_id);
      } catch (error) {
        console.warn("weekly_order_cancel_failed", {
          orderId: order.id,
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    await admin
      .from("weekly_orders")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", order.id);

    cancelled += 1;
  }

  return ok({ cancelled }, { headers: privateHeaders });
}
