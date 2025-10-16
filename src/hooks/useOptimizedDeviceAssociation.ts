// src/hooks/useOptimizedDeviceAssociation.ts
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Equipo } from '../types/equipo/equipo';
import { EquipoService } from '../services/EquipoService';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { logger } from '../utils/logger';
import { cacheManager } from '../utils/cacheManager';

interface UseOptimizedDeviceAssociationOptions {
  cacheKey?: string;
  cacheTTL?: number;
  autoFetch?: boolean;
}

export function useOptimizedDeviceAssociation(options: UseOptimizedDeviceAssociationOptions = {}) {
  const { cacheKey = 'devices', cacheTTL = 2 * 60 * 1000, autoFetch = true } = options;
  const { token } = useAuth();
  const { showError } = useError();
  
  const [devices, setDevices] = useState<Equipo[]>([]);
  const [loadingDevices, setLoadingDevices] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs para optimización
  const loadingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const lastFetchRef = useRef<number>(0);
  
  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cargar desde cache
  const loadFromCache = useCallback(async (): Promise<Equipo[] | null> => {
    try {
      const cachedData = await cacheManager.getListData<Equipo>(cacheKey);
      if (cachedData && mountedRef.current) {
        logger.cache('Devices loaded from cache:', cachedData.length);
        setDevices(cachedData);
        return cachedData;
      }
    } catch (error) {
      logger.error('Error loading devices from cache:', error);
    }
    return null;
  }, [cacheKey]);

  // Guardar en cache
  const saveToCache = useCallback(async (data: Equipo[]): Promise<void> => {
    try {
      await cacheManager.setListData(cacheKey, data, cacheTTL);
      logger.cache('Devices saved to cache:', data.length);
    } catch (error) {
      logger.error('Error saving devices to cache:', error);
    }
  }, [cacheKey, cacheTTL]);

  // Cargar dispositivos desde API
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

    logger.debug('useOptimizedDeviceAssociation - loadDevices called, forceRefresh:', forceRefresh);
    
    if (!token) {
      logger.warn('useOptimizedDeviceAssociation - No token available');
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
        setLoadingDevices(true);
        setError(null);
      }
      
      logger.api('useOptimizedDeviceAssociation - Calling EquipoService.getAll');
      const response = await EquipoService.getAll(token, 1);
      
      if (mountedRef.current) {
        logger.debug('useOptimizedDeviceAssociation - Devices loaded:', response.data.length);
        setDevices(response.data);
        
        // Guardar en cache
        await saveToCache(response.data);
      }
    } catch (error: any) {
      if (mountedRef.current) {
        logger.error('useOptimizedDeviceAssociation - Error cargando dispositivos:', error);
        setError(error.message || 'Error cargando dispositivos');
        showError(error);
      }
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) {
        setLoadingDevices(false);
      }
    }
  }, [token, showError, loadFromCache, saveToCache]);

  // Refresh con limpieza de cache
  const refreshDevices = useCallback(async (): Promise<void> => {
    await cacheManager.delete(`list_${cacheKey}`);
    await loadDevices(true);
  }, [loadDevices, cacheKey]);

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
    isLoading: loadingDevices,
    hasError: !!error
  }), [devices.length, loadingDevices, error]);

  // Memoizar el valor de retorno
  const returnValue = useMemo(() => ({
    devices,
    loadingDevices,
    error,
    stats,
    loadDevices,
    refreshDevices,
    clearCache: () => cacheManager.delete(`list_${cacheKey}`)
  }), [devices, loadingDevices, error, stats, loadDevices, refreshDevices, cacheKey]);

  return returnValue;
}
