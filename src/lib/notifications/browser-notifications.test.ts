import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import {
  isWithinDoNotDisturb,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  canSendBrowserNotification,
  sendBrowserNotification,
  type NotificationSettings,
} from "@/lib/notifications/browser-notifications";

describe("isWithinDoNotDisturb", () => {
  it("handles overnight DnD (21:00-07:00)", () => {
    const settings: NotificationSettings = {
      enabled: true,
      etaThresholdMinutes: 10,
      dndStart: "21:00",
      dndEnd: "07:00",
    };

    expect(isWithinDoNotDisturb(settings, new Date("2026-01-04T22:00:00"))).toBe(true);
    expect(isWithinDoNotDisturb(settings, new Date("2026-01-04T06:00:00"))).toBe(true);
    expect(isWithinDoNotDisturb(settings, new Date("2026-01-04T12:00:00"))).toBe(false);
  });
});

describe("notification settings + permissions", () => {
  const defaultSettings: NotificationSettings = {
    enabled: false,
    etaThresholdMinutes: 10,
    dndStart: "21:00",
    dndEnd: "07:00",
  };

  let originalNotification: typeof Notification | undefined;

  beforeEach(() => {
    window.localStorage.clear();
    originalNotification = globalThis.Notification;
  });

  afterEach(() => {
    window.localStorage.clear();
    if (originalNotification) {
      globalThis.Notification = originalNotification;
    } else {
      // @ts-expect-error - clearing mock Notification
      delete globalThis.Notification;
    }
  });

  it("returns defaults when window is unavailable", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error - simulate non-browser environment
    globalThis.window = undefined;

    expect(getNotificationSettings()).toEqual(defaultSettings);

    globalThis.window = originalWindow;
  });

  it("returns defaults when localStorage is empty or invalid", () => {
    expect(getNotificationSettings()).toEqual(defaultSettings);

    window.localStorage.setItem("trackingNotificationSettings", "not-json");
    expect(getNotificationSettings()).toEqual(defaultSettings);
  });

  it("merges stored settings with defaults", () => {
    window.localStorage.setItem(
      "trackingNotificationSettings",
      JSON.stringify({ enabled: true, etaThresholdMinutes: 5 }),
    );

    expect(getNotificationSettings()).toEqual({
      ...defaultSettings,
      enabled: true,
      etaThresholdMinutes: 5,
    });
  });

  it("persists settings to localStorage", () => {
    saveNotificationSettings({ ...defaultSettings, enabled: true });
    expect(window.localStorage.getItem("trackingNotificationSettings")).toContain("\"enabled\":true");
  });

  it("handles notification permission requests", async () => {
    class MockNotification {
      static permission: NotificationPermission = "default";
      static async requestPermission() {
        MockNotification.permission = "granted";
        return MockNotification.permission;
      }
      constructor() {}
    }
    globalThis.Notification = MockNotification as unknown as typeof Notification;

    const permission = await requestNotificationPermission();
    expect(permission).toBe("granted");

    const second = await requestNotificationPermission();
    expect(second).toBe("granted");
  });

  it("evaluates whether browser notifications can be sent", () => {
    class MockNotification {
      static permission: NotificationPermission = "granted";
      constructor() {}
    }
    globalThis.Notification = MockNotification as unknown as typeof Notification;

    const settings: NotificationSettings = {
      enabled: true,
      etaThresholdMinutes: 5,
      dndStart: "09:00",
      dndEnd: "10:00",
    };

    expect(canSendBrowserNotification(settings)).toBe(true);
    expect(
      canSendBrowserNotification({ ...settings, enabled: false }),
    ).toBe(false);
  });

  it("returns null when sending is unavailable", () => {
    // @ts-expect-error - ensure Notification missing
    delete globalThis.Notification;
    expect(sendBrowserNotification("Test")).toBeNull();
  });

  it("returns a Notification instance when allowed", () => {
    class MockNotification {
      static permission: NotificationPermission = "granted";
      title: string;
      options?: NotificationOptions;
      constructor(title: string, options?: NotificationOptions) {
        this.title = title;
        this.options = options;
      }
    }
    globalThis.Notification = MockNotification as unknown as typeof Notification;

    const notification = sendBrowserNotification("Hello", { body: "World" });
    expect(notification).toBeInstanceOf(MockNotification);
  });
});
