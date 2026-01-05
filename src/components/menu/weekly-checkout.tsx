"use client";

import { useState } from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Address, MealPackage } from "@/types";

type WeeklyCheckoutMenu = {
  id: string;
  delivery_date?: string | null;
};

type WeeklyCheckoutProps = {
  menu: WeeklyCheckoutMenu;
  mealPackage: MealPackage;
  addresses: Address[];
  defaultAddressId?: string | null;
};

const DELIVERY_WINDOWS = ["8 AM - 12 PM", "12 PM - 4 PM", "4 PM - 8 PM"] as const;

export function WeeklyCheckout({
  menu,
  mealPackage,
  addresses,
  defaultAddressId,
}: WeeklyCheckoutProps) {
  const [addressId, setAddressId] = useState<string | undefined>(
    defaultAddressId ?? addresses[0]?.id,
  );
  const [deliveryWindow, setDeliveryWindow] = useState<(typeof DELIVERY_WINDOWS)[number]>(
    "12 PM - 4 PM",
  );
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [orderCreated, setOrderCreated] = useState(false);

  const addressOptions = addresses.map((address) => ({
    value: address.id,
    label: `${address.line1}, ${address.city}`,
    description: `${address.state} ${address.postal_code}`,
  }));

  const handleSubmit = async () => {
    if (!addressId) {
      setMessage("Please select a delivery address.");
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setOrderCreated(false);

    try {
      const response = await fetch("/api/orders/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekly_menu_id: menu.id,
          package_id: mealPackage.id,
          delivery_address_id: addressId,
          delivery_instructions: deliveryInstructions || undefined,
          delivery_window: deliveryWindow,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error?.message ?? "Unable to place order.");
        return;
      }

      setMessage(
        "Order created! We’ll confirm payment shortly and send you a receipt when it clears.",
      );
      setOrderCreated(true);
    } catch {
      setMessage("Unable to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Delivery details</h2>
        <div className="mt-4 space-y-4">
          <div>
            <Select
              label="Delivery address"
              options={addressOptions}
              value={addressId}
              onChange={(value) => {
                if (typeof value === "string") {
                  setAddressId(value);
                }
              }}
              placeholder="Select address"
              disabled={addresses.length === 0}
            />
            {addresses.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">
                Add a delivery address in your account settings before ordering.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Delivery window
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DELIVERY_WINDOWS.map((window) => (
                <button
                  key={window}
                  type="button"
                  onClick={() => setDeliveryWindow(window)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm",
                    deliveryWindow === window
                      ? "border-[#D4A574] bg-[#D4A574]/10 text-[#8B4513]"
                      : "border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300",
                  )}
                >
                  {window}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Delivery instructions (optional)
            </label>
            <textarea
              value={deliveryInstructions}
              onChange={(event) => setDeliveryInstructions(event.target.value)}
              className="mt-2 min-h-[96px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>{mealPackage.name}</p>
          {menu.delivery_date && (
            <p>Delivery: {new Date(menu.delivery_date).toLocaleDateString()}</p>
          )}
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
            ${(mealPackage.price_cents / 100).toFixed(0)} / week
          </p>
        </div>
      </Card>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <p>{message}</p>
          {orderCreated ? (
            <Link
              href="/orders/weekly"
              className="mt-2 inline-flex text-sm font-medium text-[#D4A574]"
            >
              View weekly orders
            </Link>
          ) : null}
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        disabled={submitting || !addressId}
      >
        {submitting ? "Placing order..." : "Place order"}
      </Button>
    </div>
  );
}
