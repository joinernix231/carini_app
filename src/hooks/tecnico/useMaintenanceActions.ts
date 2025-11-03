import { useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import TecnicoMantenimientosService from '../../services/TecnicoMantenimientosService';

interface UseMaintenanceActionsReturn {
  starting: boolean;
  pausing: boolean;
  resuming: boolean;
  startMaintenance: (maintenanceId: number) => Promise<boolean>;
  pauseMaintenance: (maintenanceId: number, reason: string) => Promise<boolean>;
  resumeMaintenance: (maintenanceId: number) => Promise<boolean>;
}

/**
 * Hook para manejar acciones de mantenimiento (start, pause, resume)
 * Incluye manejo automático de GPS y estados de carga
 */
export function useMaintenanceActions(): UseMaintenanceActionsReturn {
  const { token } = useAuth();
  const { showError } = useError();
  
  const [starting, setStarting] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [resuming, setResuming] = useState(false);

  /**
   * Obtiene la ubicación GPS del dispositivo
   */
  const getLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      console.log('📍 Solicitando permisos de ubicación...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos de Ubicación',
          'Necesitamos permisos de ubicación para realizar esta acción.',
          [{ text: 'OK' }]
        );
        return null;
      }

      console.log('📍 Obteniendo ubicación GPS...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      console.log('✅ Ubicación obtenida:', { latitude, longitude });
      
      return { latitude, longitude };
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      Alert.alert(
        'Error de GPS',
        'No se pudo obtener tu ubicación. Verifica que el GPS esté activado.',
        [{ text: 'OK' }]
      );
      return null;
    }
  };

  /**
   * Inicia un mantenimiento
   */
  const startMaintenance = async (maintenanceId: number): Promise<boolean> => {
    if (!token) {
      Alert.alert('Error', 'No hay sesión activa');
      return false;
    }

    try {
      setStarting(true);
      console.log('🚀 Iniciando mantenimiento:', maintenanceId);

      // Obtener ubicación GPS
      const location = await getLocation();
      if (!location) {
        setStarting(false);
        return false;
      }

      // Llamar al servicio
      const response = await TecnicoMantenimientosService.startMaintenance(
        token,
        maintenanceId,
        location
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al iniciar el mantenimiento');
      }

      console.log('✅ Mantenimiento iniciado exitosamente');
      return true;
    } catch (error: any) {
      console.error('❌ Error iniciando mantenimiento:', error);
      showError(error);
      Alert.alert(
        'Error',
        'No se pudo iniciar el mantenimiento. Por favor, intenta nuevamente.'
      );
      return false;
    } finally {
      setStarting(false);
    }
  };

  /**
   * Pausa un mantenimiento
   */
  const pauseMaintenance = async (maintenanceId: number, reason: string): Promise<boolean> => {
    if (!token) {
      Alert.alert('Error', 'No hay sesión activa');
      return false;
    }

    try {
      setPausing(true);
      console.log('⏸️ Pausando mantenimiento:', maintenanceId);

      // Obtener ubicación GPS
      const location = await getLocation();
      if (!location) {
        setPausing(false);
        return false;
      }

      // Llamar al servicio
      const response = await TecnicoMantenimientosService.pauseMaintenance(
        token,
        maintenanceId,
        location,
        reason
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al pausar el mantenimiento');
      }

      console.log('✅ Mantenimiento pausado exitosamente');
      return true;
    } catch (error: any) {
      console.error('❌ Error pausando mantenimiento:', error);
      showError(error);
      Alert.alert(
        'Error',
        'No se pudo pausar el mantenimiento. Por favor, intenta nuevamente.'
      );
      return false;
    } finally {
      setPausing(false);
    }
  };

  /**
   * Reanuda un mantenimiento pausado
   */
  const resumeMaintenance = async (maintenanceId: number): Promise<boolean> => {
    if (!token) {
      Alert.alert('Error', 'No hay sesión activa');
      return false;
    }

    try {
      setResuming(true);
      console.log('▶️ Reanudando mantenimiento:', maintenanceId);

      // Obtener ubicación GPS
      const location = await getLocation();
      if (!location) {
        setResuming(false);
        return false;
      }

      // Llamar al servicio
      const response = await TecnicoMantenimientosService.resumeMaintenance(
        token,
        maintenanceId,
        location
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al reanudar el mantenimiento');
      }

      console.log('✅ Mantenimiento reanudado exitosamente');
      return true;
    } catch (error: any) {
      console.error('❌ Error reanudando mantenimiento:', error);
      showError(error);
      Alert.alert(
        'Error',
        'No se pudo reanudar el mantenimiento. Por favor, intenta nuevamente.'
      );
      return false;
    } finally {
      setResuming(false);
    }
  };

  return {
    starting,
    pausing,
    resuming,
    startMaintenance,
    pauseMaintenance,
    resumeMaintenance,
  };
}


