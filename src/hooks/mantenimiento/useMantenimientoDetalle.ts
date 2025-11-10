import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { verifyMaintenancePayment } from '../../services/MantenimientoService';
import { MantenimientoInformationService, MaintenanceInformation } from '../../services/MantenimientoInformationService';

export function useMantenimientoDetalle(mantenimientoId: number) {
  const { token } = useAuth();
  const { showError } = useError();
  
  const [mantenimiento, setMantenimiento] = useState<MaintenanceInformation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMantenimiento = useCallback(async () => {
    if (!token) {
      setError('No hay token de autenticación');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await MantenimientoInformationService.getMaintenanceInformation(mantenimientoId, token);
      setMantenimiento(data);
    } catch (err: any) {
      // Error log removed
      showError(err, 'Error al cargar los detalles del mantenimiento');
      setError(err?.response?.data?.message || err.message || 'Error al cargar mantenimiento');
      setMantenimiento(null);
    } finally {
      setLoading(false);
    }
  }, [mantenimientoId, token, showError]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMantenimiento();
    } catch (error) {
      // Error handled by fetchMantenimiento
    } finally {
      setRefreshing(false);
    }
  }, [fetchMantenimiento]);

  const handleVerifyPayment = useCallback(async () => {
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    try {
      console.log('🔍 Verificando pago para mantenimiento:', mantenimientoId);
      const response = await verifyMaintenancePayment(mantenimientoId, token);
      // Log removed
      
      // Refrescar los datos después de verificar
      await fetchMantenimiento();
      return { success: true, message: 'El pago ha sido verificado exitosamente.' };
    } catch (error: any) {
      // Error log removed
      showError(error, 'Error al verificar el pago');
      throw error;
    }
  }, [mantenimientoId, token, showError, fetchMantenimiento]);

  useEffect(() => {
    fetchMantenimiento();
  }, [fetchMantenimiento]);

  return {
    mantenimiento,
    loading,
    refreshing,
    error,
    fetchMantenimiento,
    onRefresh,
    handleVerifyPayment,
  };
}

