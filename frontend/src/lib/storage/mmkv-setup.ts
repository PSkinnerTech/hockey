import { MMKV } from 'react-native-mmkv';

// Storage instances for different purposes
const defaultStorage = new MMKV();
const secureStorage = new MMKV({ id: 'secure-storage', encryptionKey: 'smart-hockey-coach' });
const cacheStorage = new MMKV({ id: 'cache-storage' });
const mlStorage = new MMKV({ id: 'ml-storage' });

/**
 * Storage keys constants
 */
export const StorageKeys = {
  // User
  USER_DATA: 'user_data',
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',

  // Sessions
  SESSIONS: 'sessions',
  CURRENT_SESSION: 'current_session',
  SESSION_DRAFTS: 'session_drafts',

  // ML Models
  MODEL_METADATA: 'model_metadata',
  MODEL_CACHE: 'model_cache',
  INFERENCE_HISTORY: 'inference_history',

  // App State
  APP_STATE: 'app_state',
  THEME: 'theme',
  ONBOARDING_COMPLETE: 'onboarding_complete',

  // Performance
  PERFORMANCE_METRICS: 'performance_metrics',
  CRASH_LOGS: 'crash_logs',
} as const;

/**
 * Type-safe storage wrapper
 */
export class TypedStorage {
  private storage: MMKV;

  constructor(storage: MMKV = defaultStorage) {
    this.storage = storage;
  }

  /**
   * Set a value with JSON serialization
   */
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      this.storage.set(key, serialized);
    } catch (error) {
      console.error(`Failed to set value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value with JSON deserialization
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const value = this.storage.getString(key);
      if (value === undefined) {
        return defaultValue;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to get value for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.storage.contains(key);
  }

  /**
   * Delete a key
   */
  delete(key: string): void {
    this.storage.delete(key);
  }

  /**
   * Clear all storage
   */
  clear(): void {
    this.storage.clearAll();
  }

  /**
   * Get all keys
   */
  getAllKeys(): string[] {
    return this.storage.getAllKeys();
  }

  /**
   * Get storage size
   */
  getSize(): number {
    let totalSize = 0;
    const keys = this.getAllKeys();

    keys.forEach((key) => {
      const value = this.storage.getString(key);
      if (value) {
        totalSize += value.length;
      }
    });

    return totalSize;
  }
}

// Export typed storage instances
export const storage = new TypedStorage(defaultStorage);
export const secure = new TypedStorage(secureStorage);
export const cache = new TypedStorage(cacheStorage);
export const ml = new TypedStorage(mlStorage);

/**
 * Storage utilities
 */
export const StorageUtils = {
  /**
   * Migrate data between storage instances
   */
  migrate: (fromStorage: TypedStorage, toStorage: TypedStorage, keys: string[]): void => {
    keys.forEach((key) => {
      const value = fromStorage.get(key);
      if (value !== undefined) {
        toStorage.set(key, value);
        fromStorage.delete(key);
      }
    });
  },

  /**
   * Backup storage to JSON
   */
  backup: (storageInstance: TypedStorage): Record<string, any> => {
    const backup: Record<string, any> = {};
    const keys = storageInstance.getAllKeys();

    keys.forEach((key) => {
      backup[key] = storageInstance.get(key);
    });

    return backup;
  },

  /**
   * Restore storage from JSON
   */
  restore: (storageInstance: TypedStorage, backup: Record<string, any>): void => {
    Object.entries(backup).forEach(([key, value]) => {
      storageInstance.set(key, value);
    });
  },

  /**
   * Clean up old cache entries
   */
  cleanupCache: (maxAge: number = 7 * 24 * 60 * 60 * 1000): void => {
    const now = Date.now();
    const keys = cache.getAllKeys();

    keys.forEach((key) => {
      const data = cache.get<{ timestamp: number; value: any }>(key);
      if (data && data.timestamp && now - data.timestamp > maxAge) {
        cache.delete(key);
      }
    });
  },
};

/**
 * Performance metrics storage
 */
export const PerformanceStorage = {
  /**
   * Track a performance metric
   */
  track: (metric: string, value: number): void => {
    const metrics = storage.get<Record<string, number[]>>(StorageKeys.PERFORMANCE_METRICS) || {};

    if (!metrics[metric]) {
      metrics[metric] = [];
    }

    metrics[metric].push(value);

    // Keep only last 100 values
    if (metrics[metric].length > 100) {
      metrics[metric] = metrics[metric].slice(-100);
    }

    storage.set(StorageKeys.PERFORMANCE_METRICS, metrics);
  },

  /**
   * Get average for a metric
   */
  getAverage: (metric: string): number => {
    const metrics = storage.get<Record<string, number[]>>(StorageKeys.PERFORMANCE_METRICS) || {};
    const values = metrics[metric] || [];

    if (values.length === 0) return 0;

    return values.reduce((sum, val) => sum + val, 0) / values.length;
  },

  /**
   * Clear all metrics
   */
  clear: (): void => {
    storage.delete(StorageKeys.PERFORMANCE_METRICS);
  },
};

/**
 * Initialize storage with default values
 */
export const initializeStorage = (): void => {
  // Set default theme if not set
  if (!storage.has(StorageKeys.THEME)) {
    storage.set(StorageKeys.THEME, 'light');
  }

  // Initialize empty sessions array if not exists
  if (!storage.has(StorageKeys.SESSIONS)) {
    storage.set(StorageKeys.SESSIONS, []);
  }

  // Clean up old cache on startup
  StorageUtils.cleanupCache();

  console.log('Storage initialized');
  console.log(`Total storage size: ${(storage.getSize() / 1024).toFixed(2)}KB`);
};
