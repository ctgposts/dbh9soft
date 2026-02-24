/**
 * Performance utilities for optimizing renders and API calls
 */

// Debounce function for search/filter operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for frequent events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoize expensive computations
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();

  return function executedFunction(...args: Parameters<T>) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  } as T;
}

// Batch state updates to reduce renders
export function batch(callback: () => void) {
  if (typeof callback === "function") {
    callback();
  }
}

// Image loading optimization
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

// Preload images for better UX
export function preloadImage(src: string) {
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "image";
  link.href = src;
  document.head.appendChild(link);
}

// Optimize list rendering with virtualization helpers
export function getVisibleRange(
  scrollTop: number,
  itemHeight: number,
  containerHeight: number
) {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  return {
    startIndex: Math.max(0, startIndex - 1),
    endIndex: startIndex + visibleCount + 1,
  };
}
