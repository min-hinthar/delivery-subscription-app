export type NotificationSettings = {
  enabled: boolean;
  etaThresholdMinutes: number;
  dndStart: string;
  dndEnd: string;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  etaThresholdMinutes: 10,
  dndStart: "21:00",
  dndEnd: "07:00",
};

const STORAGE_KEY = "trackingNotificationSettings";

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<NotificationSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowserNotificationSupported()) {
    return "denied";
  }

  if (Notification.permission !== "default") {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
}

export function isWithinDoNotDisturb(settings: NotificationSettings, now: Date = new Date()): boolean {
  const start = parseTimeToMinutes(settings.dndStart);
  const end = parseTimeToMinutes(settings.dndEnd);
  const current = now.getHours() * 60 + now.getMinutes();

  if (start === end) {
    return false;
  }

  if (start < end) {
    return current >= start && current < end;
  }

  return current >= start || current < end;
}

export function canSendBrowserNotification(settings: NotificationSettings): boolean {
  return (
    settings.enabled &&
    isBrowserNotificationSupported() &&
    Notification.permission === "granted" &&
    !isWithinDoNotDisturb(settings)
  );
}

export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions,
): Notification | null {
  if (!isBrowserNotificationSupported() || Notification.permission !== "granted") {
    return null;
  }

  return new Notification(title, options);
}
