import React, { Suspense, ComponentType, ReactNode } from "react";

interface LazyComponentProps {
  fallback?: ReactNode;
  errorBoundary?: boolean;
}

/**
 * Lazy load a component with automatic code splitting
 * @example
 * const Dashboard = lazyImport(() => import('./Dashboard'));
 * 
 * <Suspense fallback={<Loading />}>
 *   <Dashboard />
 * </Suspense>
 */
export function lazyImport<P extends object>(
  factory: () => Promise<{ default: ComponentType<P> }>
): ComponentType<P> {
  return React.lazy(factory);
}

/**
 * Wrapper component for lazy loaded components with loading state
 */
export const LazyBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback = <LazyLoadingFallback /> }) => (
  <Suspense fallback={fallback}>{children}</Suspense>
);

/**
 * Default loading fallback component
 */
export const LazyLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-white">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-600 font-medium">লোডিং হচ্ছে...</p>
      <p className="text-sm text-gray-400 mt-2">একটু অপেক্ষা করুন</p>
    </div>
  </div>
);

/**
 * Preload a lazy component for faster rendering
 */
export function preloadComponent<P extends object>(
  factory: () => Promise<{ default: ComponentType<P> }>
): void {
  factory().catch((error) => {
    console.warn("Failed to preload component:", error);
  });
}

/**
 * Create a route-based lazy loaded component
 */
export function createLazyRoute<P extends object>(
  importPath: string,
  displayName: string
): ComponentType<P> {
  const Component = React.lazy(() =>
    import(`${importPath}`).then((module) => ({
      default: module.default || module[displayName],
    }))
  );

  (Component as any).displayName = `Lazy(${displayName})`;
  return Component;
}

/**
 * Batch preload multiple components
 */
export async function preloadComponents(
  factories: Array<() => Promise<any>>
): Promise<void> {
  await Promise.allSettled(factories.map((factory) => factory()));
}
