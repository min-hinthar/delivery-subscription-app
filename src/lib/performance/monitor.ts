/**
 * Performance monitoring utilities for tracking Core Web Vitals and custom metrics
 */

export type PerformanceMetric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
};

export type MetricCallback = (metric: PerformanceMetric) => void;

// Core Web Vitals thresholds
const CWV_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(
  metricName: keyof typeof CWV_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = CWV_THRESHOLDS[metricName];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Core Web Vitals metrics
 * Usage: reportWebVitals(console.log) or reportWebVitals(sendToAnalytics)
 */
export function reportWebVitals(onPerfEntry?: MetricCallback) {
  if (onPerfEntry && typeof window !== 'undefined') {
    import('web-vitals').then(({ onCLS, onFCP, onFID, onLCP, onTTFB, onINP }) => {
      onCLS((metric) => {
        onPerfEntry({
          name: 'CLS',
          value: metric.value,
          rating: getRating('CLS', metric.value),
          delta: metric.delta,
          id: metric.id,
        });
      });
      onFCP((metric) => {
        onPerfEntry({
          name: 'FCP',
          value: metric.value,
          rating: getRating('FCP', metric.value),
          delta: metric.delta,
          id: metric.id,
        });
      });
      onFID((metric) => {
        onPerfEntry({
          name: 'FID',
          value: metric.value,
          rating: getRating('FID', metric.value),
          delta: metric.delta,
          id: metric.id,
        });
      });
      onLCP((metric) => {
        onPerfEntry({
          name: 'LCP',
          value: metric.value,
          rating: getRating('LCP', metric.value),
          delta: metric.delta,
          id: metric.id,
        });
      });
      onTTFB((metric) => {
        onPerfEntry({
          name: 'TTFB',
          value: metric.value,
          rating: getRating('TTFB', metric.value),
          delta: metric.delta,
          id: metric.id,
        });
      });
      onINP((metric) => {
        onPerfEntry({
          name: 'INP',
          value: metric.value,
          rating: getRating('INP', metric.value),
          delta: metric.delta,
          id: metric.id,
        });
      });
    });
  }
}

/**
 * Measure custom performance metrics
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  start(markName: string) {
    if (typeof window !== 'undefined' && window.performance) {
      this.marks.set(markName, performance.now());
      performance.mark(`${markName}-start`);
    }
  }

  /**
   * End timing an operation and return the duration
   */
  end(markName: string): number | null {
    if (typeof window !== 'undefined' && window.performance) {
      const startTime = this.marks.get(markName);
      if (!startTime) {
        console.warn(`No start mark found for: ${markName}`);
        return null;
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      performance.mark(`${markName}-end`);
      try {
        performance.measure(markName, `${markName}-start`, `${markName}-end`);
      } catch (e) {
        // Silently ignore if marks don't exist
      }

      this.marks.delete(markName);
      return duration;
    }
    return null;
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(markName: string, fn: () => T | Promise<T>): Promise<T> {
    this.start(markName);
    try {
      const result = await fn();
      const duration = this.end(markName);
      if (duration !== null && process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${markName}: ${duration.toFixed(2)}ms`);
      }
      return result;
    } catch (error) {
      this.end(markName);
      throw error;
    }
  }

  /**
   * Get all performance entries for a specific name
   */
  getEntries(name: string): PerformanceEntry[] {
    if (typeof window !== 'undefined' && window.performance) {
      return performance.getEntriesByName(name);
    }
    return [];
  }

  /**
   * Clear all marks and measures
   */
  clear() {
    if (typeof window !== 'undefined' && window.performance) {
      this.marks.clear();
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Track long tasks (tasks that take > 50ms)
 */
export function observeLongTasks(callback: (entries: PerformanceEntry[]) => void) {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ entryTypes: ['longtask'] });
      return () => observer.disconnect();
    } catch (e) {
      console.warn('Long task observation not supported');
    }
  }
  return () => {};
}

/**
 * Track layout shifts
 */
export function observeLayoutShifts(callback: (entries: PerformanceEntry[]) => void) {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      return () => observer.disconnect();
    } catch (e) {
      console.warn('Layout shift observation not supported');
    }
  }
  return () => {};
}

/**
 * Log performance metric to console in development
 */
export function logMetric(metric: PerformanceMetric) {
  if (process.env.NODE_ENV === 'development') {
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(
      `${emoji} ${metric.name}: ${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'} (${metric.rating})`
    );
  }
}
