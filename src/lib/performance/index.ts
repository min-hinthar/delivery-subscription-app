/**
 * Performance utilities for React components
 * Provides helpers for optimization and lazy loading
 */

import { lazy, ComponentType } from "react";

/**
 * Creates a lazy-loaded component with better error handling
 * @param importFn - Dynamic import function
 * @param options - Optional configuration
 * @returns Lazy-loaded component
 */
export function lazyLoad<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    retries?: number;
    retryDelay?: number;
  }
) {
  const { retries = 3, retryDelay = 1000 } = options || {};

  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let attempt = 0;

      const tryImport = () => {
        importFn()
          .then(resolve)
          .catch((error) => {
            attempt++;
            if (attempt < retries) {
              setTimeout(tryImport, retryDelay * attempt);
            } else {
              reject(error);
            }
          });
      };

      tryImport();
    });
  });
}

/**
 * Preloads a component to improve perceived performance
 * @param importFn - Dynamic import function
 */
export function preloadComponent(importFn: () => Promise<unknown>) {
  importFn().catch(() => {
    // Silently fail - preload is optional
  });
}

/**
 * Debounce function for performance optimization
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for performance optimization
 * @param fn - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: never[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Checks if the user prefers reduced motion
 * @returns true if prefers-reduced-motion is set
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Lazy loads an image with intersection observer
 * @param src - Image source URL
 * @returns Promise that resolves when image is loaded
 */
export function lazyLoadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}
