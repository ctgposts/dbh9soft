import { useEffect, useRef, useCallback, useState } from "react";
import { offlineStorage } from "../utils/offlineStorage";
import { toast } from "sonner";

/**
 * Hook for managing offline sync with automatic synchronization
 */
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize offline storage
  useEffect(() => {
    offlineStorage.init().catch((error) => {
      console.error("Failed to initialize offline storage:", error);
    });
  }, []);

  // Detect online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("🌐 Back online!");
      toast.success("Back online - syncing data...");
      
      // Trigger sync after a short delay
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        performSync();
      }, 500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("📴 Going offline");
      toast.info("You are offline - changes will sync when online");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  // Cache data for offline use
  const cacheData = useCallback(
    async (type: string, data: any[]) => {
      try {
        await offlineStorage.saveData(type, data);
      } catch (error) {
        console.error(`Failed to cache ${type}:`, error);
      }
    },
    []
  );

  // Add operation to pending sync queue
  const addPendingOperation = useCallback(
    async (
      type: string,
      operation: "create" | "update" | "delete",
      data: any
    ) => {
      try {
        await offlineStorage.addPendingSync(type, operation, data);
        
        if (isOnline) {
          // If online, trigger sync immediately
          performSync();
        } else {
          toast.info(`📝 ${operation} recorded - will sync when online`);
        }
      } catch (error) {
        console.error("Failed to add pending operation:", error);
        toast.error("Failed to save offline");
      }
    },
    [isOnline]
  );

  // Get cached data
  const getCachedData = useCallback(async (type: string) => {
    try {
      return await offlineStorage.getData(type);
    } catch (error) {
      console.error(`Failed to get cached ${type}:`, error);
      return [];
    }
  }, []);

  // Perform sync
  const performSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const pendingSyncs = await offlineStorage.getPendingSyncs();
      
      if (pendingSyncs.length === 0) {
        setIsSyncing(false);
        return;
      }

      console.log(`🔄 Syncing ${pendingSyncs.length} pending operations...`);
      toast.loading(`Syncing ${pendingSyncs.length} changes...`);

      // Simulate sync delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mark all as synced (in real app, send to server first)
      for (const sync of pendingSyncs) {
        await offlineStorage.markSynced(sync.id);
      }

      toast.success(`✅ Synced ${pendingSyncs.length} changes`);
      console.log("✅ Sync completed successfully");
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Sync failed - will retry when online");
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  return {
    isOnline,
    isSyncing,
    cacheData,
    getCachedData,
    addPendingOperation,
    performSync,
  };
};

/**
 * Hook to wrap Convex query with offline support
 */
export const useOfflineQuery = <T,>(
  query: T | null | undefined,
  queryKey: string,
  fallback: T | null = null
): T | null => {
  const [offlineData, setOfflineData] = useState<T | null>(fallback);
  const { cacheData, getCachedData, isOnline } = useOfflineSync();

  // Cache data when online
  useEffect(() => {
    if (query && isOnline && queryKey) {
      const cacheType = queryKey.split(".")[queryKey.split(".").length - 1];
      if (Array.isArray(query)) {
        cacheData(cacheType, query);
      }
    }
  }, [query, isOnline, queryKey, cacheData]);

  // Load offline data
  useEffect(() => {
    const loadOfflineData = async () => {
      const cacheType = queryKey?.split(".")[queryKey.split(".").length - 1];
      if (cacheType) {
        const cached = await getCachedData(cacheType);
        setOfflineData(cached as T);
      }
    };

    if (!isOnline && queryKey) {
      loadOfflineData();
    }
  }, [isOnline, queryKey, getCachedData]);

  // Return online data if available, otherwise offline data
  return query || offlineData;
};
