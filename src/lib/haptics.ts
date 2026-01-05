/**
 * Haptic feedback utilities for mobile devices
 * Works on iOS Safari and Chrome Android
 */

function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return canVibrate();
}

/**
 * Trigger a light haptic feedback
 * Use for: Button taps, checkbox toggles, small interactions
 */
export function hapticLight() {
  if (canVibrate()) {
    navigator.vibrate(10);
  }
}

/**
 * Trigger a medium haptic feedback
 * Use for: Adding items to cart, form submissions, confirmations
 */
export function hapticMedium() {
  if (canVibrate()) {
    navigator.vibrate(20);
  }
}

/**
 * Trigger a heavy haptic feedback
 * Use for: Errors, warnings, important actions
 */
export function hapticHeavy() {
  if (canVibrate()) {
    navigator.vibrate(30);
  }
}

/**
 * Trigger a success haptic pattern
 * Use for: Successful order, payment confirmation, completion
 */
export function hapticSuccess() {
  if (canVibrate()) {
    navigator.vibrate([10, 50, 10]);
  }
}

/**
 * Trigger an error haptic pattern
 * Use for: Form errors, payment failures, unavailable items
 */
export function hapticError() {
  if (canVibrate()) {
    navigator.vibrate([50, 100, 50, 100, 50]);
  }
}

/**
 * Trigger a warning haptic pattern
 * Use for: Order deadline warnings, delivery delays
 */
export function hapticWarning() {
  if (canVibrate()) {
    navigator.vibrate([30, 100, 30]);
  }
}

/**
 * Trigger a selection change haptic (subtle)
 * Use for: Package selection, menu item selection
 */
export function hapticSelection() {
  if (canVibrate()) {
    navigator.vibrate(5);
  }
}
