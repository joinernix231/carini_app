// src/hooks/equipo/useEquipo.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { Equipo } from '../../types/equipo/equipo';
import { EquipoService } from '../../services/EquipoService';
import { useAuth } from '../../context/AuthContext';

export function useEquipo(id: number) {
    const { token } = useAuth();
    const [equipo, setEquipo] = useState<Equipo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const mountedRef = useRef(true);
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const fetchEquipo = useCallback(async () => {
        if (!token || !id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const data = await EquipoService.getOne(id, token);

            if (!mountedRef.current) return;

            setEquipo(data);
        } catch (err: any) {
            console.error('useEquipo - fetch error', err);
            if (!mountedRef.current) return;
            setError(err.message || 'Error cargando equipo');
        } finally {
            if (!mountedRef.current) return;
            setLoading(false);
        }
    }, [token, id]);

    useEffect(() => {
        fetchEquipo();
    }, [fetchEquipo]);

    const updateEquipo = useCallback(
        async (payload: Parameters<typeof EquipoService.update>[1]) => {
            if (!token || !id) throw new Error('No auth token or ID');
            try {
                const updated = await EquipoService.update(id, payload, token);
                setEquipo(updated);
                return updated;
            } catch (err: any) {
                setError(err.message || 'Error actualizando equipo');
                throw err;
            }
        },
        [token, id]
    );

    const changeStatus = useCallback(
        async (status: 'active' | 'inactive') => {
            if (!token || !id) throw new Error('No auth token or ID');
            try {
                const updated = await EquipoService.changeStatus(id, status, token);
                setEquipo(updated);
                return updated;
            } catch (err: any) {
                setError(err.message || 'Error cambiando estado del equipo');
                throw err;
            }
        },
        [token, id]
    );

    const removeEquipo = useCallback(async () => {
        if (!token || !id) throw new Error('No auth token or ID');
        try {
            await EquipoService.remove(id, token);
            return true;
        } catch (err: any) {
            setError(err.message || 'Error eliminando equipo');
            throw err;
        }
    }, [token, id]);

    return {
        equipo,
        loading,
        error,
        fetchEquipo,
        updateEquipo,
        changeStatus,
        removeEquipo,
    };
}



