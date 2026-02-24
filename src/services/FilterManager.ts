/**
 * ফিল্টার পার্সিস্টেন্স ম্যানেজার
 * localStorage এ সংরক্ষিত ফিল্টার প্রিসেট পরিচালনা করুন
 */

export interface StoredFilter {
  id: string;
  name: string;
  createdAt: Date;
  filters: Record<string, any>;
}

const STORAGE_KEY = 'staffPortalFilters';
const MAX_SAVED_FILTERS = 10;

export class FilterManager {
  /**
   * সব সংরক্ষিত ফিল্টার পান
   */
  static getAllFilters(): StoredFilter[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored) as StoredFilter[];
      // তারিখ স্ট্রিং থেকে Date অবজেক্টে রূপান্তর করুন
      return parsed.map((f) => ({
        ...f,
        createdAt: new Date(f.createdAt),
      }));
    } catch (error) {
      console.error('ফিল্টার লোড করতে ব্যর্থ:', error);
      return [];
    }
  }

  /**
   * একটি ফিল্টার প্রিসেট সংরক্ষণ করুন
   */
  static saveFilter(name: string, filters: Record<string, any>): StoredFilter {
    const existing = this.getAllFilters();

    // সর্বোচ্চ সীমা চেক করুন
    if (existing.length >= MAX_SAVED_FILTERS) {
      // সবচেয়ে পুরনো সরান
      existing.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      existing.shift();
    }

    const newFilter: StoredFilter = {
      id: `filter-${Date.now()}`,
      name,
      createdAt: new Date(),
      filters,
    };

    const updated = [...existing, newFilter];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return newFilter;
  }

  /**
   * একটি ফিল্টার প্রিসেট পান
   */
  static getFilter(filterId: string): StoredFilter | null {
    const filters = this.getAllFilters();
    return filters.find((f) => f.id === filterId) || null;
  }

  /**
   * একটি ফিল্টার প্রিসেট মুছুন
   */
  static deleteFilter(filterId: string): boolean {
    const filters = this.getAllFilters();
    const updated = filters.filter((f) => f.id !== filterId);

    if (updated.length === filters.length) {
      return false; // খুঁজে পাওয়া যায়নি
    }

    if (updated.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    return true;
  }

  /**
   * একটি ফিল্টার প্রিসেট আপডেট করুন
   */
  static updateFilter(
    filterId: string,
    updates: Partial<StoredFilter>
  ): StoredFilter | null {
    const filters = this.getAllFilters();
    const index = filters.findIndex((f) => f.id === filterId);

    if (index === -1) return null;

    filters[index] = {
      ...filters[index],
      ...updates,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    return filters[index];
  }

  /**
   * সব ফিল্টার মুছুন
   */
  static clearAllFilters(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * ফিল্টার নাম পরিবর্তন করুন
   */
  static renameFilter(filterId: string, newName: string): StoredFilter | null {
    return this.updateFilter(filterId, { name: newName });
  }

  /**
   * সর্বশেষ ব্যবহৃত ফিল্টার সংরক্ষণ করুন
   */
  static saveLastUsedFilter(filters: Record<string, any>): void {
    localStorage.setItem(
      'lastUsedFilter',
      JSON.stringify({
        filters,
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * সর্বশেষ ব্যবহৃত ফিল্টার পান
   */
  static getLastUsedFilter(): Record<string, any> | null {
    try {
      const stored = localStorage.getItem('lastUsedFilter');
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return parsed.filters || null;
    } catch (error) {
      console.error('সর্বশেষ ফিল্টার লোড করতে ব্যর্থ:', error);
      return null;
    }
  }

  /**
   * ফিল্টার প্রিসেট সংখ্যা পান
   */
  static getFilterCount(): number {
    return this.getAllFilters().length;
  }

  /**
   * ফিল্টার একটি JSON স্ট্রিং হিসাবে রপ্তানি করুন
   */
  static exportFilters(): string {
    const filters = this.getAllFilters();
    return JSON.stringify(filters, null, 2);
  }

  /**
   * ফিল্টার JSON থেকে আমদানি করুন
   */
  static importFilters(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString) as StoredFilter[];

      // ভ্যালিডেশন
      if (!Array.isArray(imported)) {
        console.error('ইনপুট একটি অ্যারে হওয়া উচিত');
        return false;
      }

      // বিদ্যমান ফিল্টার মার্জ করুন
      const existing = this.getAllFilters();
      const merged = [...existing, ...imported];

      // সর্বোচ্চ সীমা প্রয়োগ করুন
      merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const limited = merged.slice(0, MAX_SAVED_FILTERS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
      return true;
    } catch (error) {
      console.error('ফিল্টার আমদানি করতে ব্যর্থ:', error);
      return false;
    }
  }

  /**
   * সংরক্ষণের আকার বাইটে পান (চেক করার জন্য)
   */
  static getStorageSize(): number {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? stored.length : 0;
  }

  /**
   * সংরক্ষণের শতাংশ ব্যবহার পান
   */
  static getStoragePercentage(): number {
    // localStorage এর আনুমানিক সীমা: 5-10MB (বাইটে)
    const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB
    const used = this.getStorageSize();
    return (used / STORAGE_LIMIT) * 100;
  }

  /**
   * ফিল্টার ডাটাবেস স্বাস্থ্য পরীক্ষা করুন
   */
  static healthCheck(): {
    isHealthy: boolean;
    filterCount: number;
    storageUsedBytes: number;
    storagePercentage: number;
    lastError?: string;
  } {
    try {
      const filters = this.getAllFilters();
      const storageSize = this.getStorageSize();

      return {
        isHealthy: storageSize < 5 * 1024 * 1024, // 5MB থেকে কম
        filterCount: filters.length,
        storageUsedBytes: storageSize,
        storagePercentage: this.getStoragePercentage(),
      };
    } catch (error) {
      return {
        isHealthy: false,
        filterCount: 0,
        storageUsedBytes: 0,
        storagePercentage: 0,
        lastError: String(error),
      };
    }
  }
}
