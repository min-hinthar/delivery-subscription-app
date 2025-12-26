import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing Stripe environment variable: STRIPE_SECRET_KEY.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2025-12-15.clover",
    });
  }

  return stripeClient;
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Missing Stripe environment variable: STRIPE_WEBHOOK_SECRET.");
  }

  return webhookSecret;
}

export function getStripeWeeklyPriceId() {
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY;

  if (!priceId) {
    throw new Error(
      "Missing Stripe environment variable: NEXT_PUBLIC_STRIPE_PRICE_WEEKLY.",
    );
  }

  return priceId;
}
