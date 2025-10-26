import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { getMantenimientosAsignadosCoordinador, CoordinadorMantenimiento } from '../../services/CoordinadorMantenimientoService';

export function useMantenimientosAsignados() {
  const { token } = useAuth();
  const { showError } = useError();
  
  const [mantenimientos, setMantenimientos] = useState<CoordinadorMantenimiento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMantenimientos = useCallback(async () => {
    if (!token) {
      setError('No hay token de autenticación');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await getMantenimientosAsignadosCoordinador(token);
      setMantenimientos(data);
    } catch (err: any) {
      // Error log removed
      showError(err, 'Error al cargar los mantenimientos asignados');
      setError(err?.response?.data?.message || err.message || 'Error al cargar mantenimientos');
      setMantenimientos([]);
    } finally {
      setLoading(false);
    }
  }, [token, showError]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMantenimientos();
    } catch (error) {
      // Error handled by fetchMantenimientos
    } finally {
      setRefreshing(false);
    }
  }, [fetchMantenimientos]);

  useEffect(() => {
    fetchMantenimientos();
  }, [fetchMantenimientos]);

  return {
    mantenimientos,
    loading,
    refreshing,
    error,
    fetchMantenimientos,
    onRefresh,
  };
}
