// src/hooks/useSimpleListFetch.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PaginationData } from '../components/PaginationControls';

interface UseSimpleListFetchOptions {
    initialPage?: number;
    perPage?: number;
    debounceMs?: number;
}

export function useSimpleListFetch<T>(
    fetchFunction: (page: number, filters?: string, perPage?: number) => Promise<{
        data: T[];
        pagination: PaginationData;
    }>,
    options: UseSimpleListFetchOptions = {}
) {
    const {
        initialPage = 1,
        perPage = 20,
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

    const isMountedRef = useRef<boolean>(true);
    const hasInitialLoadRef = useRef<boolean>(false);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const currentFilters = useMemo(() => {
        const q = searchText.trim();
        return q ? `name|like|${q}` : undefined;
    }, [searchText]);

    const fetchData = useCallback(async (
        pageToFetch = 1, 
        showLoading = true, 
        filters?: string
    ) => {
        try {
            console.log('🌐 useSimpleListFetch - API call:', { pageToFetch, filters });
            
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

            setItems(result.data);
            setPagination(result.pagination);
            setPage(pageToFetch);
            setLoading(false);
            setPaginationLoading(false);
            setError(null);

            return result;
        } catch (err: any) {
            if (!isMountedRef.current) return null;

            console.error('useSimpleListFetch - fetch error', err);
            if (isMountedRef.current) {
                setError(err.message || 'Error cargando datos');
                setLoading(false);
                setPaginationLoading(false);
            }
            throw err;
        }
    }, [fetchFunction, perPage]);

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

    // Carga inicial - SOLO UNA VEZ
    useEffect(() => {
        if (!hasInitialLoadRef.current) {
            hasInitialLoadRef.current = true;
            fetchData(initialPage, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPage]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchData(1, false, currentFilters);
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
        return await fetchData(page, false, currentFilters);
    }, [fetchData, page, currentFilters]);

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
        forceUpdate
    };
}
