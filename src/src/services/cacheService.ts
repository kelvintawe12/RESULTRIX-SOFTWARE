/**
 * Cache Service
 * In-memory and localStorage-based caching to reduce API calls and improve performance
 * Ensures data persistence and prevents data loss
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string; // Data version for cache invalidation
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private static instance: CacheService;
  private cacheVersion: string = '1.0';

  private constructor() {
    // Initialize cache from localStorage
    this.loadFromStorage();
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', this.handleStorageEvent);
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Handle storage events from other tabs
   */
  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key && event.key.startsWith('edumaster-cache-')) {
      // Invalidate memory cache if storage was updated
      const cacheKey = event.key.replace('edumaster-cache-', '');
      this.memoryCache.delete(cacheKey);
    }
  };

  /**
   * Get data from cache (memory first, then localStorage)
   */
  get<T>(key: string): T | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data as T;
    }

    // Check localStorage cache
    try {
      const storageKey = this.getStorageKey(key);
      const storageValue = localStorage.getItem(storageKey);
      if (storageValue) {
        const entry: CacheEntry<T> = JSON.parse(storageValue);
        if (this.isValid(entry)) {
          // Also add to memory cache
          this.memoryCache.set(key, entry);
          return entry.data;
        }
        // Remove expired entry
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Error reading from cache storage:', error);
    }

    return null;
  }

  /**
   * Set data in cache (both memory and localStorage)
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Default TTL: 5 minutes
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: this.cacheVersion
    };

    // Set in memory cache
    this.memoryCache.set(key, entry);

    // Set in localStorage for persistence
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.error('Error writing to cache storage:', error);
      // If localStorage is full, try to clear expired entries first
      this.clearExpired();
      try {
        localStorage.setItem(storageKey, JSON.stringify(entry));
      } catch (retryError) {
        console.error('Still unable to write to cache storage:', retryError);
      }
    }
  }

  /**
   * Remove specific entry from cache
   */
  delete(key: string): void {
    this.memoryCache.delete(key);
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error deleting from cache storage:', error);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    try {
      // Clear all cache-related localStorage items
      Object.keys(localStorage)
        .filter(key => key.startsWith('edumaster-cache-'))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing cache storage:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): void {
    // Clear memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear localStorage cache
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('edumaster-cache-'))
        .forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const entry = JSON.parse(value);
              if (!this.isValid(entry)) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // Invalid entry, remove it
            localStorage.removeItem(key);
          }
        });
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  private isValid(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  /**
   * Generate localStorage key for cache entry
   */
  private getStorageKey(key: string): string {
    return `edumaster-cache-${key}`;
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('edumaster-cache-'))
        .forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const entry = JSON.parse(value);
              const cacheKey = key.replace('edumaster-cache-', '');
              if (this.isValid(entry)) {
                this.memoryCache.set(cacheKey, entry);
              } else {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // Invalid entry, remove it
            localStorage.removeItem(key);
          }
        });
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { memorySize: number; storageSize: number; entries: number } {
    const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('edumaster-cache-'));
    return {
      memorySize: this.memoryCache.size,
      storageSize: storageKeys.length,
      entries: this.memoryCache.size + storageKeys.length
    };
  }

  /**
   * Persist critical data permanently (no expiration)
   */
  setPermanent<T>(key: string, data: T): void {
    try {
      localStorage.setItem(`edumaster-permanent-${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        version: this.cacheVersion
      }));
    } catch (error) {
      console.error('Error saving permanent data:', error);
    }
  }

  /**
   * Get permanent data
   */
  getPermanent<T>(key: string): T | null {
    try {
      const value = localStorage.getItem(`edumaster-permanent-${key}`);
      if (value) {
        const parsed = JSON.parse(value);
        return parsed.data as T;
      }
    } catch (error) {
      console.error('Error reading permanent data:', error);
    }
    return null;
  }

  /**
   * Remove permanent data
   */
  removePermanent(key: string): void {
    try {
      localStorage.removeItem(`edumaster-permanent-${key}`);
    } catch (error) {
      console.error('Error removing permanent data:', error);
    }
  }

  /**
   * Clear all permanent data
   */
  clearPermanent(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('edumaster-permanent-'))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing permanent data:', error);
    }
  }
}

export const cacheService = CacheService.getInstance();

/**
 * Cache decorator for functions
 * Caches function results based on arguments
 */
export function withCache<T extends (...args: any[]) => any>(
  fn: T,
  keyPrefix: string,
  ttl: number = 5 * 60 * 1000
): T {
  return (async (...args: any[]) => {
    // Generate cache key from function name and arguments
    const cacheKey = `${keyPrefix}-${JSON.stringify(args)}`;
    
    // Try to get from cache
    const cached = cacheService.get(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function and cache result
    const result = await fn(...args);
    cacheService.set(cacheKey, result, ttl);
    
    return result;
  }) as T;
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCache(pattern: string): void {
  const memoryKeys = Array.from(cacheService['memoryCache'].keys());
  
  memoryKeys
    .filter(key => key.includes(pattern))
    .forEach(key => cacheService.delete(key));
}