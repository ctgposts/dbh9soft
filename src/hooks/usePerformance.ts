import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Phase 5: Performance Optimization Utilities
 * Lazy loading, memoization, debouncing for better mobile performance
 */

/**
 * Hook for lazy loading images
 */
export const useLazyLoadImage = (src: string, placeholder: string = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
  }, [src]);

  return { imageSrc, isLoaded };
};

/**
 * Hook for intersection observer (infinite scroll, lazy loading)
 */
export const useIntersectionObserver = (ref: React.RefObject<HTMLElement>, options?: IntersectionObserverInit) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, {
      threshold: 0.1,
      ...options,
    });

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
 * Hook for debouncing values (search, filters)
 */
export const useDebounce = <T,>(value: T, delay: number = 500): T => {
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
 * Hook for throttling callbacks
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 250
): ((...args: Parameters<T>) => void) => {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    },
    [callback, delay]
  );
};

/**
 * Hook for measuring render performance
 */
export const useRenderPerformance = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      console.log(`⏱️ ${componentName} rendered in ${(endTime - startTime).toFixed(2)}ms`);
    };
  }, [componentName]);
};

/**
 * Hook for detecting network connection
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [effectiveType, setEffectiveType] = useState<string>('4g');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setEffectiveType(connection.effectiveType);

      const handleChangeType = () => {
        setEffectiveType(connection.effectiveType);
      };

      connection.addEventListener('change', handleChangeType);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleChangeType);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, effectiveType };
};

/**
 * Hook for managing memory efficiently
 */
export const useMemoryOptimization = () => {
  useEffect(() => {
    // Cleanup interval
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMemory = memory.usedJSHeapSize / 1048576; // Convert to MB
        const maxMemory = memory.jsHeapSizeLimit / 1048576;
        const usagePercent = (usedMemory / maxMemory) * 100;

        console.log(
          `💾 Memory: ${usedMemory.toFixed(1)}MB / ${maxMemory.toFixed(1)}MB (${usagePercent.toFixed(1)}%)`
        );

        // Warning if memory usage is high
        if (usagePercent > 80) {
          console.warn('⚠️ High memory usage detected');
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);
};

/**
 * Hook for viewport information (responsive design)
 */
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 640,
    isTablet: window.innerWidth >= 640 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setViewport({
        width,
        height: window.innerHeight,
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    // Use throttle with proper typing
    let lastRun = Date.now();
    const throttledResize = () => {
      const now = Date.now();
      if (now - lastRun >= 250) {
        handleResize();
        lastRun = now;
      }
    };

    window.addEventListener('resize', throttledResize);

    return () => window.removeEventListener('resize', throttledResize);
  }, []);

  return viewport;
};

/**
 * Hook for local storage with auto-sync
 */
export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
};

/**
 * Hook for API call with caching
 */
export const useApiCache = (url: string, cacheDuration: number = 5 * 60 * 1000) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<{ data: any; timestamp: number } | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache
    if (cacheRef.current && Date.now() - cacheRef.current.timestamp < cacheDuration) {
      setData(cacheRef.current.data);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(url);
      const result = await response.json();
      
      cacheRef.current = {
        data: result,
        timestamp: Date.now(),
      };
      
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Return cached data if available
      if (cacheRef.current) {
        setData(cacheRef.current.data);
      }
    } finally {
      setLoading(false);
    }
  }, [url, cacheDuration]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for batch updates (reduces re-renders)
 */
export const useBatchState = <T extends Record<string, any>>(initialState: T) => {
  const [state, setState] = useState(initialState);
  const batchRef = useRef<Partial<T>>({});

  const updateBatch = useCallback((updates: Partial<T>) => {
    Object.assign(batchRef.current, updates);
  }, []);

  const flushBatch = useCallback(() => {
    if (Object.keys(batchRef.current).length > 0) {
      setState((prev) => ({ ...prev, ...batchRef.current }));
      batchRef.current = {};
    }
  }, []);

  return { state, updateBatch, flushBatch };
};

/**
 * Hook for measuring Core Web Vitals
 */
export const useWebVitals = (onMetric?: (metric: any) => void) => {
  useEffect(() => {
    // Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (onMetric) {
          onMetric({ name: 'LCP', value: entry.startTime });
        }
      }
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          if (onMetric) {
            onMetric({ name: 'CLS', value: clsValue });
          }
        }
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    return () => {
      observer.disconnect();
      clsObserver.disconnect();
    };
  }, [onMetric]);
};

export default {
  useLazyLoadImage,
  useIntersectionObserver,
  useDebounce,
  useThrottle,
  useRenderPerformance,
  useNetworkStatus,
  useMemoryOptimization,
  useViewport,
  useLocalStorage,
  useApiCache,
  useBatchState,
  useWebVitals,
};
