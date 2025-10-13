// src/hooks/cliente/useClientes.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Cliente } from '../../types/cliente/cliente';
import { PaginationData } from '../../components/PaginationControls';
import { ClienteService, ClientesResponse } from '../../services/ClienteService';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { useSimpleListFetch } from '../useSimpleListFetch';

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

    const fetchClientesFunction = useCallback(async (page: number, filters?: string) => {
        if (!token) throw new Error('No auth token');
        
        const resp: ClientesResponse = await ClienteService.getAll(
            token,
            page,
            filters
        );

        return {
            data: resp.data,
            pagination: ClienteService.mapToPaginationData(resp)
        };
    }, [token, perPage]);

    const {
        items: clientes,
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
    } = useSimpleListFetch(fetchClientesFunction, {
        initialPage,
        perPage,
        debounceMs
    });

    const removeCliente = useCallback(
        async (id: number) => {
            if (!token) throw new Error('No auth token');
            try {
                await ClienteService.remove(id, token);
                // Forzar actualización después de eliminar
                await forceUpdate();
                return true;
            } catch (err: any) {
                console.error('removeCliente error', err);
                showError(err, 'Error al eliminar el cliente');
                return false;
            }
        },
        [token, showError, forceUpdate]
    );

    const addCliente = useCallback(
        async (payload: Parameters<typeof ClienteService.create>[0]) => {
            if (!token) throw new Error('No auth token');
            try {
                const created = await ClienteService.create(payload, token);
                // Forzar actualización
                await forceUpdate();
                return created;
            } catch (err: any) {
                showError(err, 'Error al crear el cliente');
                throw err;
            }
        },
        [token, showError, forceUpdate]
    );

    const updateCliente = useCallback(
        async (id: number, payload: Parameters<typeof ClienteService.update>[1]) => {
            if (!token) throw new Error('No auth token');
            try {
                const updated = await ClienteService.update(id, payload, token);
                // Forzar actualización
                await forceUpdate();
                return updated;
            } catch (err: any) {
                showError(err, 'Error al actualizar el cliente');
                throw err;
            }
        },
        [token, showError, forceUpdate]
    );

    const changeStatus = useCallback(
        async (id: number, status: 'active' | 'inactive') => {
            if (!token) throw new Error('No auth token');
            try {
                const updated = await ClienteService.changeStatus(id, status, token);
                // Forzar actualización
                await forceUpdate();
                return updated;
            } catch (err: any) {
                showError(err, 'Error al cambiar el estado del cliente');
                throw err;
            }
        },
        [token, showError, forceUpdate]
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
        fetchClientes: fetchData, // Mantener compatibilidad
        onRefresh,
        changePage,
        removeCliente,
        addCliente,
        updateCliente,
        changeStatus,
        forceUpdate
    };
}
