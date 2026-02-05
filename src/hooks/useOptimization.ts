import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';

/**
 * Debounce hook for search and filter operations
 */
export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttle hook for scroll and resize events
 */
export const useThrottle = <T>(value: T, interval: number = 500): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now >= lastUpdated.current + interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const handler = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval);
      return () => clearTimeout(handler);
    }
  }, [value, interval]);

  return throttledValue;
};

/**
 * Memoize expensive computations with size limit
 */
export const useMemoWithLimit = <T>(factory: () => T, deps: React.DependencyList, limit: number = 100): T => {
  const cacheRef = useRef<Map<string, { value: T; timestamp: number }>>(new Map());
  const keyRef = useRef<string>(JSON.stringify(deps));

  return useMemo(() => {
    const key = JSON.stringify(deps);
    const cache = cacheRef.current;

    if (cache.has(key)) {
      return cache.get(key)!.value;
    }

    const value = factory();

    // Implement cache size limit with LRU eviction
    if (cache.size >= limit) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      
      for (const [k, v] of cache.entries()) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    cache.set(key, { value, timestamp: Date.now() });
    return value;
  }, deps);
};

/**
 * Virtual scroll container for large lists
 */
export const useVirtualScroll = (itemCount: number, itemHeight: number, containerHeight: number) => {
  const [scrollOffset, setScrollOffset] = useState(0);

  const startIndex = Math.floor(scrollOffset / itemHeight);
  const endIndex = Math.min(itemCount, Math.ceil((scrollOffset + containerHeight) / itemHeight));

  const handleScroll = useCallback((offset: number) => {
    setScrollOffset(offset);
  }, []);

  return {
    startIndex,
    endIndex,
    handleScroll,
    visibleRange: endIndex - startIndex,
    offsetY: startIndex * itemHeight,
  };
};

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (ref: React.RefObject<HTMLElement>, options = {}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return isVisible;
};

/**
 * Batch state updates to reduce renders
 */
export const useBatchState = <T>(initialState: T) => {
  const [state, setState] = useState<T>(initialState);
  const batchUpdates = useRef<Partial<T>>({});
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setBatchState = useCallback((updates: Partial<T>) => {
    batchUpdates.current = { ...batchUpdates.current, ...updates };

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, ...batchUpdates.current }));
      batchUpdates.current = {};
    }, 16); // ~60fps
  }, []);

  return [state, setBatchState] as const;
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitoring = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      console.log(`[Performance] ${componentName} rendered in ${(endTime - startTime).toFixed(2)}ms`);
    };
  }, [componentName]);
};
