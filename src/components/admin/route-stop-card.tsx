"use client";

import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";
import type { RouteStop } from "@/components/admin/route-builder-types";

type RouteStopCardProps = {
  stop: RouteStop;
  index?: number;
  showIndex?: boolean;
  disabled?: boolean;
};

export function RouteStopCard({
  stop,
  index,
  showIndex = false,
  disabled = false,
}: RouteStopCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id, disabled: disabled || !stop.hasAddress });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm transition dark:border-slate-800 dark:bg-slate-950",
        isDragging && "ring-2 ring-blue-400 ring-offset-2",
        !stop.hasAddress && "opacity-60",
      )}
      role="article"
      aria-label={`Delivery stop for ${stop.name}${!stop.hasAddress ? " (missing address)" : ""}`}
    >
      <button
        type="button"
        className={cn(
          "mt-0.5 rounded-md p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:hover:text-slate-200",
          (disabled || !stop.hasAddress) && "cursor-not-allowed opacity-50",
        )}
        aria-label={`Drag ${stop.name} to reorder or move between lists. Use arrow keys to navigate, space to pick up and drop.`}
        {...attributes}
        {...listeners}
        disabled={disabled || !stop.hasAddress}
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {showIndex && typeof index === "number" ? `${index + 1}. ` : ""}
            {stop.name}
          </p>
          {!stop.hasAddress ? (
            <span className="text-xs font-semibold text-rose-600">Missing address</span>
          ) : null}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{stop.window}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{stop.address}</p>
      </div>
    </div>
  );
}
