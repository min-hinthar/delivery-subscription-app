import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DeliveryNotificationToast,
  DeliveryNotificationContainer,
  type DeliveryNotification,
} from "../delivery-notification";

describe("DeliveryNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DeliveryNotificationToast", () => {
    it("should render notification with title and message", () => {
      const notification: DeliveryNotification = {
        id: "test-1",
        type: "status-change",
        title: "Delivery Updated",
        message: "Your delivery is on the way",
        timestamp: new Date(),
      };

      const onDismiss = vi.fn();

      render(<DeliveryNotificationToast notification={notification} onDismiss={onDismiss} />);

      expect(screen.getByText("Delivery Updated")).toBeInTheDocument();
      expect(screen.getByText("Your delivery is on the way")).toBeInTheDocument();
    });

    it("should call onDismiss when close button is clicked", async () => {
      const user = userEvent.setup();
      const notification: DeliveryNotification = {
        id: "test-2",
        type: "delivered",
        title: "Delivered",
        message: "Package delivered",
        timestamp: new Date(),
      };

      const onDismiss = vi.fn();

      render(<DeliveryNotificationToast notification={notification} onDismiss={onDismiss} />);

      const closeButton = screen.getByRole("button", { name: /dismiss/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalled();
      });
    });

    it("should auto-dismiss after 5 seconds", async () => {
      vi.useFakeTimers();

      const notification: DeliveryNotification = {
        id: "test-3",
        type: "driver-nearby",
        title: "Driver Nearby",
        message: "Driver is 2 minutes away",
        timestamp: new Date(),
      };

      const onDismiss = vi.fn();

      render(<DeliveryNotificationToast notification={notification} onDismiss={onDismiss} />);

      // Fast-forward 5 seconds + animation time
      vi.advanceTimersByTime(5300);

      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });

    it("should render different icons for different notification types", () => {
      const types: Array<DeliveryNotification["type"]> = [
        "status-change",
        "eta-update",
        "driver-nearby",
        "delivered",
      ];

      types.forEach((type) => {
        const notification: DeliveryNotification = {
          id: `test-${type}`,
          type,
          title: "Test",
          message: "Test message",
          timestamp: new Date(),
        };

        const { container } = render(
          <DeliveryNotificationToast notification={notification} onDismiss={vi.fn()} />,
        );

        // Each type should have an icon
        const icon = container.querySelector("svg");
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe("DeliveryNotificationContainer", () => {
    it("should render multiple notifications", () => {
      const notifications: DeliveryNotification[] = [
        {
          id: "notif-1",
          type: "status-change",
          title: "Update 1",
          message: "Message 1",
          timestamp: new Date(),
        },
        {
          id: "notif-2",
          type: "delivered",
          title: "Update 2",
          message: "Message 2",
          timestamp: new Date(),
        },
      ];

      const onDismiss = vi.fn();

      render(<DeliveryNotificationContainer notifications={notifications} onDismiss={onDismiss} />);

      expect(screen.getByText("Update 1")).toBeInTheDocument();
      expect(screen.getByText("Update 2")).toBeInTheDocument();
    });

    it("should not render when notifications array is empty", () => {
      const { container } = render(
        <DeliveryNotificationContainer notifications={[]} onDismiss={vi.fn()} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should call onDismiss with correct notification id", async () => {
      const user = userEvent.setup();
      const notifications: DeliveryNotification[] = [
        {
          id: "notif-to-dismiss",
          type: "status-change",
          title: "Test",
          message: "Test message",
          timestamp: new Date(),
        },
      ];

      const onDismiss = vi.fn();

      render(<DeliveryNotificationContainer notifications={notifications} onDismiss={onDismiss} />);

      const closeButton = screen.getByRole("button", { name: /dismiss/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledWith("notif-to-dismiss");
      });
    });
  });
});
