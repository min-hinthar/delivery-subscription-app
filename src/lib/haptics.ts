/**
 * Haptic feedback utilities for mobile devices
 * Works on iOS Safari and Chrome Android
 */

function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shouldUseHaptics(): boolean {
  return canVibrate() && !prefersReducedMotion();
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return shouldUseHaptics();
}

/**
 * Trigger a light haptic feedback
 * Use for: Button taps, checkbox toggles, small interactions
 */
export function hapticLight() {
  if (shouldUseHaptics()) {
    navigator.vibrate(10);
  }
}

/**
 * Trigger a medium haptic feedback
 * Use for: Adding items to cart, form submissions, confirmations
 */
export function hapticMedium() {
  if (shouldUseHaptics()) {
    navigator.vibrate(20);
  }
}

/**
 * Trigger a heavy haptic feedback
 * Use for: Errors, warnings, important actions
 */
export function hapticHeavy() {
  if (shouldUseHaptics()) {
    navigator.vibrate(30);
  }
}

/**
 * Trigger a success haptic pattern
 * Use for: Successful order, payment confirmation, completion
 */
export function hapticSuccess() {
  if (shouldUseHaptics()) {
    navigator.vibrate([10, 50, 10]);
  }
}

/**
 * Trigger an error haptic pattern
 * Use for: Form errors, payment failures, unavailable items
 */
export function hapticError() {
  if (shouldUseHaptics()) {
    navigator.vibrate([50, 100, 50, 100, 50]);
  }
}

/**
 * Trigger a warning haptic pattern
 * Use for: Order deadline warnings, delivery delays
 */
export function hapticWarning() {
  if (shouldUseHaptics()) {
    navigator.vibrate([30, 100, 30]);
  }
}

/**
 * Trigger a selection change haptic (subtle)
 * Use for: Package selection, menu item selection
 */
export function hapticSelection() {
  if (shouldUseHaptics()) {
    navigator.vibrate(5);
  }
}
