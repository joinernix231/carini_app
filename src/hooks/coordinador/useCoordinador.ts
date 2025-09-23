import { useCallback, useEffect, useRef, useState } from 'react';
import { CoordinadorService } from "../../services/CoordinadorService";
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import {Coordinador} from "../../types/coordinador/coordinador";

type UseCoordinadorOptions = {
    autoFetch?: boolean;
    service?: typeof CoordinadorService;
};

export function useCoordinador(
    id: number | null | undefined,
    { autoFetch = true, service = CoordinadorService }: UseCoordinadorOptions = {}
) {
    const { token } = useAuth();
    const { showError } = useError();
    const [coordinador, setCoordinador] = useState<Coordinador | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<boolean>(false); // para operaciones: delete / status change

    const mountedRef = useRef(true);
    useEffect(() => () => { mountedRef.current = false; }, []);

    const fetchCoordinador = useCallback(async () => {
        if (!token || !id) return;
        try {
            setLoading(true);
            setError(null);
            const resp = await service.getOne(id, token);
            if (!mountedRef.current) return;
            setCoordinador(resp);
            return resp;
        } catch (err: any) {
            if (!mountedRef.current) return;
            
            // Usar el sistema de errores global
            showError(err, 'Error al cargar los datos del coordinador');
            const msg = err?.response?.data?.message || err.message || 'Error cargando Coordinador';
            setError(msg);
            setCoordinador(null);
            throw err;
        } finally {
            if (!mountedRef.current) return;
            setLoading(false);
        }
    }, [id, token, service]);

    useEffect(() => {
        if (autoFetch && id && token) {
            fetchCoordinador().catch(() => {});
        }
    }, [autoFetch, fetchCoordinador, id, token]);

    const onRefresh = useCallback(async () => {
        if (!id || !token) return;
        setRefreshing(true);
        try {
            await fetchCoordinador();
        } finally {
            if (mountedRef.current) setRefreshing(false);
        }
    }, [fetchCoordinador, id, token]);

    const removeCoordinador = useCallback(async () => {
        if (!id || !token) {
            throw new Error('No auth or id');
        }
        try {
            setBusy(true);
            await service.remove(id, token);
            // el caller debe decidir navegar atrás
            return true;
        } catch (err: any) {
            console.error('removeCoordinador error', err);
            showError(err, 'Error al eliminar el coordinador');
            const msg = err?.response?.data?.message || err.message || 'Error eliminando Coordinador';
            setError(msg);
            return false;
        } finally {
            if (mountedRef.current) setBusy(false);
        }
    }, [id, token, service]);

    const changeStatus = useCallback(async (newStatus: 'active' | 'inactive') => {
        if (!id || !token) throw new Error('No auth or id');
        const prev = coordinador?.status ?? null;
        try {
            setBusy(true);
            setCoordinador((t) => (t ? { ...t, status: newStatus } : t));
            const updated = await service.changeStatus(id, newStatus, token);
            if (mountedRef.current) setCoordinador(updated);
            return updated;
        } catch (err: any) {
            // revertir
            if (mountedRef.current) setCoordinador((t) => (t ? { ...t, status: prev ?? t.status } : t));
            showError(err, 'Error al cambiar el estado del coordinador');
            const msg = err?.response?.data?.message || err.message || 'Error cambiando estado';
            setError(msg);
            throw err;
        } finally {
            if (mountedRef.current) setBusy(false);
        }
    }, [id, token, service, coordinador?.status]);

    const updateCoordinador = useCallback(async (payload: {
        name: string;
        identification: string;
        email: string | null;
        phone: string | null;
        address: string | null
    }) => {
        if (!id || !token) throw new Error('No auth or id');
        try {
            setBusy(true);
            const updated = await service.update(id, payload as any, token);
            if (mountedRef.current) setCoordinador(updated);
            return updated;
        } catch (err: any) {
            showError(err, 'Error al actualizar el coordinador');
            const msg = err?.response?.data?.message || err.message || 'Error actualizando Coordinador';
            setError(msg);
            throw err;
        } finally {
            if (mountedRef.current) setBusy(false);
        }
    }, [id, token, service, showError]);

    return {
        coordinador,
        setCoordinador,
        loading,
        refreshing,
        error,
        busy,
        fetchCoordinador,
        onRefresh,
        removeCoordinador,
        changeStatus,
        updateCoordinador,
    };
}
