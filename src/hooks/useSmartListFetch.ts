// src/hooks/useSmartListFetch.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { PaginationData } from '../components/PaginationControls';

interface UseSmartListFetchOptions {
    initialPage?: number;
    perPage?: number;
    cacheTime?: number;
    forceRefreshOnFocus?: boolean;
    debounceMs?: number;
}

export function useSmartListFetch<T>(
    fetchFunction: (page: number, filters?: string, perPage?: number) => Promise<{
        data: T[];
        pagination: PaginationData;
    }>,
    options: UseSmartListFetchOptions = {}
) {
    const {
        initialPage = 1,
        perPage = 20,
        cacheTime = 30000,
        forceRefreshOnFocus = false,
        debounceMs = 300
    } = options;

    const [items, setItems] = useState<T[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [paginationLoading, setPaginationLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [searchText, setSearchText] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [page, setPage] = useState<number>(initialPage);

    const cacheRef = useRef<Map<string, { data: T[]; pagination: PaginationData; timestamp: number }>>(new Map());
    const isMountedRef = useRef<boolean>(true);
    const lastFetchRef = useRef<number>(0);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasInitialLoadRef = useRef<boolean>(false);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const getCacheKey = useCallback((pageNum: number, filters?: string) => {
        return `${pageNum}-${filters || 'no-filters'}`;
    }, []);

    const isDataFresh = useCallback((cacheKey: string) => {
        const cached = cacheRef.current.get(cacheKey);
        if (!cached) return false;
        const now = Date.now();
        return (now - cached.timestamp) < cacheTime;
    }, [cacheTime]);

    const currentFilters = useMemo(() => {
        const q = searchText.trim();
        return q ? `name|like|${q}` : undefined;
    }, [searchText]);

    const fetchData = useCallback(async (
        pageToFetch = 1, 
        showLoading = true, 
        filters?: string, 
        force = false
    ) => {
        const cacheKey = getCacheKey(pageToFetch, filters);
        
        // Log removed for production optimization
        
        // Si los datos están frescos y no es forzado, usar cache
        if (!force && isDataFresh(cacheKey)) {
            const cached = cacheRef.current.get(cacheKey);
            if (cached && isMountedRef.current) {
                // Log removed
                setItems(cached.data);
                setPagination(cached.pagination);
                setPage(pageToFetch);
                setLoading(false);
                setError(null);
            }
            return cached;
        }

        // Evitar llamadas duplicadas muy rápidas
        const now = Date.now();
        if (!force && (now - lastFetchRef.current) < 1000) {
            // Log removed
            const cached = cacheRef.current.get(cacheKey);
            return cached;
        }

        // API call log removed for production
        lastFetchRef.current = now;

        try {
            if (showLoading && pageToFetch === 1 && isMountedRef.current) {
                setLoading(true);
            }
            if (pageToFetch !== 1 && isMountedRef.current) {
                setPaginationLoading(true);
            }
            if (isMountedRef.current) {
                setError(null);
            }

            const result = await fetchFunction(pageToFetch, filters, perPage);

            if (!isMountedRef.current) return result;

            // Actualizar cache
            cacheRef.current.set(cacheKey, {
                data: result.data,
                pagination: result.pagination,
                timestamp: now
            });

            setItems(result.data);
            setPagination(result.pagination);
            setPage(pageToFetch);
            setLoading(false);
            setPaginationLoading(false);
            setError(null);

            return result;
        } catch (err: any) {
            if (!isMountedRef.current) return null;

            // Error log removed
            if (isMountedRef.current) {
                setError(err.message || 'Error cargando datos');
                setLoading(false);
                setPaginationLoading(false);
            }
            throw err;
        }
    }, [fetchFunction, perPage, getCacheKey, isDataFresh]);

    // Búsqueda con debounce
    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            if (searchText.trim().length === 0) {
                fetchData(1, false, undefined);
            } else {
                setIsSearching(true);
                fetchData(1, false, currentFilters);
            }
        }, debounceMs);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [searchText, fetchData, currentFilters, debounceMs]);

    // Carga inicial - solo una vez
    useEffect(() => {
        if (!hasInitialLoadRef.current) {
            hasInitialLoadRef.current = true;
            fetchData(initialPage, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPage]);

    // Manejo inteligente del foco
    useFocusEffect(
        useCallback(() => {
            if (forceRefreshOnFocus) {
                const cacheKey = getCacheKey(page, currentFilters);
                if (!isDataFresh(cacheKey)) {
                    fetchData(page, false, currentFilters, true);
                }
            }
        }, [forceRefreshOnFocus, page, currentFilters, getCacheKey, isDataFresh, fetchData])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchData(1, false, currentFilters, true);
        } finally {
            if (isMountedRef.current) {
                setRefreshing(false);
            }
        }
    }, [fetchData, currentFilters]);

    const changePage = useCallback(async (newPage: number) => {
        await fetchData(newPage, false, currentFilters);
    }, [fetchData, currentFilters]);

    const forceUpdate = useCallback(async () => {
        return await fetchData(page, false, currentFilters, true);
    }, [fetchData, page, currentFilters]);

    const clearCache = useCallback(() => {
        cacheRef.current.clear();
    }, []);

    return {
        items,
        pagination,
        loading,
        paginationLoading,
        refreshing,
        error,
        searchText,
        setSearchText,
        isSearching,
        page,
        setPage,
        fetchData,
        onRefresh,
        changePage,
        forceUpdate,
        clearCache
    };
}
