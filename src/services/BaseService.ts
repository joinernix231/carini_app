// src/services/BaseService.ts
import API from './api';
import { logger } from '../utils/logger';
import { cacheManager } from '../utils/cacheManager';

export interface BaseResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

export interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  pagination: PaginationData;
}

export abstract class BaseService {
  protected static getAuthHeaders(token: string) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
  }

  protected static async handleApiCall<T>(
    apiCall: () => Promise<any>,
    context: string,
    useCache = false,
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      logger.api(`${context} - Starting API call`);
      
      // Intentar obtener desde cache si está habilitado
      if (useCache && cacheKey) {
        const cachedData = await cacheManager.getApiResponse<T>(context, { cacheKey });
        if (cachedData) {
          logger.cache(`${context} - Data retrieved from cache`);
          return cachedData;
        }
      }

      const response = await apiCall();
      const endTime = Date.now();
      
      logger.api(`${context} - API call completed in ${endTime - startTime}ms`);
      
      // Guardar en cache si está habilitado
      if (useCache && cacheKey && response?.data) {
        await cacheManager.setApiResponse(context, { cacheKey }, response.data, cacheTTL);
        logger.cache(`${context} - Data saved to cache`);
      }
      
      return response.data;
    } catch (error: any) {
      const endTime = Date.now();
      logger.error(`${context} - API call failed after ${endTime - startTime}ms:`, error);
      throw error;
    }
  }

  protected static async getAll<T>(
    endpoint: string,
    token: string,
    page = 1,
    filters?: string,
    perPage = 20,
    useCache = true,
    cacheTTL = 5 * 60 * 1000 // 5 minutos
  ): Promise<PaginatedResponse<T>> {
    const cacheKey = `${endpoint}_page_${page}_filters_${filters || 'none'}_perPage_${perPage}`;
    
    return this.handleApiCall<PaginatedResponse<T>>(
      () => {
        const params = new URLSearchParams({
          page: page.toString(),
          per_page: perPage.toString(),
          ...(filters && { filters })
        });
        
        return API.get(`${endpoint}?${params}`, this.getAuthHeaders(token));
      },
      `GET ${endpoint}`,
      useCache,
      cacheKey,
      cacheTTL
    );
  }

  protected static async getById<T>(
    endpoint: string,
    id: number,
    token: string,
    useCache = true,
    cacheTTL = 10 * 60 * 1000 // 10 minutos
  ): Promise<T> {
    const cacheKey = `${endpoint}_${id}`;
    
    return this.handleApiCall<T>(
      () => API.get(`${endpoint}/${id}`, this.getAuthHeaders(token)),
      `GET ${endpoint}/${id}`,
      useCache,
      cacheKey,
      cacheTTL
    );
  }

  protected static async create<T, P>(
    endpoint: string,
    data: P,
    token: string
  ): Promise<T> {
    return this.handleApiCall<T>(
      () => API.post(endpoint, data, this.getAuthHeaders(token)),
      `POST ${endpoint}`,
      false // No cache para operaciones de escritura
    );
  }

  protected static async update<T, P>(
    endpoint: string,
    id: number,
    data: P,
    token: string
  ): Promise<T> {
    return this.handleApiCall<T>(
      () => API.put(`${endpoint}/${id}`, data, this.getAuthHeaders(token)),
      `PUT ${endpoint}/${id}`,
      false // No cache para operaciones de escritura
    );
  }

  protected static async delete(
    endpoint: string,
    id: number,
    token: string
  ): Promise<void> {
    return this.handleApiCall<void>(
      () => API.delete(`${endpoint}/${id}`, this.getAuthHeaders(token)),
      `DELETE ${endpoint}/${id}`,
      false // No cache para operaciones de escritura
    );
  }

  // Método para limpiar cache relacionado
  protected static async clearRelatedCache(patterns: string[]): Promise<void> {
    try {
      const stats = await cacheManager.getStats();
      const keysToDelete = stats.entries
        .filter(entry => 
          patterns.some(pattern => entry.key.includes(pattern))
        )
        .map(entry => entry.key);

      for (const key of keysToDelete) {
        await cacheManager.delete(key);
      }
      
      logger.cache(`Cleared ${keysToDelete.length} cache entries for patterns:`, patterns);
    } catch (error) {
      logger.error('Error clearing related cache:', error);
    }
  }

  // Método para validar respuesta
  protected static validateResponse<T>(response: BaseResponse<T>, context: string): T {
    if (!response.success) {
      const error = new Error(response.message || 'API call failed');
      logger.error(`${context} - API response validation failed:`, response);
      throw error;
    }
    
    return response.data;
  }

  // Método para mapear datos de paginación
  protected static mapPaginationData(response: any): PaginationData {
    return {
      current_page: response.current_page || 1,
      last_page: response.last_page || 1,
      per_page: response.per_page || 20,
      total: response.total || 0,
      from: response.from || 0,
      to: response.to || 0,
    };
  }
}
