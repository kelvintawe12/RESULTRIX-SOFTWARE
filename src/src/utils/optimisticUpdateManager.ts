/**
 * Optimistic Update Manager
 * Allows for optimistic UI updates with rollback on failure
 * Prevents data loss during API operations
 */

import { cacheService } from '../services/cacheService';

export interface OptimisticUpdate<T> {
  optimisticData: T;
  originalData: T;
  timestamp: number;
}

class OptimisticUpdateManager {
  private static instance: OptimisticUpdateManager;

  private constructor() {}

  static getInstance(): OptimisticUpdateManager {
    if (!OptimisticUpdateManager.instance) {
      OptimisticUpdateManager.instance = new OptimisticUpdateManager();
    }
    return OptimisticUpdateManager.instance;
  }

  /**
   * Start optimistic update
   */
  start<T>(key: string, originalData: T, optimisticData: T): void {
    const update: OptimisticUpdate<T> = {
      optimisticData,
      originalData,
      timestamp: Date.now()
    };
    cacheService.set(`optimistic-${key}`, update, 60000); // 1 minute TTL
  }

  /**
   * Commit optimistic update (success)
   */
  commit<T>(key: string, finalData?: T): void {
    cacheService.delete(`optimistic-${key}`);
  }

  /**
   * Rollback optimistic update (failure)
   */
  rollback<T>(key: string): T | null {
    const update = cacheService.get<OptimisticUpdate<T>>(`optimistic-${key}`);
    if (update) {
      cacheService.delete(`optimistic-${key}`);
      return update.originalData;
    }
    return null;
  }

  /**
   * Get optimistic data
   */
  get<T>(key: string): T | null {
    const update = cacheService.get<OptimisticUpdate<T>>(`optimistic-${key}`);
    return update ? update.optimisticData : null;
  }

  /**
   * Check if update is in progress
   */
  isInProgress(key: string): boolean {
    return cacheService.get(`optimistic-${key}`) !== null;
  }
}

export const optimisticUpdateManager = OptimisticUpdateManager.getInstance();