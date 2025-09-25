import { useState, useCallback, useEffect, useRef } from 'react';
import { CoordinadorMantenimiento, CoordinadorMantenimientoService, AsignarMantenimientoPayload } from '../../services/CoordinadorMantenimientoService';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';

export function useMantenimientosSinAsignar() {
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

      const data = await CoordinadorMantenimientoService.getMantenimientosSinAsignarCoordinador(token);
      
      if (!mountedRef.current) return;
      setMantenimientos(data);
    } catch (err: any) {
      if (!mountedRef.current) return;
      console.error('Error fetching mantenimientos:', err);
      showError(err, 'Error al cargar los mantenimientos');
      setError('Error al cargar los mantenimientos');
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

  const asignarTecnico = useCallback(async (mantenimientoId: number, payload: AsignarMantenimientoPayload) => {
    if (!token) throw new Error('No hay token de autenticación');
    
    try {
      const result = await CoordinadorMantenimientoService.asignarTecnicoCoordinador(mantenimientoId, payload, token);
      
      // Actualizar la lista removiendo el mantenimiento asignado
      setMantenimientos(prev => prev.filter(m => m.id !== mantenimientoId));
      
      return result;
    } catch (err: any) {
      console.error('Error asignando técnico:', err);
      showError(err, 'Error al asignar el técnico');
      throw err;
    }
  }, [token, showError]);

  useEffect(() => {
    if (token) {
      fetchMantenimientos();
    }
  }, [token, fetchMantenimientos]);

  return {
    mantenimientos,
    loading,
    refreshing,
    error,
    fetchMantenimientos,
    onRefresh,
    asignarTecnico,
  };
}
