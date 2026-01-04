"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { RouteBuilderMap } from "@/components/admin/route-builder-map";
import { RouteDetails } from "@/components/admin/route-details";
import { UnassignedStops } from "@/components/admin/unassigned-stops";
import type { DriverOption, RouteMetrics, RouteStop } from "@/components/admin/route-builder-types";
import { optimizeRoute } from "@/lib/maps/route-optimizer";
import { KITCHEN_ORIGIN } from "@/lib/maps/route";
import { Card } from "@/components/ui/card";

const DEFAULT_METRICS: RouteMetrics = {
  distanceMeters: 0,
  durationSeconds: 0,
};

type RouteBuilderWorkspaceProps = {
  weekOptions: string[];
  selectedWeek: string;
  unassignedStops: RouteStop[];
  driverOptions: DriverOption[];
  missingAddressCount: number;
};

type ContainerId = "unassigned" | "route";

export function RouteBuilderWorkspace({
  weekOptions,
  selectedWeek,
  unassignedStops: initialUnassignedStops,
  driverOptions,
  missingAddressCount,
}: RouteBuilderWorkspaceProps) {
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // Increased from 4px for better touch support
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const [isPending, startTransition] = useTransition();
  const [unassignedStops, setUnassignedStops] = useState<RouteStop[]>(initialUnassignedStops);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [routeName, setRouteName] = useState("Weekend Route");
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics>(DEFAULT_METRICS);
  const [polyline, setPolyline] = useState<string | null>(null);
  const [driverId, setDriverId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [optimized, setOptimized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedRouteId, setSavedRouteId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const mapAssignedStops = routeStops.filter((stop) => stop.hasAddress);
  const mapUnassignedStops = unassignedStops.filter((stop) => stop.hasAddress);

  const findContainer = (id: string): ContainerId | null => {
    if (id === "unassigned" || id === "route") {
      return id;
    }

    if (unassignedStops.some((stop) => stop.id === id)) {
      return "unassigned";
    }

    if (routeStops.some((stop) => stop.id === id)) {
      return "route";
    }

    return null;
  };

  const resetOptimization = () => {
    setOptimized(false);
    setPolyline(null);
    setRouteMetrics(DEFAULT_METRICS);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    // This helps with screen reader announcements
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));

    if (activeContainer && overContainer && activeContainer !== overContainer) {
      const activeStop = [...unassignedStops, ...routeStops].find(
        (stop) => stop.id === active.id,
      );
      if (activeStop) {
        const targetZone = overContainer === "route" ? "route stops" : "unassigned stops";
        setStatusMessage(`Moving ${activeStop.name} to ${targetZone}`);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));

    if (!activeContainer || !overContainer) {
      return;
    }

    if (activeContainer === overContainer) {
      if (activeContainer === "unassigned") {
        const oldIndex = unassignedStops.findIndex((stop) => stop.id === active.id);
        const newIndex = unassignedStops.findIndex((stop) => stop.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          setUnassignedStops((items) => arrayMove(items, oldIndex, newIndex));
          setStatusMessage("Reordered stops in unassigned list");
        }
        return;
      }

      const oldIndex = routeStops.findIndex((stop) => stop.id === active.id);
      const newIndex = routeStops.findIndex((stop) => stop.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setRouteStops((items) => arrayMove(items, oldIndex, newIndex));
        resetOptimization();
        const movedStop = routeStops[oldIndex];
        setStatusMessage(`Moved ${movedStop?.name ?? "stop"} to position ${newIndex + 1}`);
      }
      return;
    }

    const sourceItems = activeContainer === "unassigned" ? unassignedStops : routeStops;
    const destinationItems = overContainer === "unassigned" ? unassignedStops : routeStops;
    const activeIndex = sourceItems.findIndex((stop) => stop.id === active.id);

    if (activeIndex === -1) {
      return;
    }

    const activeStop = sourceItems[activeIndex];
    if (overContainer === "route" && !activeStop.hasAddress) {
      setStatusMessage("Add an address before assigning this stop to a route.");
      return;
    }

    const newSourceItems = [...sourceItems];
    newSourceItems.splice(activeIndex, 1);

    const overIndex = destinationItems.findIndex((stop) => stop.id === over.id);
    const newDestinationItems = [...destinationItems];
    const insertIndex = overIndex === -1 ? newDestinationItems.length : overIndex;
    newDestinationItems.splice(insertIndex, 0, activeStop);

    if (activeContainer === "unassigned") {
      setUnassignedStops(newSourceItems);
    } else {
      setRouteStops(newSourceItems);
    }

    if (overContainer === "unassigned") {
      setUnassignedStops(newDestinationItems);
      setStatusMessage(`Removed ${activeStop.name} from route`);
    } else {
      setRouteStops(newDestinationItems);
      resetOptimization();
      setStatusMessage(`Added ${activeStop.name} to route at position ${insertIndex + 1}`);
    }
  };

  const handleWeekChange = (value: string) => {
    startTransition(() => {
      router.replace(`/admin/routes/new?week_of=${value}`);
    });
  };

  const handleOptimize = async () => {
    if (routeStops.length < 2) {
      setStatusMessage("Add at least two stops to optimize the route.");
      return;
    }

    setStatusMessage("Optimizing route...");
    try {
      const result = await optimizeRoute(
        KITCHEN_ORIGIN,
        routeStops.map((stop) => ({ id: stop.id, address: stop.address })),
      );

      const stopMap = new Map(routeStops.map((stop) => [stop.id, stop]));
      const orderedStops = result.orderedStops
        .map((stop) => stopMap.get(stop.id))
        .filter((stop): stop is RouteStop => Boolean(stop));

      setRouteStops(orderedStops);
      setRouteMetrics({
        distanceMeters: result.totalDistanceMeters,
        durationSeconds: result.totalDurationSeconds,
      });
      setPolyline(result.polyline);
      setOptimized(true);
      setStatusMessage("Route optimized successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to optimize route.";
      setStatusMessage(message);
    }
  };

  const handleSaveRoute = async () => {
    if (!optimized) {
      setStatusMessage("Optimize the route before saving.");
      return;
    }

    if (routeStops.length === 0) {
      setStatusMessage("Add at least one stop to save a route.");
      return;
    }

    setIsSaving(true);
    setStatusMessage("Saving route...");

    try {
      const startDateTime = startTime
        ? new Date(`${selectedWeek}T${startTime}:00`)
        : null;

      const response = await fetch("/api/admin/routes/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_of: selectedWeek,
          name: routeName,
          optimize: false,
          driver_id: driverId || null,
          start_time: startDateTime ? startDateTime.toISOString() : null,
          stop_order: routeStops.map((stop, index) => ({
            appointment_id: stop.id,
            order: index + 1,
          })),
        }),
      });

      const payload = await response.json();
      if (!payload.ok) {
        setStatusMessage(payload.error?.message ?? "Unable to save route.");
        return;
      }

      setSavedRouteId(payload.data?.route?.id ?? null);
      setStatusMessage("Route saved and assigned.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save route.";
      setStatusMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!savedRouteId) {
      setStatusMessage("Save the route before exporting the PDF.");
      return;
    }

    setStatusMessage("Generating PDF...");

    try {
      const response = await fetch("/api/admin/routes/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_id: savedRouteId }),
      });

      if (!response.ok) {
        setStatusMessage("Unable to generate PDF.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `route-${savedRouteId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setStatusMessage("PDF exported successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to export PDF.";
      setStatusMessage(message);
    }
  };

  const missingAddressMessage = useMemo(() => {
    if (missingAddressCount <= 0) {
      return null;
    }
    return `${missingAddressCount} stops are missing addresses and cannot be assigned.`;
  }, [missingAddressCount]);

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Visual route builder
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drag stops into a route, optimize, and assign a driver.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex flex-col gap-1 font-semibold text-slate-500 dark:text-slate-400">
            Week of
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950"
              value={selectedWeek}
              onChange={(event) => handleWeekChange(event.target.value)}
              disabled={isPending}
            >
              {weekOptions.map((week) => (
                <option key={week} value={week}>
                  {week}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-semibold text-slate-500 dark:text-slate-400">
            Route name
            <input
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950"
              value={routeName}
              onChange={(event) => setRouteName(event.target.value)}
            />
          </label>
        </div>
      </Card>

      {missingAddressMessage ? (
        <p className="text-xs text-rose-600">{missingAddressMessage}</p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: {
            onDragStart({ active }) {
              const stop = [...unassignedStops, ...routeStops].find((s) => s.id === active.id);
              return `Picked up ${stop?.name ?? "stop"}. Use arrow keys to move, Space to drop.`;
            },
            onDragOver({ active, over }) {
              if (!over) return "";
              const stop = [...unassignedStops, ...routeStops].find((s) => s.id === active.id);
              const overContainer = findContainer(String(over.id));
              const targetZone = overContainer === "route" ? "route stops" : "unassigned stops";
              return `${stop?.name ?? "Stop"} is over ${targetZone}`;
            },
            onDragEnd({ active, over }) {
              if (!over) {
                const stop = [...unassignedStops, ...routeStops].find((s) => s.id === active.id);
                return `${stop?.name ?? "Stop"} was dropped. No changes made.`;
              }
              const stop = [...unassignedStops, ...routeStops].find((s) => s.id === active.id);
              return `${stop?.name ?? "Stop"} was moved successfully.`;
            },
            onDragCancel({ active }) {
              const stop = [...unassignedStops, ...routeStops].find((s) => s.id === active.id);
              return `Drag cancelled. ${stop?.name ?? "Stop"} was not moved.`;
            },
          },
        }}
      >
        <div
          className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_320px] md:grid-cols-1"
          role="region"
          aria-label="Route builder workspace"
        >
          <UnassignedStops stops={unassignedStops} />
          <Card className="space-y-4 p-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Route map</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assigned stops are numbered, unassigned stops are marked with U.
              </p>
            </div>
            <RouteBuilderMap
              assignedStops={mapAssignedStops}
              unassignedStops={mapUnassignedStops}
              polyline={polyline}
            />
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Origin: {KITCHEN_ORIGIN}
            </div>
          </Card>
          <RouteDetails
            stops={routeStops}
            metrics={routeMetrics}
            driverOptions={driverOptions}
            driverId={driverId}
            startTime={startTime}
            optimized={optimized}
            isSaving={isSaving}
            statusMessage={statusMessage}
            onDriverChange={setDriverId}
            onStartTimeChange={setStartTime}
            onOptimize={handleOptimize}
            onSave={handleSaveRoute}
            onExport={handleExport}
          />
        </div>
      </DndContext>
    </div>
  );
}
