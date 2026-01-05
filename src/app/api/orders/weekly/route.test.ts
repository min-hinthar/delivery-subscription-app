import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mockSupabaseServerClient = vi.fn();
const mockStripeClient = {
  paymentIntents: {
    create: vi.fn(),
    cancel: vi.fn(),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => mockSupabaseServerClient(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => mockStripeClient,
}));

function buildRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/orders/weekly", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/orders/weekly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("rejects orders after the deadline", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "weekly_menus") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "menu-1",
                status: "published",
                order_deadline: new Date(Date.now() - 60_000).toISOString(),
              },
              error: null,
            }),
          };
        }
        return {};
      }),
    };

    mockSupabaseServerClient.mockReturnValue(supabase);

    const response = await POST(
      buildRequest({
        weekly_menu_id: "2e4b7a2c-7a6c-4f9f-9e49-1f0ab01a8f2a",
        package_id: "14b0d027-6b2a-4f8d-8b9b-1b8e9b8dca20",
        delivery_address_id: "d9858fe0-2dd3-4f2b-9b30-9e2b3c86a60a",
        delivery_window: "12 PM - 4 PM",
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(422);
    expect(payload.error.message).toContain("deadline");
  });

  it("returns 409 when duplicate order exists", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "weekly_menus") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "menu-1",
                status: "published",
                order_deadline: new Date(Date.now() + 60_000).toISOString(),
              },
              error: null,
            }),
          };
        }
        if (table === "weekly_orders") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "order-1" },
              error: null,
            }),
          };
        }
        return {};
      }),
    };

    mockSupabaseServerClient.mockReturnValue(supabase);

    const response = await POST(
      buildRequest({
        weekly_menu_id: "2e4b7a2c-7a6c-4f9f-9e49-1f0ab01a8f2a",
        package_id: "14b0d027-6b2a-4f8d-8b9b-1b8e9b8dca20",
        delivery_address_id: "d9858fe0-2dd3-4f2b-9b30-9e2b3c86a60a",
        delivery_window: "12 PM - 4 PM",
      }),
    );

    expect(response.status).toBe(409);
  });

  it("creates a payment intent with order metadata", async () => {
    const weeklyMenu = {
      id: "menu-1",
      status: "published",
      order_deadline: new Date(Date.now() + 60_000).toISOString(),
    };
    const orderRow = { id: "order-1" };
    const menuItems = Array.from({ length: 7 }, (_, day) => ({
      day_of_week: day,
      is_available: true,
      max_portions: null,
      current_orders: 0,
    }));

    const weeklyOrdersQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    };

    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "weekly_menus") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: weeklyMenu, error: null }),
          };
        }
        if (table === "weekly_orders") {
          return {
            select: weeklyOrdersQuery.select,
            eq: weeklyOrdersQuery.eq,
            maybeSingle: weeklyOrdersQuery.maybeSingle,
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: orderRow, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "meal_packages") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "package-1", price_cents: 2500, dishes_per_day: 1 },
              error: null,
            }),
          };
        }
        if (table === "weekly_menu_items") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: menuItems, error: null }),
            }),
          };
        }
        if (table === "stripe_customers") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { stripe_customer_id: "cus_123" },
              error: null,
            }),
          };
        }
        return {};
      }),
    };

    mockStripeClient.paymentIntents.create.mockResolvedValue({
      id: "pi_123",
      client_secret: "secret",
    });

    mockSupabaseServerClient.mockReturnValue(supabase);

    const response = await POST(
      buildRequest({
        weekly_menu_id: "2e4b7a2c-7a6c-4f9f-9e49-1f0ab01a8f2a",
        package_id: "14b0d027-6b2a-4f8d-8b9b-1b8e9b8dca20",
        delivery_address_id: "d9858fe0-2dd3-4f2b-9b30-9e2b3c86a60a",
        delivery_window: "12 PM - 4 PM",
      }),
    );

    expect(response.status).toBe(200);
    expect(mockStripeClient.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          order_id: orderRow.id,
          weekly_menu_id: "2e4b7a2c-7a6c-4f9f-9e49-1f0ab01a8f2a",
        }),
      }),
      expect.any(Object),
    );
  });
});
