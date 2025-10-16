// src/utils/cacheManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
  defaultTTL: number; // Default TTL in milliseconds
  maxSize: number; // Maximum number of entries
  storageKey: string; // Key for AsyncStorage
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      storageKey: '@carini_cache',
      ...config
    };
    
    this.loadFromStorage();
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.config.storageKey);
      if (stored) {
        const entries = JSON.parse(stored);
        this.memoryCache = new Map(entries);
        logger.cache('Cache loaded from storage:', this.memoryCache.size, 'entries');
      }
    } catch (error) {
      logger.error('Error loading cache from storage:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const entries = Array.from(this.memoryCache.entries());
      await AsyncStorage.setItem(this.config.storageKey, JSON.stringify(entries));
      logger.cache('Cache saved to storage:', entries.length, 'entries');
    } catch (error) {
      logger.error('Error saving cache to storage:', error);
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.memoryCache.delete(key);
    });

    // Si aún excede el tamaño máximo, eliminar los más antiguos
    if (this.memoryCache.size > this.config.maxSize) {
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.memoryCache.size - this.config.maxSize);
      toRemove.forEach(([key]) => {
        this.memoryCache.delete(key);
      });
    }

    if (expiredKeys.length > 0 || this.memoryCache.size > this.config.maxSize) {
      this.saveToStorage();
    }
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    this.memoryCache.set(key, entry);
    await this.saveToStorage();
    
    logger.cache('Cache set:', key, 'TTL:', entry.ttl);
    this.cleanup();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      logger.cache('Cache miss:', key);
      return null;
    }

    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      await this.saveToStorage();
      logger.cache('Cache expired:', key);
      return null;
    }

    logger.cache('Cache hit:', key);
    return entry.data as T;
  }

  async has(key: string): Promise<boolean> {
    const entry = this.memoryCache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      await this.saveToStorage();
      return false;
    }
    
    return true;
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.saveToStorage();
    logger.cache('Cache deleted:', key);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    await AsyncStorage.removeItem(this.config.storageKey);
    logger.cache('Cache cleared');
  }

  async getStats(): Promise<{
    size: number;
    maxSize: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  }> {
    const entries = Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl
    }));

    return {
      size: this.memoryCache.size,
      maxSize: this.config.maxSize,
      entries
    };
  }

  // Métodos específicos para diferentes tipos de datos
  async setUserData(userId: number, data: any, ttl?: number): Promise<void> {
    return this.set(`user_${userId}`, data, ttl);
  }

  async getUserData<T>(userId: number): Promise<T | null> {
    return this.get<T>(`user_${userId}`);
  }

  async setListData(listKey: string, data: any[], ttl?: number): Promise<void> {
    return this.set(`list_${listKey}`, data, ttl);
  }

  async getListData<T>(listKey: string): Promise<T[] | null> {
    return this.get<T[]>(`list_${listKey}`);
  }

  async setApiResponse(endpoint: string, params: any, data: any, ttl?: number): Promise<void> {
    const key = `api_${endpoint}_${JSON.stringify(params)}`;
    return this.set(key, data, ttl);
  }

  async getApiResponse<T>(endpoint: string, params: any): Promise<T | null> {
    const key = `api_${endpoint}_${JSON.stringify(params)}`;
    return this.get<T>(key);
  }
}

// Instancia global del cache manager
export const cacheManager = new CacheManager({
  defaultTTL: 5 * 60 * 1000, // 5 minutos
  maxSize: 100,
  storageKey: '@carini_cache'
});

export default cacheManager;
