import { useQuery as useConvexQuery } from "convex/react";
import { useMemo } from "react";

/**
 * Optimized hook for Convex queries with memoization
 * Prevents unnecessary re-renders when dependencies haven't changed
 */
export function useOptimizedQuery(queryFn: any, args: any, deps?: any[]) {
  const memoizedArgs = useMemo(() => args, deps || [JSON.stringify(args)]);
  return useConvexQuery(queryFn, memoizedArgs);
}
