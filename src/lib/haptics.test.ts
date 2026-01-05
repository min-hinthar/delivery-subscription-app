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

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "vibrate", {
      value: originalVibrate,
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
});
