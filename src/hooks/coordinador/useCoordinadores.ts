import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {Coordinador} from "../../types/coordinador/coordinador";
import { PaginationData } from '../../components/PaginationControls';
import {CoordinadoresResponse, CoordinadorService} from "../../services/CoordinadorService";
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';

type UseCoordinadoresOptions = {
    initialPage?: number;
    perPage?: number;
    debounceMs?: number;
};

export function useCoordinadores({
                                     initialPage = 1,
                                     perPage = 20,
                                     debounceMs = 450,
                                 }: UseCoordinadoresOptions = {}) {
    const { token } = useAuth();
    const { showError } = useError();
    const [coordinadores, setCoordinadores] = useState<Coordinador[]>([]); // <- Corregido: coordinadores en minúscula
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [paginationLoading, setPaginationLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [searchText, setSearchText] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const [page, setPage] = useState<number>(initialPage);

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

    const fetchCoordinadores = useCallback(
        async (pageToFetch = 1, showLoading?: string) => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                if (showLoading && pageToFetch === 1) setLoading(true);
                if (pageToFetch !== 1) setPaginationLoading(true);
                setError(null);

                const resp: CoordinadoresResponse = await CoordinadorService.getAll(
                    token,
                    pageToFetch,
                    currentFilters,
                    perPage
                );


                if (!mountedRef.current) return;

                setCoordinadores(resp.data);

                setPagination(CoordinadorService.mapToPaginationData(resp));
                setPage(pageToFetch);
            } catch (err: any) {
                console.error('useCoordinadores - fetch error', err);
                if (!mountedRef.current) return;
                
                // Usar el sistema de errores global
                showError(err, 'Error al cargar la lista de coordinadores');
                setCoordinadores([]);
                setPagination(null);
                setError(err.message || 'Error cargando coordinadores'); // <- Corregido mensaje
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

    // search con debounce
    useEffect(() => {
        const id = setTimeout(() => {
            if (searchText.trim().length === 0) {
                fetchCoordinadores(1, false);
            } else {
                setIsSearching(true);
                fetchCoordinadores(1, false);
            }
        }, debounceMs);

        return () => clearTimeout(id);
    }, [searchText, fetchCoordinadores, debounceMs]);

    useEffect(() => {
        fetchCoordinadores(initialPage, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchCoordinadores(1, false);
    }, [fetchCoordinadores]);

    const changePage = useCallback(
        async (newPage: number) => {
            await fetchCoordinadores(newPage, false);
        },
        [fetchCoordinadores]
    );

    const removeCoordinador = useCallback(
        async (id: number) => {
            if (!token) throw new Error('No auth token');
            try {
                setPaginationLoading(true);
                await CoordinadorService.remove(id, token);
                await fetchCoordinadores(page, false);
                return true;
            } catch (err: any) {
                console.error('removeCoordinador error', err);
                showError(err, 'Error al eliminar el coordinador');
                setError(err.message || 'Error eliminando coordinador'); // <- Corregido mensaje
                return false;
            } finally {
                setPaginationLoading(false);
            }
        },
        [token, fetchCoordinadores, page]
    );

    const addCoordinador = useCallback(
        async (payload: Parameters<typeof CoordinadorService.create>[0]) => {
            if (!token) throw new Error('No auth token');
            try {
                const created = await CoordinadorService.create(payload, token);
                setCoordinadores((prev) => [created, ...prev]);
                return created;
            } catch (err: any) {
                showError(err, 'Error al crear el coordinador');
                setError(err.message || 'Error creando coordinador'); // <- Corregido mensaje
                throw err;
            }
        },
        [token, showError]
    );

    const updateCoordinador = useCallback(
        async (id: number, payload: Parameters<typeof CoordinadorService.update>[1]) => {
            if (!token) throw new Error('No auth token');
            try {
                const updated = await CoordinadorService.update(id, payload, token);
                setCoordinadores((prev) => prev.map((c) => (c.id === id ? updated : c))); // <- Corregido: c en vez de t
                return updated;
            } catch (err: any) {
                showError(err, 'Error al actualizar el coordinador');
                setError(err.message || 'Error actualizando coordinador'); // <- Corregido mensaje
                throw err;
            }
        },
        [token, showError]
    );

    return {
        coordinadores, // <- Consistente con el estado
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
        fetchCoordinadores,
        onRefresh,
        changePage,
        removeCoordinador,
        addCoordinador,
        updateCoordinador,
    };
}