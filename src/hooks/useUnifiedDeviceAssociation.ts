// src/hooks/useUnifiedDeviceAssociation.ts
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Equipo } from '../types/equipo/equipo';
import { EquipoService } from '../services/EquipoService';
import { AvailableDevicesService } from '../services/AvailableDevicesService';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { logger } from '../utils/logger';
import { cacheManager } from '../utils/cacheManager';

export type DeviceAssociationType = 'all' | 'available' | 'assigned';

interface UseUnifiedDeviceAssociationOptions {
  type: DeviceAssociationType;
  cacheKey?: string;
  cacheTTL?: number;
  autoFetch?: boolean;
  page?: number;
  perPage?: number;
}

export function useUnifiedDeviceAssociation(options: UseUnifiedDeviceAssociationOptions) {
  const { 
    type, 
    cacheKey, 
    cacheTTL = 2 * 60 * 1000, 
    autoFetch = true,
    page = 1,
    perPage = 20
  } = options;
  
  const { token } = useAuth();
  const { showError } = useError();
  
  const [devices, setDevices] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Refs para optimización
  const loadingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const lastFetchRef = useRef<number>(0);
  
  // Generar cache key único
  const finalCacheKey = useMemo(() => {
    return cacheKey || `devices_${type}_page_${page}_perPage_${perPage}`;
  }, [cacheKey, type, page, perPage]);
  
  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cargar desde cache
  const loadFromCache = useCallback(async (): Promise<Equipo[] | null> => {
    try {
      const cachedData = await cacheManager.getListData<Equipo>(finalCacheKey);
      if (cachedData && mountedRef.current) {
        logger.cache(`Devices (${type}) loaded from cache:`, cachedData.length);
        setDevices(cachedData);
        return cachedData;
      }
    } catch (error) {
      logger.error('Error loading devices from cache:', error);
    }
    return null;
  }, [finalCacheKey, type]);

  // Guardar en cache
  const saveToCache = useCallback(async (data: Equipo[]): Promise<void> => {
    try {
      await cacheManager.setListData(finalCacheKey, data, cacheTTL);
      logger.cache(`Devices (${type}) saved to cache:`, data.length);
    } catch (error) {
      logger.error('Error saving devices to cache:', error);
    }
  }, [finalCacheKey, cacheTTL, type]);

  // Función unificada para cargar dispositivos
  const loadDevices = useCallback(async (forceRefresh = false): Promise<void> => {
    // Evitar llamadas duplicadas
    if (loadingRef.current || !mountedRef.current) {
      return;
    }

    // Throttling: evitar llamadas muy frecuentes
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchRef.current) < 1000) {
      logger.debug('Throttling: too soon to fetch again');
      return;
    }

    logger.debug(`useUnifiedDeviceAssociation (${type}) - loadDevices called, forceRefresh:`, forceRefresh);
    
    if (!token) {
      logger.warn(`useUnifiedDeviceAssociation (${type}) - No token available`);
      return;
    }

    // Intentar cargar desde cache primero si no es refresh forzado
    if (!forceRefresh) {
      const cachedData = await loadFromCache();
      if (cachedData && cachedData.length > 0) {
        return;
      }
    }

    try {
      loadingRef.current = true;
      lastFetchRef.current = now;
      
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      let response: any;
      
      // Llamar al servicio apropiado según el tipo
      switch (type) {
        case 'all':
          logger.api(`useUnifiedDeviceAssociation (${type}) - Calling EquipoService.getAll`);
          response = await EquipoService.getAll(token, page, perPage);
          break;
          
        case 'available':
          logger.api(`useUnifiedDeviceAssociation (${type}) - Calling AvailableDevicesService.getAvailableDevices`);
          const availableDevices = await AvailableDevicesService.getAvailableDevices(token);
          response = { data: availableDevices };
          break;
          
        case 'assigned':
          logger.api(`useUnifiedDeviceAssociation (${type}) - Calling EquipoService.getAll (assigned)`);
          response = await EquipoService.getAll(token, page, perPage);
          // Filtrar solo dispositivos asignados si es necesario
          break;
          
        default:
          throw new Error(`Unknown device association type: ${type}`);
      }
      
      if (mountedRef.current) {
        const devicesData = response.data || response;
        logger.debug(`useUnifiedDeviceAssociation (${type}) - Devices loaded:`, devicesData.length);
        setDevices(devicesData);
        
        // Guardar en cache
        await saveToCache(devicesData);
      }
    } catch (error: any) {
      if (mountedRef.current) {
        logger.error(`useUnifiedDeviceAssociation (${type}) - Error cargando dispositivos:`, error);
        setError(error.message || 'Error cargando dispositivos');
        showError(error);
      }
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [token, showError, loadFromCache, saveToCache, type, page, perPage]);

  // Refresh con limpieza de cache
  const refreshDevices = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await cacheManager.delete(`list_${finalCacheKey}`);
      await loadDevices(true);
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [loadDevices, finalCacheKey]);

  // Carga inicial
  useEffect(() => {
    if (autoFetch && token) {
      loadDevices();
    }
  }, [autoFetch, token, loadDevices]);

  // Memoizar estadísticas
  const stats = useMemo(() => ({
    totalDevices: devices.length,
    hasData: devices.length > 0,
    isLoading: loading,
    isRefreshing: refreshing,
    hasError: !!error,
    type,
    cacheKey: finalCacheKey
  }), [devices.length, loading, refreshing, error, type, finalCacheKey]);

  // Memoizar el valor de retorno
  const returnValue = useMemo(() => ({
    devices,
    loading,
    refreshing,
    error,
    stats,
    loadDevices,
    refreshDevices,
    clearCache: () => cacheManager.delete(`list_${finalCacheKey}`),
    // Métodos específicos por tipo
    loadAllDevices: type === 'all' ? loadDevices : undefined,
    loadAvailableDevices: type === 'available' ? loadDevices : undefined,
    loadAssignedDevices: type === 'assigned' ? loadDevices : undefined,
  }), [devices, loading, refreshing, error, stats, loadDevices, refreshDevices, finalCacheKey, type]);

  return returnValue;
}

// Hooks específicos para cada tipo (mantener compatibilidad)
export function useAllDevices(options: Omit<UseUnifiedDeviceAssociationOptions, 'type'> = {}) {
  return useUnifiedDeviceAssociation({ ...options, type: 'all' });
}

export function useAvailableDevices(options: Omit<UseUnifiedDeviceAssociationOptions, 'type'> = {}) {
  return useUnifiedDeviceAssociation({ ...options, type: 'available' });
}

export function useAssignedDevices(options: Omit<UseUnifiedDeviceAssociationOptions, 'type'> = {}) {
  return useUnifiedDeviceAssociation({ ...options, type: 'assigned' });
}
