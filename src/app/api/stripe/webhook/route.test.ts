import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mockStripeClient = {
  webhooks: {
    constructEvent: vi.fn(),
  },
};

const mockAdminClient = {
  from: vi.fn(),
};

const sendOrderConfirmation = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => mockStripeClient,
  getStripeWebhookSecret: () => "whsec_test",
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => mockAdminClient,
}));

vi.mock("@/lib/email", () => ({
  sendOrderConfirmation: (...args: unknown[]) => sendOrderConfirmation(...args),
}));

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirms weekly orders and sends confirmation email", async () => {
    const event = {
      id: "evt_123",
      type: "payment_intent.succeeded",
      data: {
        object: { id: "pi_123" },
      },
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue(event);

    const stripeEventsQuery = {
      insert: vi.fn().mockResolvedValue({ details: { error: null  }}),
    };
    const weeklyOrdersUpdateQuery = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ details: { error: null  }}),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "order-1",
              confirmation_sent_at: null,
              delivery_window: "12 PM - 4 PM",
              total_amount_cents: 2500,
              customer: { full_name: "Customer", email: "customer@example.com" },
              package: { name: "Package A" },
              weekly_menu: { delivery_date: "2025-01-11" },
            },
            error: null,
          }),
        }),
      }),
    };

    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === "stripe_events") {
        return stripeEventsQuery;
      }
      if (table === "weekly_orders") {
        return weeklyOrdersUpdateQuery;
      }
      return {};
    });

    const request = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "payload",
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(sendOrderConfirmation).toHaveBeenCalledWith(
      "customer@example.com",
      "Customer",
      "en",
      expect.objectContaining({
        packageName: "Package A",
      }),
    );
  });
});
