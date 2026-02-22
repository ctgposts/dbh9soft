/**
 * Performance monitoring utilities
 */

export interface PerformanceMetrics {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
}

const metrics: PerformanceMetrics[] = [];

/**
 * Measure performance of a function
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  const metric: PerformanceMetrics = {
    name,
    duration,
    startTime,
    endTime,
  };

  metrics.push(metric);

  // Log in development
  if (import.meta.env.DEV) {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Async version of performance measurement
 */
export async function measurePerformanceAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  const metric: PerformanceMetrics = {
    name,
    duration,
    startTime,
    endTime,
  };

  metrics.push(metric);

  if (import.meta.env.DEV) {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Get all collected metrics
 */
export function getMetrics(): PerformanceMetrics[] {
  return [...metrics];
}

/**
 * Clear metrics
 */
export function clearMetrics() {
  metrics.length = 0;
}

/**
 * Report performance to server (optional)
 */
export function reportPerformance(endpoint: string) {
  if (metrics.length === 0) return;

  const report = {
    metrics,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  };

  // Use navigator.sendBeacon for reliable delivery
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, JSON.stringify(report));
  } else {
    // Fallback to fetch
    fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(report),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {
      // Silently fail if reporting doesn't work
    });
  }
}

/**
 * Monitor Core Web Vitals
 */
export function monitorWebVitals() {
  // Check if the API is available
  if ("PerformanceObserver" in window) {
    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (import.meta.env.DEV) {
          console.log("[WebVitals] LCP:", lastEntry.renderTime || lastEntry.loadTime);
        }
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (e) {
      // Observer not available
    }

    // Cumulative Layout Shift (CLS)
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let cls = 0;
        for (const entry of list.getEntries()) {
          if ((entry as any).hadRecentInput) continue;
          cls += (entry as any).value;
        }
        if (import.meta.env.DEV) {
          console.log("[WebVitals] CLS:", cls);
        }
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (e) {
      // Observer not available
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (import.meta.env.DEV) {
            console.log("[WebVitals] FID:", (entry as any).processingDuration);
          }
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
    } catch (e) {
      // Observer not available
    }
  }
}

// Auto-enable in production
if (import.meta.env.PROD) {
  monitorWebVitals();
}
