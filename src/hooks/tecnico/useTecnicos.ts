// src/hooks/tecnico/useTecnicos.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Tecnico } from '../../types/tecnico/tecnico';
import { PaginationData } from '../../components/PaginationControls';
import { TecnicoService, TecnicosResponse } from '../../services/TecnicoService';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';

type UseTecnicosOptions = {
    initialPage?: number;
    perPage?: number;
    debounceMs?: number;
};

export function useTecnicos({
    initialPage = 1,
    perPage = 20,
    debounceMs = 450,
}: UseTecnicosOptions = {}) {
    const { token } = useAuth();
    const { showError } = useError();
    const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
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
        return q ? `name|like|${q}` : undefined;
    }, [searchText]);

    const fetchTecnicos = useCallback(
        async (pageToFetch = 1, showLoading = true) => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                if (showLoading && pageToFetch === 1) setLoading(true);
                if (pageToFetch !== 1) setPaginationLoading(true);
                setError(null);

                const resp: TecnicosResponse = await TecnicoService.getAll(
                    token,
                    pageToFetch,
                    currentFilters
                );

                if (!mountedRef.current) return;

                setTecnicos(resp.data);

                setPagination(TecnicoService.mapToPaginationData(resp));
                setPage(pageToFetch);
            } catch (err: any) {
                console.error('useTecnicos - fetch error', err);
                if (!mountedRef.current) return;
                showError(err, 'Error al cargar la lista de técnicos');
                setTecnicos([]);
                setPagination(null);
                setError(err.message || 'Error cargando técnicos');
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
                fetchTecnicos(1, false);
            } else {
                setIsSearching(true);
                fetchTecnicos(1, false);
            }
        }, debounceMs);

        return () => clearTimeout(id);
    }, [searchText, fetchTecnicos, debounceMs, hasInitialLoad]);

    // Solo cargar datos iniciales cuando hay token
    useEffect(() => {
        if (token && !hasInitialLoad) {
            fetchTecnicos(initialPage, true);
            setHasInitialLoad(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, hasInitialLoad]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchTecnicos(1, false);
    }, [fetchTecnicos]);

    const changePage = useCallback(
        async (newPage: number) => {
            await fetchTecnicos(newPage, false);
        },
        [fetchTecnicos]
    );

    const removeTecnico = useCallback(
        async (id: number) => {
            if (!token) throw new Error('No auth token');
            try {
                setPaginationLoading(true);
                await TecnicoService.remove(id, token);
                await fetchTecnicos(page, false);
                return true;
            } catch (err: any) {
                console.error('removeTecnico error', err);
                showError(err, 'Error al eliminar el técnico');
                setError(err.message || 'Error eliminando técnico');
                return false;
            } finally {
                setPaginationLoading(false);
            }
        },
        [token, fetchTecnicos, page]
    );

    const addTecnico = useCallback(
        async (payload: Parameters<typeof TecnicoService.create>[0]) => {
            if (!token) throw new Error('No auth token');
            try {
                const created = await TecnicoService.create(payload, token);
                setTecnicos((prev) => [created, ...prev]);
                return created;
            } catch (err: any) {
                showError(err, 'Error al crear el técnico');
                setError(err.message || 'Error creando técnico');
                throw err;
            }
        },
        [token, showError]
    );

    const updateTecnico = useCallback(
        async (id: number, payload: Parameters<typeof TecnicoService.update>[1]) => {
            if (!token) throw new Error('No auth token');
            try {
                const updated = await TecnicoService.update(id, payload, token);
                setTecnicos((prev) => prev.map((t) => (t.id === id ? updated : t)));
                return updated;
            } catch (err: any) {
                showError(err, 'Error al actualizar el técnico');
                setError(err.message || 'Error actualizando técnico');
                throw err;
            }
        },
        [token, showError]
    );

    return {
        tecnicos,
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
        fetchTecnicos,
        onRefresh,
        changePage,
        removeTecnico,
        addTecnico,
        updateTecnico,
    };
}
