import { render, screen, within } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";

import { RouteDetails } from "@/components/admin/route-details";
import { UnassignedStops } from "@/components/admin/unassigned-stops";
import type { RouteStop } from "@/components/admin/route-builder-types";

const sampleStops: RouteStop[] = [
  {
    id: "stop-1",
    name: "Jordan Lee",
    address: "123 Main St, Covina, CA 91723",
    window: "Saturday 9:00–12:00",
    day: "Saturday",
    postalCode: "91723",
    hasAddress: true,
  },
  {
    id: "stop-2",
    name: "Avery Smith",
    address: "456 Oak Ave, Covina, CA 91723",
    window: "Saturday 12:00–2:00",
    day: "Saturday",
    postalCode: "91723",
    hasAddress: true,
  },
];

describe("Route builder panels", () => {
  it("renders unassigned stops panel", () => {
    render(
      <DndContext>
        <UnassignedStops stops={sampleStops} />
      </DndContext>,
    );

    expect(screen.getByText("Unassigned stops")).toBeInTheDocument();
    expect(
      screen.getByText(/2 of 2 stops are waiting to be assigned/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
  });

  it("renders route details metrics and actions", () => {
    render(
      <DndContext>
        <RouteDetails
          stops={sampleStops}
          metrics={{ distanceMeters: 8046, durationSeconds: 3600 }}
          driverOptions={[{ id: "driver-1", name: "Taylor Driver" }]}
          driverId=""
          startTime=""
          optimized={true}
          isSaving={false}
          statusMessage={null}
          onDriverChange={() => undefined}
          onStartTimeChange={() => undefined}
          onOptimize={() => undefined}
          onSave={() => undefined}
          onExport={() => undefined}
        />
      </DndContext>,
    );

    expect(screen.getByText("Route details")).toBeInTheDocument();
    const metricsGroup = screen.getByRole("group", { name: /route metrics/i });
    expect(within(metricsGroup).getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save route/i })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /export route as pdf/i }),
    ).toBeEnabled();
  });
});
