import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TecnicoMantenimientosService, { TecnicoMaintenance } from '../services/TecnicoMantenimientosService';

interface UseActiveMaintenanceReturn {
  hasActiveMaintenance: boolean;
  activeMaintenance: TecnicoMaintenance | null;
  isLoading: boolean;
  checkActiveMaintenance: () => Promise<void>;
}

/**
 * Hook para verificar si el técnico tiene un mantenimiento activo
 * Se usa principalmente al iniciar la app para redirigir automáticamente
 */
export function useActiveMaintenance(): UseActiveMaintenanceReturn {
  const { token, user } = useAuth();
  const [hasActiveMaintenance, setHasActiveMaintenance] = useState(false);
  const [activeMaintenance, setActiveMaintenance] = useState<TecnicoMaintenance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkActiveMaintenance = async () => {
    if (!token || user?.role !== 'tecnico') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔍 useActiveMaintenance: Verificando mantenimiento activo...');

      const response = await TecnicoMantenimientosService.getActiveMaintenance(token);

      if (response.success && response.data) {
        setHasActiveMaintenance(response.data.has_active_maintenance);
        setActiveMaintenance(response.data.maintenance);

        if (response.data.has_active_maintenance) {
          console.log('⚠️ Mantenimiento activo encontrado:', response.data.maintenance?.id);
        } else {
          console.log('✅ No hay mantenimientos activos');
        }
      }
    } catch (error) {
      console.error('❌ Error verificando mantenimiento activo:', error);
      // En caso de error, asumir que no hay mantenimiento activo
      setHasActiveMaintenance(false);
      setActiveMaintenance(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'tecnico') {
      checkActiveMaintenance();
    } else {
      setIsLoading(false);
    }
  }, [token, user?.role]);

  return {
    hasActiveMaintenance,
    activeMaintenance,
    isLoading,
    checkActiveMaintenance,
  };
}


