/**
 * Cache Service - Offline Data Management
 * Handles localStorage and IndexedDB caching for instant data loading
 */

const DB_NAME = "DBH_Store";
const DB_VERSION = 1;
const STORE_NAME = "cache";

let db: IDBDatabase | null = null;

// Initialize IndexedDB
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("ttl", "ttl", { unique: false });
      }
    };
  });
}

// Cache data with TTL
export async function setCache(
  key: string,
  value: any,
  ttlMinutes: number = 30
): Promise<void> {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const ttl = Date.now() + ttlMinutes * 60 * 1000;

    const request = store.put({
      key,
      value,
      timestamp: Date.now(),
      ttl,
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Get cached data
export async function getCache(key: string): Promise<any | null> {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result;
      if (!result) {
        resolve(null);
        return;
      }

      // Check if expired
      if (result.ttl && Date.now() > result.ttl) {
        deleteCache(key);
        resolve(null);
        return;
      }

      resolve(result.value);
    };
  });
}

// Delete cached data
export async function deleteCache(key: string): Promise<void> {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Clear all cache
export async function clearAllCache(): Promise<void> {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Get cache size
export async function getCacheSize(): Promise<number> {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      let size = 0;
      (request.result as any[]).forEach((item) => {
        size += JSON.stringify(item).length;
      });
      resolve(size);
    };
  });
}

// Clean expired cache
export async function cleanExpiredCache(): Promise<void> {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("ttl");
    const range = IDBKeyRange.upperBound(Date.now());
    const request = index.openCursor(range);

    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
  });
}

// Service Worker communication for cache management
export function registerServiceWorkerCacheHandlers(): void {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.ready.then((registration) => {
    // Periodically clean expired cache
    setInterval(() => {
      cleanExpiredCache().catch(console.error);
    }, 60 * 1000); // Every minute

    // Clear API cache on demand
    window.addEventListener("online", () => {
      if (registration.active) {
        registration.active.postMessage({ action: "clearCache" });
      }
    });
  });
}

// Batch cache operations
export async function batchSetCache(
  items: Array<{ key: string; value: any; ttlMinutes?: number }>
): Promise<void> {
  await Promise.all(
    items.map((item) =>
      setCache(item.key, item.value, item.ttlMinutes)
    )
  );
}

// Get multiple cache items
export async function batchGetCache(keys: string[]): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  
  for (const key of keys) {
    results[key] = await getCache(key);
  }
  
  return results;
}

// Export cache data as JSON
export async function exportCacheData(): Promise<string> {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve(JSON.stringify(request.result, null, 2));
    };
  });
}

// Import cache data from JSON
export async function importCacheData(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData);
  await batchSetCache(
    data.map((item: any) => ({
      key: item.key,
      value: item.value,
      ttlMinutes: 30,
    }))
  );
}
