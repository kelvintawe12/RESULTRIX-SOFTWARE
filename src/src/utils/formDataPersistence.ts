/**
 * Form Data Persistence
 * Automatically saves form data to prevent loss on refresh, errors, or navigation
 */

import { useState, useEffect } from 'react';
import { cacheService } from '../services/cacheService';

export interface FormDataPersisted<T> {
  data: T;
  lastSaved: number;
  formKey: string;
}

class FormDataPersistence {
  private saveTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private static instance: FormDataPersistence;

  private constructor() {}

  static getInstance(): FormDataPersistence {
    if (!FormDataPersistence.instance) {
      FormDataPersistence.instance = new FormDataPersistence();
    }
    return FormDataPersistence.instance;
  }

  /**
   * Auto-save form data with debouncing
   */
  autoSave<T>(formKey: string, data: T, delay: number = 1000): void {
    // Clear existing timeout for this form
    const existingTimeout = this.saveTimeouts.get(formKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.save(formKey, data);
    }, delay);

    this.saveTimeouts.set(formKey, timeout);
  }

  /**
   * Save form data immediately
   */
  save<T>(formKey: string, data: T): void {
    const formData: FormDataPersisted<T> = {
      data,
      lastSaved: Date.now(),
      formKey
    };
    cacheService.setPermanent(`form-${formKey}`, formData);
  }

  /**
   * Load form data
   */
  load<T>(formKey: string): T | null {
    const formData = cacheService.getPermanent<FormDataPersisted<T>>(`form-${formKey}`);
    return formData?.data || null;
  }

  /**
   * Clear form data
   */
  clear(formKey: string): void {
    cacheService.removePermanent(`form-${formKey}`);
    const timeout = this.saveTimeouts.get(formKey);
    if (timeout) {
      clearTimeout(timeout);
      this.saveTimeouts.delete(formKey);
    }
  }

  /**
   * Check if form has saved data
   */
  hasData(formKey: string): boolean {
    return this.load(formKey) !== null;
  }

  /**
   * Get last saved time
   */
  getLastSaved(formKey: string): number | null {
    const formData = cacheService.getPermanent<FormDataPersisted<any>>(`form-${formKey}`);
    return formData?.lastSaved || null;
  }

  /**
   * Clear all form data
   */
  clearAll(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith('edumaster-permanent-form-'))
      .forEach(key => {
        cacheService.removePermanent(key.replace('edumaster-permanent-', ''));
      });
    
    // Clear all timeouts
    this.saveTimeouts.forEach(timeout => clearTimeout(timeout));
    this.saveTimeouts.clear();
  }
}

export const formDataPersistence = FormDataPersistence.getInstance();

/**
 * React Hook for form data persistence
 */
export function useFormDataPersistence<T>(formKey: string, initialData: T) {
  const [data, setData] = useState<T>(() => {
    // Load saved data on mount
    const saved = formDataPersistence.load<T>(formKey);
    return saved !== null ? saved : initialData;
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  useEffect(() => {
    setHasUnsavedChanges(JSON.stringify(data) !== JSON.stringify(initialData));
  }, [data, initialData]);

  const saveData = (newData: T) => {
    setData(newData);
    formDataPersistence.save(formKey, newData);
    setLastSaved(Date.now());
    setHasUnsavedChanges(false);
  };

  const autoSave = (newData: T) => {
    setData(newData);
    formDataPersistence.autoSave(formKey, newData);
    setHasUnsavedChanges(true);
  };

  const clearData = () => {
    formDataPersistence.clear(formKey);
    setData(initialData);
    setHasUnsavedChanges(false);
    setLastSaved(null);
  };

  const restoreData = () => {
    const saved = formDataPersistence.load<T>(formKey);
    if (saved !== null) {
      setData(saved);
      setLastSaved(formDataPersistence.getLastSaved(formKey));
    }
    return saved;
  };

  return {
    data,
    setData: autoSave,
    save: saveData,
    clear: clearData,
    restore: restoreData,
    hasUnsavedChanges,
    lastSaved,
    canRestore: formDataPersistence.hasData(formKey)
  };
}