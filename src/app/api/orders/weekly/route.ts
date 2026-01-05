import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { getStripeClient } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const privateHeaders = { "Cache-Control": "no-store" };

const orderSchema = z.object({
  weekly_menu_id: z.string().uuid(),
  package_id: z.string().uuid(),
  delivery_address_id: z.string().uuid(),
  delivery_instructions: z.string().trim().optional(),
  delivery_window: z.enum(["8 AM - 12 PM", "12 PM - 4 PM", "4 PM - 8 PM"]),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return bad("Authentication required.", { status: 401, headers: privateHeaders });
  }

  const payload = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(payload);

  if (!parsed.success) {
    return bad("Invalid order payload.", {
      status: 422,
      headers: privateHeaders,
      details: parsed.error.flatten(),
    });
  }

  const { weekly_menu_id, package_id, delivery_address_id, delivery_window } = parsed.data;

  const { data: menu, error: menuError } = await supabase
    .from("weekly_menus")
    .select("id, status, order_deadline")
    .eq("id", weekly_menu_id)
    .maybeSingle();

  if (menuError || !menu) {
    return bad("Weekly menu not found.", { status: 404, headers: privateHeaders });
  }

  if (menu.status !== "published") {
    return bad("This menu is no longer accepting orders.", {
      status: 422,
      headers: privateHeaders,
    });
  }

  if (menu.order_deadline && new Date(menu.order_deadline) < new Date()) {
    return bad("Order deadline has passed.", { status: 422, headers: privateHeaders });
  }

  const { data: existingOrder } = await supabase
    .from("weekly_orders")
    .select("id")
    .eq("weekly_menu_id", weekly_menu_id)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (existingOrder) {
    return bad("You already have an order for this week.", {
      status: 409,
      headers: privateHeaders,
    });
  }

  const { data: mealPackage, error: packageError } = await supabase
    .from("meal_packages")
    .select("id, price_cents")
    .eq("id", package_id)
    .eq("is_active", true)
    .maybeSingle();

  if (packageError || !mealPackage) {
    return bad("Package not found.", { status: 404, headers: privateHeaders });
  }

  let paymentIntentId: string | null = null;
  let clientSecret: string | null = null;

  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: mealPackage.price_cents,
      currency: "usd",
      metadata: {
        customer_id: user.id,
        weekly_menu_id,
        package_id,
      },
    });

    paymentIntentId = paymentIntent.id;
    clientSecret = paymentIntent.client_secret ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create payment intent.";
    return bad(message, { status: 500, headers: privateHeaders });
  }

  const { data: order, error: orderError } = await supabase
    .from("weekly_orders")
    .insert({
      weekly_menu_id,
      customer_id: user.id,
      package_id,
      total_amount_cents: mealPackage.price_cents,
      delivery_address_id,
      delivery_instructions: parsed.data.delivery_instructions ?? null,
      delivery_window,
      stripe_payment_intent_id: paymentIntentId,
      status: "pending",
    })
    .select("*")
    .maybeSingle();

  if (orderError || !order) {
    if (orderError?.code === "23505") {
      return bad("You already have an order for this week.", {
        status: 409,
        headers: privateHeaders,
      });
    }

    return bad("Failed to create order.", { status: 500, headers: privateHeaders });
  }

  return ok({ order, client_secret: clientSecret }, { headers: privateHeaders });
}

export async function GET() {
  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return bad("Authentication required.", { status: 401, headers: privateHeaders });
  }

  const { data, error } = await supabase
    .from("weekly_orders")
    .select(
      `
      id,
      weekly_menu_id,
      customer_id,
      package_id,
      total_amount_cents,
      status,
      delivery_address_id,
      delivery_instructions,
      delivery_window,
      driver_id,
      assigned_at,
      stripe_payment_intent_id,
      paid_at,
      created_at,
      updated_at,
      cancelled_at,
      delivered_at,
      weekly_menu:weekly_menus(id, week_start_date, delivery_date, status),
      package:meal_packages(id, name, price_cents),
      delivery_address:addresses(id, line1, line2, city, state, postal_code)
    `,
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return bad("Failed to fetch orders.", { status: 500, headers: privateHeaders });
  }

  return ok({ orders: data ?? [] }, { headers: privateHeaders });
}
