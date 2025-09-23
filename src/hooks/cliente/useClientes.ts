// src/hooks/cliente/useClientes.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Cliente } from '../../types/cliente/cliente';
import { PaginationData } from '../../components/PaginationControls';
import { ClienteService, ClientesResponse } from '../../services/ClienteService';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';

type UseClientesOptions = {
    initialPage?: number;
    perPage?: number;
    debounceMs?: number;
};

export function useClientes({
    initialPage = 1,
    perPage = 20,
    debounceMs = 450,
}: UseClientesOptions = {}) {
    const { token } = useAuth();
    const { showError } = useError();
    const [clientes, setClientes] = useState<Cliente[]>([]);
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

    const fetchClientes = useCallback(
        async (pageToFetch = 1, showLoading = true, filters?: string) => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                if (showLoading && pageToFetch === 1) setLoading(true);
                if (pageToFetch !== 1) setPaginationLoading(true);
                setError(null);

                const resp: ClientesResponse = await ClienteService.getAll(
                    token,
                    pageToFetch,
                    filters || currentFilters,
                    perPage
                );

                if (!mountedRef.current) return;

                setClientes(resp.data);
                setPagination(ClienteService.mapToPaginationData(resp));
                setPage(pageToFetch);
            } catch (err: any) {
                console.error('useClientes - fetch error', err);
                if (!mountedRef.current) return;
                showError(err, 'Error al cargar la lista de clientes');
                setClientes([]);
                setPagination(null);
                setError(err.message || 'Error cargando clientes');
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
                fetchClientes(1, false);
            } else {
                setIsSearching(true);
                fetchClientes(1, false);
            }
        }, debounceMs);

        return () => clearTimeout(id);
    }, [searchText, fetchClientes, debounceMs]);

    useEffect(() => {
        fetchClientes(initialPage, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchClientes(1, false);
    }, [fetchClientes]);

    const changePage = useCallback(
        async (newPage: number) => {
            await fetchClientes(newPage, false);
        },
        [fetchClientes]
    );

    const removeCliente = useCallback(
        async (id: number) => {
            if (!token) throw new Error('No auth token');
            try {
                setPaginationLoading(true);
                await ClienteService.remove(id, token);
                await fetchClientes(page, false);
                return true;
            } catch (err: any) {
                console.error('removeCliente error', err);
                showError(err, 'Error al eliminar el cliente');
                setError(err.message || 'Error eliminando cliente');
                return false;
            } finally {
                setPaginationLoading(false);
            }
        },
        [token, fetchClientes, page]
    );

    const addCliente = useCallback(
        async (payload: Parameters<typeof ClienteService.create>[0]) => {
            if (!token) throw new Error('No auth token');
            try {
                const created = await ClienteService.create(payload, token);
                setClientes((prev) => [created, ...prev]);
                return created;
            } catch (err: any) {
                showError(err, 'Error al crear el cliente');
                setError(err.message || 'Error creando cliente');
                throw err;
            }
        },
        [token, showError]
    );

    const updateCliente = useCallback(
        async (id: number, payload: Parameters<typeof ClienteService.update>[1]) => {
            if (!token) throw new Error('No auth token');
            try {
                const updated = await ClienteService.update(id, payload, token);
                setClientes((prev) => prev.map((c) => (c.id === id ? updated : c)));
                return updated;
            } catch (err: any) {
                showError(err, 'Error al actualizar el cliente');
                setError(err.message || 'Error actualizando cliente');
                throw err;
            }
        },
        [token, showError]
    );

    const changeStatus = useCallback(
        async (id: number, status: 'active' | 'inactive') => {
            if (!token) throw new Error('No auth token');
            try {
                const updated = await ClienteService.changeStatus(id, status, token);
                setClientes((prev) => prev.map((c) => (c.id === id ? updated : c)));
                return updated;
            } catch (err: any) {
                showError(err, 'Error al cambiar el estado del cliente');
                setError(err.message || 'Error cambiando estado del cliente');
                throw err;
            }
        },
        [token, showError]
    );

    return {
        clientes,
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
        fetchClientes,
        onRefresh,
        changePage,
        removeCliente,
        addCliente,
        updateCliente,
        changeStatus,
    };
}
