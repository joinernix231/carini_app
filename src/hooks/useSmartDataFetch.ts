// src/hooks/useSmartDataFetch.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    isLoading: boolean;
}

interface UseSmartDataFetchOptions {
    cacheTime?: number; // Tiempo en ms para considerar los datos como "frescos"
    forceRefreshOnFocus?: boolean; // Si debe refrescar al recibir foco
    debounceMs?: number;
}

export function useSmartDataFetch<T>(
    fetchFunction: () => Promise<T>,
    options: UseSmartDataFetchOptions = {}
) {
    const {
        cacheTime = 30000, // 30 segundos por defecto
        forceRefreshOnFocus = false,
        debounceMs = 300
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const cacheRef = useRef<CacheEntry<T> | null>(null);
    const isMountedRef = useRef<boolean>(true);
    const lastFetchRef = useRef<number>(0);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const isDataFresh = useCallback(() => {
        if (!cacheRef.current) return false;
        const now = Date.now();
        return (now - cacheRef.current.timestamp) < cacheTime;
    }, [cacheTime]);

    const fetchData = useCallback(async (showLoading = true, force = false) => {
        // Si los datos están frescos y no es forzado, usar cache
        if (!force && isDataFresh() && cacheRef.current) {
            if (isMountedRef.current) {
                setData(cacheRef.current.data);
                setLoading(false);
                setError(null);
            }
            return cacheRef.current.data;
        }

        // Evitar llamadas duplicadas muy rápidas
        const now = Date.now();
        if (!force && (now - lastFetchRef.current) < 1000) {
            return cacheRef.current?.data || null;
        }

        lastFetchRef.current = now;

        try {
            if (showLoading && isMountedRef.current) {
                setLoading(true);
                setError(null);
            }

            const result = await fetchFunction();

            if (!isMountedRef.current) return result;

            // Actualizar cache
            cacheRef.current = {
                data: result,
                timestamp: now,
                isLoading: false
            };

            setData(result);
            setLoading(false);
            setError(null);

            return result;
        } catch (err: any) {
            if (!isMountedRef.current) return null;

            // Error log removed
            setError(err.message || 'Error cargando datos');
            setLoading(false);
            throw err;
        }
    }, [fetchFunction, isDataFresh]);

    const refreshData = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchData(false, true);
        } finally {
            if (isMountedRef.current) {
                setRefreshing(false);
            }
        }
    }, [fetchData]);

    // Carga inicial
    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    // Manejo inteligente del foco
    useFocusEffect(
        useCallback(() => {
            if (forceRefreshOnFocus) {
                // Solo refrescar si los datos no están frescos
                if (!isDataFresh()) {
                    fetchData(false, true);
                }
            }
        }, [forceRefreshOnFocus, isDataFresh, fetchData])
    );

    // Función para forzar actualización (útil para acciones CRUD)
    const forceUpdate = useCallback(async () => {
        return await fetchData(false, true);
    }, [fetchData]);

    // Función para limpiar cache
    const clearCache = useCallback(() => {
        cacheRef.current = null;
    }, []);

    return {
        data,
        loading,
        error,
        refreshing,
        refreshData,
        forceUpdate,
        clearCache,
        isDataFresh: isDataFresh()
    };
}
