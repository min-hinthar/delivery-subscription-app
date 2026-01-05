import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  hapticError,
  hapticLight,
  hapticMedium,
  hapticSelection,
  hapticSuccess,
  hapticWarning,
  isHapticSupported,
} from "./haptics";

describe("haptics", () => {
  const originalVibrate = navigator.vibrate;
  const originalMatchMedia = window.matchMedia;

  const setMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, "matchMedia", {
      value: vi.fn().mockImplementation(() => ({
        matches,
        media: "(prefers-reduced-motion: reduce)",
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

  beforeEach(() => {
    vi.restoreAllMocks();
    setMatchMedia(false);
  });

  afterEach(() => {
    Object.defineProperty(navigator, "vibrate", {
      value: originalVibrate,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, "matchMedia", {
      value: originalMatchMedia,
      configurable: true,
      writable: true,
    });
  });

  it("reports support when vibrate is available", () => {
    Object.defineProperty(navigator, "vibrate", {
      value: vi.fn(),
      configurable: true,
      writable: true,
    });

    expect(isHapticSupported()).toBe(true);
  });

  it("skips haptic calls when vibrate is unavailable", () => {
    Object.defineProperty(navigator, "vibrate", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    expect(isHapticSupported()).toBe(false);
    expect(() => hapticLight()).not.toThrow();
    expect(() => hapticMedium()).not.toThrow();
    expect(() => hapticSuccess()).not.toThrow();
    expect(() => hapticError()).not.toThrow();
    expect(() => hapticWarning()).not.toThrow();
    expect(() => hapticSelection()).not.toThrow();
  });

  it("fires vibration patterns when supported", () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      configurable: true,
      writable: true,
    });

    hapticLight();
    hapticMedium();
    hapticSuccess();

    expect(vibrate).toHaveBeenCalledWith(10);
    expect(vibrate).toHaveBeenCalledWith(20);
    expect(vibrate).toHaveBeenCalledWith([10, 50, 10]);
  });

  it("skips haptics when prefers-reduced-motion is enabled", () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      configurable: true,
      writable: true,
    });
    setMatchMedia(true);

    hapticLight();
    hapticMedium();

    expect(isHapticSupported()).toBe(false);
    expect(vibrate).not.toHaveBeenCalled();
  });
});
