"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

type DriverOption = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export type WeeklyOrderRow = {
  id: string;
  status: string | null;
  delivery_window: string | null;
  delivery_instructions: string | null;
  total_amount_cents: number | null;
  created_at: string;
  paid_at: string | null;
  customer: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  package: {
    name: string | null;
  } | null;
  delivery_address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
  } | null;
  driver: DriverOption | null;
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

type WeeklyOrdersTableProps = {
  orders: WeeklyOrderRow[];
  drivers: DriverOption[];
};

function formatCurrency(value?: number | null) {
  if (!value) return "—";
  return `$${(value / 100).toFixed(0)}`;
}

function formatAddress(address: WeeklyOrderRow["delivery_address"]) {
  if (!address) return "No address on file";
  return [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
}

export function WeeklyOrdersTable({ orders, drivers }: WeeklyOrdersTableProps) {
  const [items, setItems] = useState(orders);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  const driverOptions = useMemo(
    () =>
      [
        { id: "", full_name: "Unassigned", email: null },
        ...drivers,
      ].map((driver) => ({
        value: driver.id,
        label: driver.full_name ?? driver.email ?? "Unassigned",
      })),
    [drivers],
  );

  const handleUpdate = async (orderId: string, status: string, driverId: string) => {
    setSavingId(orderId);
    try {
      const response = await fetch("/api/admin/weekly-orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekly_order_id: orderId,
          status,
          driver_id: driverId || null,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Unable to update order.");
      }

      setItems((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: payload.data.order.status,
                driver: driverId
                  ? drivers.find((driver) => driver.id === driverId) ?? order.driver
                  : null,
              }
            : order,
        ),
      );

      toast({
        title: "Order updated",
        description: "Order status and assignment saved.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update order.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-slate-600 dark:text-slate-300">
        No weekly orders yet.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((order) => {
        const selectedDriverId = order.driver?.id ?? "";
        const selectedStatus = order.status ?? "pending";
        return (
          <Card key={order.id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Order</p>
                <p className="text-lg font-semibold">{order.customer?.full_name ?? "Guest"}</p>
                <p className="text-sm text-slate-500">{order.customer?.email ?? "No email"}</p>
                <p className="text-sm text-slate-500">{order.customer?.phone ?? "No phone"}</p>
              </div>
              <div className="text-right">
                <Badge variant="outline">{selectedStatus}</Badge>
                <p className="mt-2 text-sm text-slate-500">
                  {order.package?.name ?? "Weekly package"} • {formatCurrency(order.total_amount_cents)}
                </p>
                <p className="text-xs text-slate-400">
                  {order.paid_at ? "Paid" : "Awaiting payment"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Delivery</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {formatAddress(order.delivery_address)}
                </p>
                <p className="text-xs text-slate-500">
                  Window: {order.delivery_window ?? "Not set"}
                </p>
                {order.delivery_instructions ? (
                  <p className="text-xs text-slate-500">
                    Instructions: {order.delivery_instructions}
                  </p>
                ) : null}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Assign driver</p>
                <select
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                  value={selectedDriverId}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item) =>
                        item.id === order.id
                          ? {
                              ...item,
                              driver: event.target.value
                                ? drivers.find((driver) => driver.id === event.target.value) ??
                                  item.driver
                                : null,
                            }
                          : item,
                      ),
                    )
                  }
                >
                  {driverOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
                <select
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                  value={selectedStatus}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item) =>
                        item.id === order.id
                          ? { ...item, status: event.target.value }
                          : item,
                      ),
                    )
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  className="mt-3 w-full"
                  disabled={savingId === order.id}
                  onClick={() => handleUpdate(order.id, selectedStatus, selectedDriverId)}
                >
                  {savingId === order.id ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
