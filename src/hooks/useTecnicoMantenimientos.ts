import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import TecnicoMantenimientosService, { 
  TecnicoMaintenance, 
  MaintenanceStatus,
  TecnicoMaintenancesParams 
} from '../services/TecnicoMantenimientosService';

export interface UseTecnicoMantenimientosReturn {
  maintenances: TecnicoMaintenance[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadMaintenances: (showLoading?: boolean) => Promise<void>;
  refreshMaintenances: () => Promise<void>;
  filterByStatus: (status: MaintenanceStatus | 'all') => Promise<void>;
  filterByDateRange: (dateFrom?: string, dateTo?: string) => Promise<void>;
  applyFilters: (status: MaintenanceStatus | 'all', dateFilter?: 'today' | 'week' | 'month') => Promise<void>;
  getStats: () => Promise<{
    total: number;
    assigned: number;
    in_progress: number;
    completed: number;
    today: number;
    thisWeek: number;
  }>;
}

export const useTecnicoMantenimientos = (): UseTecnicoMantenimientosReturn => {
  const { token } = useAuth();
  const { showError } = useError();
  
  const [maintenances, setMaintenances] = useState<TecnicoMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [currentDateFrom, setCurrentDateFrom] = useState<string | undefined>(undefined);
  const [currentDateTo, setCurrentDateTo] = useState<string | undefined>(undefined);

  const loadMaintenances = useCallback(async (showLoading = true) => {
    if (!token) return;
    
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const params: TecnicoMaintenancesParams = {};
      
      // Aplicar filtro de estado
      if (currentFilter !== 'all') {
        params.status = currentFilter;
      }
      
      // Aplicar filtro de fecha
      if (currentDateFrom) {
        params.date_from = currentDateFrom;
      }
      if (currentDateTo) {
        params.date_to = currentDateTo;
      }
      
      console.log('📅 Cargando mantenimientos con filtros:', params);
      
      const response = await TecnicoMantenimientosService.getMaintenances(token, params);
      
      if (response.success) {
        setMaintenances(response.data);
        console.log('✅ Mantenimientos cargados:', response.data.length);
      } else {
        throw new Error(response.message || 'Error al cargar mantenimientos');
      }
    } catch (err: any) {
      console.error('❌ Error cargando mantenimientos:', err);
      setError(err.message || 'Error desconocido');
      showError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, currentFilter, currentDateFrom, currentDateTo, showError]);

  const refreshMaintenances = useCallback(async () => {
    setRefreshing(true);
    await loadMaintenances(false);
  }, [loadMaintenances]);

  const filterByStatus = useCallback(async (status: MaintenanceStatus | 'all') => {
    setCurrentFilter(status);
    // loadMaintenances se llamará automáticamente por el useEffect
  }, []);

  const filterByDateRange = useCallback(async (dateFrom?: string, dateTo?: string) => {
    setCurrentDateFrom(dateFrom);
    setCurrentDateTo(dateTo);
    // loadMaintenances se llamará automáticamente por el useEffect
  }, []);

  const applyFilters = useCallback(async (
    status: MaintenanceStatus | 'all', 
    dateFilter?: 'today' | 'week' | 'month'
  ) => {
    setCurrentFilter(status);
    
    if (dateFilter) {
      const dates = TecnicoMantenimientosService.getFilterDates(dateFilter);
      setCurrentDateFrom(dates.date_from);
      setCurrentDateTo(dates.date_to);
    } else {
      setCurrentDateFrom(undefined);
      setCurrentDateTo(undefined);
    }
    // loadMaintenances se llamará automáticamente por el useEffect
  }, []);

  const getStats = useCallback(async () => {
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    try {
      return await TecnicoMantenimientosService.getMaintenancesStats(token);
    } catch (err: any) {
      console.error('Error obteniendo estadísticas:', err);
      showError(err);
      throw err;
    }
  }, [token, showError]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadMaintenances();
  }, [loadMaintenances]);

  return {
    maintenances,
    loading,
    refreshing,
    error,
    loadMaintenances,
    refreshMaintenances,
    filterByStatus,
    filterByDateRange,
    applyFilters,
    getStats,
  };
};
