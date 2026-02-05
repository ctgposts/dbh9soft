/**
 * Performance Monitoring & Analytics
 * Tracks Core Web Vitals, page load times, and user interactions
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  FCP?: number; // First Contentful Paint

  // Navigation timing
  pageLoadTime?: number;
  domInteractiveTime?: number;
  firstPaintTime?: number;

  // Resource timing
  resourceCount?: number;
  totalResourceSize?: number;

  // Custom metrics
  routeChangeTime?: number;
  dataFetchTime?: number;

  timestamp: number;
  url: string;
  userAgent: string;
}

const metrics: PerformanceMetrics[] = [];

/**
 * Initialize Core Web Vitals monitoring
 */
export function initPerformanceMonitoring(): void {
  if (!("web-vital" in navigator) && typeof window !== "undefined") {
    // Monitor LCP (Largest Contentful Paint)
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          recordMetric({
            LCP: lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime,
          });
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        console.warn("LCP monitoring not supported");
      }

      // Monitor CLS (Cumulative Layout Shift)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              recordMetric({
                CLS: (entry as any).value,
              });
            }
          }
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
      } catch (e) {
        console.warn("CLS monitoring not supported");
      }

      // Monitor FCP (First Contentful Paint)
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            recordMetric({
              FCP: entry.startTime,
            });
          }
        });
        fcpObserver.observe({ entryTypes: ["paint"] });
      } catch (e) {
        console.warn("FCP monitoring not supported");
      }
    }

    // Monitor page load time
    window.addEventListener("load", () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domInteractiveTime = perfData.domInteractive - perfData.navigationStart;
      const firstPaintTime = perfData.responseStart - perfData.navigationStart;

      recordMetric({
        pageLoadTime,
        domInteractiveTime,
        firstPaintTime,
        TTFB: perfData.responseStart - perfData.navigationStart,
      });

      // Log resource timing
      const resources = performance.getEntriesByType("resource");
      recordMetric({
        resourceCount: resources.length,
        totalResourceSize: resources.reduce((sum, r: any) => sum + (r.transferSize || 0), 0),
      });
    });
  }
}

/**
 * Track route change time
 */
export function trackRouteChange(duration: number): void {
  recordMetric({ routeChangeTime: duration });
}

/**
 * Track data fetch time
 */
export function trackDataFetch(duration: number): void {
  recordMetric({ dataFetchTime: duration });
}

/**
 * Record a custom metric
 */
function recordMetric(metric: Partial<PerformanceMetrics>): void {
  const currentMetric: PerformanceMetrics = {
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...metric,
  };

  metrics.push(currentMetric);

  // Keep only last 100 metrics
  if (metrics.length > 100) {
    metrics.shift();
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log("📊 Performance Metric:", currentMetric);
  }
}

/**
 * Get all recorded metrics
 */
export function getMetrics(): PerformanceMetrics[] {
  return [...metrics];
}

/**
 * Get average metrics
 */
export function getAverageMetrics(): Partial<PerformanceMetrics> {
  if (metrics.length === 0) return {};

  const keys: (keyof PerformanceMetrics)[] = [
    "LCP",
    "FID",
    "CLS",
    "TTFB",
    "FCP",
    "pageLoadTime",
    "domInteractiveTime",
    "firstPaintTime",
    "routeChangeTime",
    "dataFetchTime",
  ];

  const averages: Partial<PerformanceMetrics> = {};

  keys.forEach((key) => {
    const values = metrics
      .map((m) => m[key])
      .filter((v) => v !== undefined) as number[];

    if (values.length > 0) {
      (averages as Record<string, number>)[key] = values.reduce((a, b) => a + b, 0) / values.length;
    }
  });

  return averages;
}

/**
 * Clear metrics history
 */
export function clearMetrics(): void {
  metrics.length = 0;
}

/**
 * Export metrics as JSON
 */
export function exportMetrics(): string {
  return JSON.stringify(getMetrics(), null, 2);
}

/**
 * Send metrics to analytics server
 */
export async function sendMetricsToAnalytics(endpoint: string): Promise<void> {
  const metricsData = {
    metrics: getMetrics(),
    averages: getAverageMetrics(),
    timestamp: Date.now(),
  };

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metricsData),
    });
  } catch (error) {
    console.error("Failed to send metrics:", error);
  }
}

/**
 * Performance check - determines if app is performing well
 */
export function performanceCheck(): {
  status: "good" | "fair" | "poor";
  issues: string[];
} {
  const averages = getAverageMetrics();
  const issues: string[] = [];

  // Check LCP (should be < 2.5s)
  if (averages.LCP && averages.LCP > 2500) {
    issues.push("Largest Contentful Paint (LCP) is slow");
  }

  // Check CLS (should be < 0.1)
  if (averages.CLS && averages.CLS > 0.1) {
    issues.push("Cumulative Layout Shift (CLS) is high");
  }

  // Check page load time (should be < 3s)
  if (averages.pageLoadTime && averages.pageLoadTime > 3000) {
    issues.push("Page load time is slow");
  }

  // Check FCP (should be < 1.8s)
  if (averages.FCP && averages.FCP > 1800) {
    issues.push("First Contentful Paint (FCP) is slow");
  }

  let status: "good" | "fair" | "poor" = "good";
  if (issues.length > 2) {
    status = "poor";
  } else if (issues.length > 0) {
    status = "fair";
  }

  return { status, issues };
}

/**
 * React Hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  return {
    trackRouteChange,
    trackDataFetch,
    getMetrics,
    getAverageMetrics,
    performanceCheck,
    exportMetrics,
    clearMetrics,
  };
}
