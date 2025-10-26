import { useCallback, useEffect, useRef, useState } from 'react';
import { Tecnico } from '../../types/tecnico/tecnico';
import { TecnicoService } from '../../services/TecnicoService';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';

/**
 * Hook para manejar el detalle de UN tecnico.
 * - SRP: se encarga solo de la lógica (fetch, refresh, delete, update, changeStatus)
 * - DIP: acepta opcionalmente un "service" para pruebas o swapping.
 */
type UseTecnicoOptions = {
    autoFetch?: boolean;
    service?: typeof TecnicoService;
};

export function useTecnico(
    id: number | null | undefined,
    { autoFetch = true, service = TecnicoService }: UseTecnicoOptions = {}
) {
    const { token } = useAuth();
    const { showError } = useError();
    const [tecnico, setTecnico] = useState<Tecnico | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<boolean>(false); // para operaciones: delete / status change

    const mountedRef = useRef(true);
    useEffect(() => () => { mountedRef.current = false; }, []);

    const fetchTecnico = useCallback(async () => {
        if (!token || !id) return;
        try {
            setLoading(true);
            setError(null);
            const resp = await service.getOne(id, token);
            if (!mountedRef.current) return;
            setTecnico(resp);
            return resp;
        } catch (err: any) {
            if (!mountedRef.current) return;
            showError(err, 'Error al cargar los datos del técnico');
            const msg = err?.response?.data?.message || err.message || 'Error cargando técnico';
            setError(msg);
            setTecnico(null);
            throw err;
        } finally {
            if (!mountedRef.current) return;
            setLoading(false);
        }
    }, [id, token, service]);

    useEffect(() => {
        if (autoFetch && id && token) {
            fetchTecnico().catch(() => {});
        }
    }, [autoFetch, fetchTecnico, id, token]);

    const onRefresh = useCallback(async () => {
        if (!id || !token) return;
        setRefreshing(true);
        try {
            await fetchTecnico();
        } finally {
            if (mountedRef.current) setRefreshing(false);
        }
    }, [fetchTecnico, id, token]);

    const removeTecnico = useCallback(async () => {
        if (!id || !token) {
            throw new Error('No auth or id');
        }
        try {
            setBusy(true);
            await service.remove(id, token);
            // el caller debe decidir navegar atrás
            return true;
        } catch (err: any) {
            // Error log removed
            showError(err, 'Error al eliminar el técnico');
            const msg = err?.response?.data?.message || err.message || 'Error eliminando técnico';
            setError(msg);
            return false;
        } finally {
            if (mountedRef.current) setBusy(false);
        }
    }, [id, token, service]);

    const changeStatus = useCallback(async (newStatus: 'active' | 'inactive') => {
        if (!id || !token) throw new Error('No auth or id');
        const prev = tecnico?.status ?? null;
        try {
            setBusy(true);
            setTecnico((t) => (t ? { ...t, status: newStatus } : t));
            const updated = await service.changeStatus(id, newStatus, token);
            if (mountedRef.current) setTecnico(updated);
            return updated;
        } catch (err: any) {
            // revertir
            if (mountedRef.current) setTecnico((t) => (t ? { ...t, status: prev ?? t.status } : t));
            showError(err, 'Error al cambiar el estado del técnico');
            const msg = err?.response?.data?.message || err.message || 'Error cambiando estado';
            setError(msg);
            throw err;
        } finally {
            if (mountedRef.current) setBusy(false);
        }
    }, [id, token, service, tecnico?.status]);

    const updateTecnico = useCallback(async (payload: Partial<Tecnico>) => {
        if (!id || !token) throw new Error('No auth or id');
        try {
            setBusy(true);
            const updated = await service.update(id, payload as any, token);
            if (mountedRef.current) setTecnico(updated);
            return updated;
        } catch (err: any) {
            showError(err, 'Error al actualizar el técnico');
            const msg = err?.response?.data?.message || err.message || 'Error actualizando técnico';
            setError(msg);
            throw err;
        } finally {
            if (mountedRef.current) setBusy(false);
        }
    }, [id, token, service, showError]);

    return {
        tecnico,
        setTecnico,
        loading,
        refreshing,
        error,
        busy,
        fetchTecnico,
        onRefresh,
        removeTecnico,
        changeStatus,
        updateTecnico,
    };
}
