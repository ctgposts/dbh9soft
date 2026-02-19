/**
 * Offline Storage Manager
 * Handles IndexedDB operations for offline-first architecture
 */

const DB_NAME = "DBH_STORE";
const DB_VERSION = 1;

export interface OfflineData {
  id: string;
  type: "product" | "customer" | "sale" | "employee" | "category";
  data: any;
  timestamp: number;
  synced: boolean;
}

class OfflineStorageManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log("✅ IndexedDB initialized");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for different data types
        const stores = [
          "products",
          "customers",
          "sales",
          "employees",
          "categories",
          "pendingSync",
        ];

        stores.forEach((store) => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: "id" });
          }
        });
      };
    });
  }

  async saveData(
    type: string,
    data: any[],
    timestamp: number = Date.now()
  ): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([type], "readwrite");
      const store = transaction.objectStore(type);

      // Clear existing data
      store.clear();

      // Add new data
      data.forEach((item) => {
        store.add({
          id: item._id || item.id || `${type}-${Date.now()}`,
          data: item,
          timestamp,
          type,
          synced: true,
        });
      });

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => {
        console.log(`✅ Saved ${data.length} ${type} offline`);
        resolve();
      };
    });
  }

  async getData(type: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([type], "readonly");
      const store = transaction.objectStore(type);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const items = (request.result as OfflineData[]).map((item) => item.data);
        resolve(items);
      };
    });
  }

  async addPendingSync(type: string, operation: "create" | "update" | "delete", data: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pendingSync"], "readwrite");
      const store = transaction.objectStore("pendingSync");

      const syncRecord = {
        id: `${type}-${operation}-${Date.now()}-${Math.random()}`,
        type,
        operation,
        data,
        timestamp: Date.now(),
        synced: false,
      };

      const request = store.add(syncRecord);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`📝 Added pending sync: ${type} - ${operation}`);
        resolve();
      };
    });
  }

  async getPendingSyncs(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pendingSync"], "readonly");
      const store = transaction.objectStore("pendingSync");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const pending = (request.result as OfflineData[]).filter((item) => !item.synced);
        resolve(pending);
      };
    });
  }

  async markSynced(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pendingSync"], "readwrite");
      const store = transaction.objectStore("pendingSync");
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          item.synced = true;
          store.put(item);
        }
      };

      transaction.oncomplete = () => resolve();
    });
  }

  async clearPendingSyncs(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pendingSync"], "readwrite");
      const store = transaction.objectStore("pendingSync");
      store.clear();

      transaction.oncomplete = () => {
        console.log("✅ Cleared pending syncs");
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const offlineStorage = new OfflineStorageManager();
