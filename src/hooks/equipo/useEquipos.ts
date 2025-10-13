// src/hooks/equipo/useEquipos.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Equipo } from '../../types/equipo/equipo';
import { PaginationData } from '../../components/PaginationControls';
import { EquipoService, EquiposResponse } from '../../services/EquipoService';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';

type UseEquiposOptions = {
    initialPage?: number;
    perPage?: number;
    debounceMs?: number;
};

export function useEquipos({
    initialPage = 1,
    perPage = 20,
    debounceMs = 450,
}: UseEquiposOptions = {}) {
    const { token } = useAuth();
    const { showError } = useError();
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [paginationLoading, setPaginationLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [searchText, setSearchText] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const [page, setPage] = useState<number>(initialPage);
    const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false);

    const mountedRef = useRef(true);
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const currentFilters = useMemo(() => {
        const q = searchText.trim();
        return q ? `serial|like|${q}` : undefined;
    }, [searchText]);

    const fetchEquipos = useCallback(
        async (pageToFetch = 1, showLoading = true, filters?: string) => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                if (showLoading && pageToFetch === 1) setLoading(true);
                if (pageToFetch !== 1) setPaginationLoading(true);
                setError(null);

                const resp: EquiposResponse = await EquipoService.getAll(
                    token,
                    pageToFetch,
                    filters || currentFilters
                );

                if (!mountedRef.current) return;

                setEquipos(resp.data);
                setPagination(EquipoService.mapToPaginationData(resp));
                setPage(pageToFetch);
            } catch (err: any) {
                console.error('useEquipos - fetch error', err);
                if (!mountedRef.current) return;
                setEquipos([]);
                setPagination(null);
                setError(err.message || 'Error cargando equipos');
            } finally {
                if (!mountedRef.current) return;
                setLoading(false);
                setPaginationLoading(false);
                setIsSearching(false);
                setRefreshing(false);
            }
        },
        [token, currentFilters, perPage]
    );

    // search con debounce - solo si ya se cargó inicialmente
    useEffect(() => {
        if (!hasInitialLoad) return;
        
        const id = setTimeout(() => {
            if (searchText.trim().length === 0) {
                fetchEquipos(1, false);
            } else {
                setIsSearching(true);
                fetchEquipos(1, false);
            }
        }, debounceMs);

        return () => clearTimeout(id);
    }, [searchText, fetchEquipos, debounceMs, hasInitialLoad]);

    // Solo cargar datos iniciales cuando hay token
    useEffect(() => {
        if (token && !hasInitialLoad) {
            fetchEquipos(initialPage, true);
            setHasInitialLoad(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, hasInitialLoad]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchEquipos(1, false);
    }, [fetchEquipos]);

    const changePage = useCallback(
        async (newPage: number) => {
            await fetchEquipos(newPage, false);
        },
        [fetchEquipos]
    );

    const removeEquipo = useCallback(
        async (id: number) => {
            if (!token) throw new Error('No auth token');
            try {
                setPaginationLoading(true);
                await EquipoService.remove(id, token);
                await fetchEquipos(page, false);
                return true;
            } catch (err: any) {
                console.error('removeEquipo error', err);
                showError(err, 'Error al eliminar el equipo');
                setError(err.message || 'Error eliminando equipo');
                return false;
            } finally {
                setPaginationLoading(false);
            }
        },
        [token, fetchEquipos, page, showError]
    );

    const addEquipo = useCallback(
        async (payload: Parameters<typeof EquipoService.create>[0]) => {
            if (!token) throw new Error('No auth token');
            try {
                const created = await EquipoService.create(payload, token);
                setEquipos((prev) => [created, ...prev]);
                return created;
            } catch (err: any) {
                showError(err, 'Error al crear el equipo');
                setError(err.message || 'Error creando equipo');
                throw err;
            }
        },
        [token, showError]
    );

    const updateEquipo = useCallback(
        async (id: number, payload: Parameters<typeof EquipoService.update>[1]) => {
            if (!token) throw new Error('No auth token');
            try {
                const updated = await EquipoService.update(id, payload, token);
                setEquipos((prev) => prev.map((e) => (e.id === id ? updated : e)));
                return updated;
            } catch (err: any) {
                showError(err, 'Error al actualizar el equipo');
                setError(err.message || 'Error actualizando equipo');
                throw err;
            }
        },
        [token, showError]
    );

    const changeStatus = useCallback(
        async (id: number, status: 'active' | 'inactive') => {
            if (!token) throw new Error('No auth token');
            try {
                const updated = await EquipoService.changeStatus(id, status, token);
                setEquipos((prev) => prev.map((e) => (e.id === id ? updated : e)));
                return updated;
            } catch (err: any) {
                setError(err.message || 'Error cambiando estado del equipo');
                throw err;
            }
        },
        [token]
    );

    return {
        equipos,
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
        fetchEquipos,
        onRefresh,
        changePage,
        removeEquipo,
        addEquipo,
        updateEquipo,
        changeStatus,
    };
}



