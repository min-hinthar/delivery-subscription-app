import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EtaDisplay } from "@/components/track/eta-display";
import { DeliveryTimeline } from "@/components/track/delivery-timeline";

describe("Tracking components", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-04T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders ETA display with progress", () => {
    render(
      <EtaDisplay
        estimatedArrival="2026-01-04T10:15:00Z"
        totalStops={5}
        completedStops={2}
        currentStopIndex={2}
        lastUpdated={new Date("2026-01-04T10:00:00Z")}
      />,
    );

    expect(screen.getByText(/arriving in 15 minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/stop 3 of 5/i)).toBeInTheDocument();
    expect(screen.getByText(/40% route complete/i)).toBeInTheDocument();
  });

  it("renders timeline statuses", () => {
    render(
      <DeliveryTimeline
        currentStopIndex={1}
        stops={[
          {
            id: "stop-1",
            appointmentId: "appointment-1",
            stopOrder: 1,
            status: "completed",
            estimatedArrival: "2026-01-04T09:45:00Z",
            completedAt: "2026-01-04T09:46:00Z",
            lat: null,
            lng: null,
            isCustomerStop: false,
          },
          {
            id: "stop-2",
            appointmentId: "appointment-2",
            stopOrder: 2,
            status: "in_progress",
            estimatedArrival: "2026-01-04T10:10:00Z",
            completedAt: null,
            lat: null,
            lng: null,
            isCustomerStop: true,
          },
        ]}
      />,
    );

    expect(screen.getByText("Delivery timeline")).toBeInTheDocument();
    expect(screen.getByText("Your delivery")).toBeInTheDocument();
    expect(screen.getByText(/delivered/i)).toBeInTheDocument();
  });
});
