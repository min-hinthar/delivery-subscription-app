import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { InstallPrompt } from "./install-prompt";

const setMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: "(display-mode: standalone)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    configurable: true,
    writable: true,
  });
};

describe("InstallPrompt", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    setMatchMedia(false);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(window, "matchMedia", {
      value: originalMatchMedia,
      configurable: true,
      writable: true,
    });
  });

  it("shows the install prompt after the delay", async () => {
    render(<InstallPrompt />);

    const event = new Event("beforeinstallprompt");
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });

    window.dispatchEvent(event);

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByText("Install Mandalay Star")).toBeInTheDocument();
  });

  it("respects the dismissal window", async () => {
    const recentDismissal = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem("pwa-install-dismissed", recentDismissal);

    render(<InstallPrompt />);

    const event = new Event("beforeinstallprompt");
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });

    window.dispatchEvent(event);

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.queryByText("Install Mandalay Star")).not.toBeInTheDocument();
  });

  it("handles storage errors gracefully", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage disabled");
    });

    render(<InstallPrompt />);

    const event = new Event("beforeinstallprompt");
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });

    window.dispatchEvent(event);

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByText("Install Mandalay Star")).toBeInTheDocument();
  });

  it("stores dismissal timestamp when dismissed", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    render(<InstallPrompt />);

    const event = new Event("beforeinstallprompt");
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });

    window.dispatchEvent(event);

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    fireEvent.click(screen.getByRole("button", { name: /not now/i }));

    expect(setItemSpy).toHaveBeenCalledWith(
      "pwa-install-dismissed",
      expect.any(String),
    );
  });
});
