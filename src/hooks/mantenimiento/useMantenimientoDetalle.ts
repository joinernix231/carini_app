import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { getMantenimientoById, verifyMaintenancePayment } from '../../services/MantenimientoService';
import { 
  MaintenanceType, 
  MaintenanceStatus, 
  PaymentStatus 
} from '../../services/CoordinadorMantenimientoService';

interface MantenimientoDetalle {
  id: number;
  type: MaintenanceType;
  date_maintenance: string | null;
  shift: string | null;
  status: MaintenanceStatus;
  value: number | null;
  spare_parts: string | null;
  is_paid: PaymentStatus;
  payment_support: string | null;
  created_at: string;
  description: string | null;
  photo: string | null;
  device: {
    id: number;
    model: string;
    brand: string;
    type: string;
    photo: string | null;
    pdf_url: string | null;
    description: string | null;
  };
  client: {
    id: number;
    name: string;
    phone: string;
    address: string;
    city: string;
    department: string;
  };
  technician?: {
    id: number;
    user: {
      name: string;
      email: string;
    };
    phone: string;
  };
}

export function useMantenimientoDetalle(mantenimientoId: number) {
  const { token } = useAuth();
  const { showError } = useError();
  
  const [mantenimiento, setMantenimiento] = useState<MantenimientoDetalle | null>(null);
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
      
      const data = await getMantenimientoById(mantenimientoId, token);
      setMantenimiento(data);
    } catch (err: any) {
      console.error('Error al cargar mantenimiento:', err);
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
      console.log('✅ Respuesta de verificación:', response);
      
      // Refrescar los datos después de verificar
      await fetchMantenimiento();
      return { success: true, message: 'El pago ha sido verificado exitosamente.' };
    } catch (error: any) {
      console.error('❌ Error verifying payment:', error);
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

