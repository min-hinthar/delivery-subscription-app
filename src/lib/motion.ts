export const MOTION_EASE = "easeOut";
export const MOTION_DURATION = 0.2;

export function getMotionTransition(shouldReduceMotion: boolean) {
  return shouldReduceMotion
    ? { duration: 0 }
    : { duration: MOTION_DURATION, ease: MOTION_EASE };
}

export function getFadeMotion(
  shouldReduceMotion: boolean,
  options?: { enterY?: number; exitY?: number },
) {
  const enterY = options?.enterY ?? 6;
  const exitY = options?.exitY ?? -6;

  return {
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: enterY },
    animate: { opacity: 1, y: 0 },
    exit: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: exitY },
  };
}

export function getSlideMotion(shouldReduceMotion: boolean, distance = 24) {
  return {
    initial: shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: distance },
    animate: { opacity: 1, x: 0 },
    exit: shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: distance },
  };
}
