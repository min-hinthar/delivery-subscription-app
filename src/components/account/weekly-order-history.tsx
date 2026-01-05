"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export type WeeklyOrderHistoryItem = {
  id: string;
  status: string | null;
  created_at: string;
  delivery_window: string | null;
  weekly_menu: {
    id: string;
    week_start_date: string | null;
    delivery_date: string | null;
  } | null;
  package: {
    id: string;
    name: string | null;
    price_cents: number | null;
  } | null;
};

type WeeklyOrderHistoryProps = {
  orders: WeeklyOrderHistoryItem[];
  currentMenuId: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function WeeklyOrderHistory({ orders, currentMenuId }: WeeklyOrderHistoryProps) {
  const [items, setItems] = useState(orders);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const canReorder = Boolean(currentMenuId);

  const emptyState = useMemo(
    () => (
      <Card className="p-6 text-center text-sm text-slate-600 dark:text-slate-300">
        No weekly orders yet.
      </Card>
    ),
    [],
  );

  const handleCancel = async (orderId: string) => {
    setSavingId(orderId);
    try {
      const response = await fetch("/api/orders/weekly/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Unable to cancel order.");
      }

      setItems((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: payload.data.order.status } : order,
        ),
      );

      toast({
        title: "Order cancelled",
        description: "Your weekly order has been cancelled.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to cancel order.";
      toast({ title: "Cancel failed", description: message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  if (!items.length) {
    return emptyState;
  }

  return (
    <div className="space-y-4">
      {items.map((order) => {
        const status = order.status ?? "pending";
        const weekLabel = order.weekly_menu?.week_start_date
          ? `Week of ${formatDate(order.weekly_menu.week_start_date)}`
          : "Weekly menu";
        const deliveryDate = formatDate(order.weekly_menu?.delivery_date ?? null);
        const packageId = order.package?.id ?? null;
        return (
          <Card key={order.id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{weekLabel}</p>
                <p className="text-lg font-semibold">{order.package?.name ?? "Package"}</p>
                <p className="text-sm text-slate-500">
                  Delivery {deliveryDate} • Window {order.delivery_window ?? "TBD"}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="outline">{status}</Badge>
                <p className="mt-2 text-sm text-slate-500">
                  Ordered {formatDate(order.created_at)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {canReorder && packageId ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push(`/checkout/weekly?menu=${currentMenuId}&package=${packageId}`)
                  }
                >
                  Reorder this package
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => router.push("/menu/weekly")}>
                  Browse weekly menu
                </Button>
              )}
              {status === "pending" ? (
                <Button
                  variant="ghost"
                  onClick={() => handleCancel(order.id)}
                  disabled={savingId === order.id}
                >
                  {savingId === order.id ? "Cancelling..." : "Cancel order"}
                </Button>
              ) : null}
              <Button variant="ghost" onClick={() => router.push("/track")}>
                Track delivery
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
