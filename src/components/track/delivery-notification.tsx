"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Package, TruckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = "status-change" | "eta-update" | "driver-nearby" | "delivered";

export type DeliveryNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
};

type DeliveryNotificationProps = {
  notification: DeliveryNotification;
  onDismiss: () => void;
};

const NOTIFICATION_ICONS = {
  "status-change": Package,
  "eta-update": Clock,
  "driver-nearby": TruckIcon,
  "delivered": CheckCircle2,
};

const NOTIFICATION_STYLES = {
  "status-change": "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200",
  "eta-update": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
  "driver-nearby": "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
  "delivered": "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200",
};

export function DeliveryNotificationToast({
  notification,
  onDismiss,
}: DeliveryNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slide in animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for slide-out animation
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const Icon = NOTIFICATION_ICONS[notification.type];
  const styles = NOTIFICATION_STYLES[notification.type];

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300",
        styles,
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{notification.title}</p>
        <p className="mt-0.5 text-xs opacity-90">{notification.message}</p>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300);
        }}
        className="shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

type NotificationContainerProps = {
  notifications: DeliveryNotification[];
  onDismiss: (id: string) => void;
};

export function DeliveryNotificationContainer({
  notifications,
  onDismiss,
}: NotificationContainerProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-end gap-2 px-4 sm:px-6">
      {notifications.map((notification) => (
        <DeliveryNotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={() => onDismiss(notification.id)}
        />
      ))}
    </div>
  );
}
