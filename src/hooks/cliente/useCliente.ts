// src/hooks/cliente/useCliente.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { Cliente } from '../../types/cliente/cliente';
import { ClienteService } from '../../services/ClienteService';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';

export function useCliente(id: number) {
    const { token } = useAuth();
    const { showError } = useError();
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const mountedRef = useRef(true);
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const fetchCliente = useCallback(async () => {
        if (!token || !id) {
            if (mountedRef.current) {
                setLoading(false);
            }
            return;
        }

        try {
            if (mountedRef.current) {
                setLoading(true);
                setError(null);
            }

            // Timeout de seguridad para evitar carga infinita
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout: La solicitud tardó demasiado')), 10000);
            });

            const data = await Promise.race([
                ClienteService.getById(id, token),
                timeoutPromise
            ]) as Cliente;

            if (!mountedRef.current) return;

            setCliente(data);
        } catch (err: any) {
            if (!mountedRef.current) return;
            
            // Usar el sistema de errores global
            showError(err, 'Error al cargar los datos del cliente');
            const errorMessage = err?.response?.data?.message || err?.message || 'Error cargando cliente';
            setError(errorMessage);
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [token, id, showError]);

    useEffect(() => {
        fetchCliente();
    }, [fetchCliente]);

    const updateCliente = useCallback(
        async (payload: Parameters<typeof ClienteService.update>[1]) => {
            console.log('🔍 useCliente - updateCliente called with payload:', payload);
            console.log('🔍 useCliente - token available:', !!token);
            console.log('🔍 useCliente - id:', id);
            
            if (!token || !id) throw new Error('No auth token or ID');
            try {
                console.log('🔍 useCliente - Calling ClienteService.update');
                const updated = await ClienteService.update(id, payload, token);
                // Log removed
                setCliente(updated);
                return updated;
            } catch (err: any) {
                // Error log removed
                showError(err, 'Error al actualizar el cliente');
                setError(err.message || 'Error actualizando cliente');
                throw err;
            }
        },
        [token, id, showError]
    );

    const changeStatus = useCallback(
        async (status: 'active' | 'inactive') => {
            if (!token || !id) throw new Error('No auth token or ID');
            try {
                const updated = await ClienteService.changeStatus(id, status, token);
                setCliente(updated);
                return updated;
            } catch (err: any) {
                showError(err, 'Error al cambiar el estado del cliente');
                setError(err.message || 'Error cambiando estado del cliente');
                throw err;
            }
        },
        [token, id, showError]
    );

    const removeCliente = useCallback(async () => {
        if (!token || !id) throw new Error('No auth token or ID');
        try {
            await ClienteService.remove(id, token);
            return true;
        } catch (err: any) {
            showError(err, 'Error al eliminar el cliente');
            setError(err.message || 'Error eliminando cliente');
            throw err;
        }
    }, [token, id, showError]);

    return {
        cliente,
        loading,
        error,
        fetchCliente,
        updateCliente,
        changeStatus,
        removeCliente,
    };
}



