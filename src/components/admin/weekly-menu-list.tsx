"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type WeeklyMenuSummary = {
  id: string;
  week_start_date: string | null;
  status: string | null;
  order_deadline: string | null;
  delivery_date: string | null;
  template?: { name?: string | null } | null;
};

type WeeklyMenuListProps = {
  menus: WeeklyMenuSummary[];
};

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function WeeklyMenuList({ menus }: WeeklyMenuListProps) {
  const [items, setItems] = useState(menus);
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleStatusChange = async (menuId: string, nextStatus: string) => {
    setSavingId(menuId);
    try {
      const response = await fetch("/api/admin/menus/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekly_menu_id: menuId, status: nextStatus }),
      });

      const payload = await response.json();

      if (response.ok) {
        setItems((prev) =>
          prev.map((menu) =>
            menu.id === menuId ? { ...menu, status: payload.data.menu.status } : menu,
          ),
        );
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent weekly menus</h2>
        <Badge variant="secondary">{items.length} generated</Badge>
      </div>
      <div className="mt-4 space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-600">No menus generated yet.</p>
        ) : (
          items.map((menu) => {
            const isPublished = menu.status === "published";
            const nextStatus = isPublished ? "draft" : "published";
            return (
              <div key={menu.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {menu.template?.name ?? "Weekly menu"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Week of {formatDate(menu.week_start_date)} • Delivery {formatDate(menu.delivery_date)}
                  </p>
                  <p className="text-xs text-slate-500">Deadline {formatDate(menu.order_deadline)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{menu.status ?? "draft"}</Badge>
                  <Link href={`/admin/menus/${menu.id}/orders`}>
                    <Button size="sm" variant="ghost">
                      View orders
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant={isPublished ? "secondary" : "default"}
                    onClick={() => handleStatusChange(menu.id, nextStatus)}
                    disabled={savingId === menu.id}
                  >
                    {savingId === menu.id
                      ? "Saving..."
                      : isPublished
                      ? "Unpublish"
                      : "Publish"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
