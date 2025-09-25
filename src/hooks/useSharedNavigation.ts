import { useCallback } from 'react';
import { useSmartNavigation } from './useSmartNavigation';
import { useAuth } from '../context/AuthContext';

export function useSharedNavigation() {
  const { navigate, goBack } = useSmartNavigation();
  const { user } = useAuth();

  // Navegación a listas compartidas
  const navigateToTecnicos = useCallback(() => {
    navigate('TecnicoList');
  }, [navigate]);

  const navigateToEquipos = useCallback(() => {
    navigate('EquipoList');
  }, [navigate]);

  // Navegación a detalles
  const navigateToDetalleTecnico = useCallback((id: number) => {
    navigate('DetalleTecnico', { id });
  }, [navigate]);

  const navigateToDetalleEquipo = useCallback((id: number) => {
    navigate('DetalleEquipoAdmin', { id });
  }, [navigate]);

  // Navegación a creación
  const navigateToCrearTecnico = useCallback(() => {
    navigate('CrearTecnico');
  }, [navigate]);

  const navigateToCrearEquipo = useCallback(() => {
    navigate('CrearEquipo');
  }, [navigate]);

  // Navegación a edición
  const navigateToEditarTecnico = useCallback((id: number) => {
    navigate('EditarTecnico', { id });
  }, [navigate]);

  const navigateToEditarEquipo = useCallback((id: number) => {
    navigate('EditarEquipo', { id });
  }, [navigate]);

  // Navegación de vuelta al dashboard según el rol
  const navigateToDashboard = useCallback(() => {
    if (user?.role === 'coordinador') {
      navigate('CoordinadorDashboard');
    } else if (user?.role === 'administrador') {
      navigate('AdminDashboard');
    } else {
      goBack();
    }
  }, [navigate, goBack, user?.role]);

  return {
    // Navegación a listas
    navigateToTecnicos,
    navigateToEquipos,
    
    // Navegación a detalles
    navigateToDetalleTecnico,
    navigateToDetalleEquipo,
    
    // Navegación a creación
    navigateToCrearTecnico,
    navigateToCrearEquipo,
    
    // Navegación a edición
    navigateToEditarTecnico,
    navigateToEditarEquipo,
    
    // Navegación general
    navigateToDashboard,
    goBack,
  };
}
