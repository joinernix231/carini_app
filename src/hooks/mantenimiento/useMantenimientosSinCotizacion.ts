import { useState, useCallback, useEffect, useRef } from 'react';
import { CoordinadorMantenimiento, CoordinadorMantenimientoService } from '../../services/CoordinadorMantenimientoService';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';

export function useMantenimientosSinCotizacion() {
  const { token } = useAuth();
  const { showError } = useError();
  
  const [mantenimientos, setMantenimientos] = useState<CoordinadorMantenimiento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchMantenimientos = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await CoordinadorMantenimientoService.getMantenimientosSinCotizacion(token);
      
      if (!mountedRef.current) return;
      setMantenimientos(data);
    } catch (err: any) {
      if (!mountedRef.current) return;
      console.error('Error fetching mantenimientos sin cotización:', err);
      showError(err, 'Error al cargar los mantenimientos sin cotización');
      setError('Error al cargar los mantenimientos sin cotización');
      setMantenimientos([]);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, showError]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMantenimientos();
  }, [fetchMantenimientos]);

  useEffect(() => {
    fetchMantenimientos();
  }, [fetchMantenimientos]);

  return {
    mantenimientos,
    loading,
    refreshing,
    error,
    onRefresh,
    fetchMantenimientos,
  };
}

