import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { useFocusEffect } from '@react-navigation/native';

export interface ClienteDashboardData {
  equiposCount: number;
  mantenimientosPendientes: number;
  mantenimientosCompletados: number;
  ultimoMantenimiento?: {
    id: string;
    device: string;
    fecha: string;
    estado: string;
  };
}

export const useClienteDashboard = () => {
  const { token, user } = useAuth();
  const { showError } = useError();
  const [data, setData] = useState<ClienteDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Aquí se cargarían los datos del dashboard del cliente
      // Por ahora retornamos datos mock
      const mockData: ClienteDashboardData = {
        equiposCount: 5,
        mantenimientosPendientes: 2,
        mantenimientosCompletados: 8,
        ultimoMantenimiento: {
          id: '1',
          device: 'Equipo Industrial A',
          fecha: '2024-01-15',
          estado: 'Completado'
        }
      };
      
      setData(mockData);
    } catch (error) {
      // Error log removed
      showError('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Recargar datos cuando el usuario cambie (por actualización de perfil)
  useEffect(() => {
    if (token && user) {
      loadDashboardData();
    }
  }, [token, user?.name, user?.email, loadDashboardData]);

  // Recargar datos cuando la pantalla reciba foco
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        loadDashboardData();
      }
    }, [token, loadDashboardData])
  );

  return {
    data,
    loading,
    refresh: loadDashboardData
  };
};