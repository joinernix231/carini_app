import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { useAuth } from '../../context/AuthContext';
import { TecnicoMantenimientosService } from '../../services/TecnicoMantenimientosService';
import { LinearGradient } from 'expo-linear-gradient';
import type { TecnicoMaintenance } from '../../types/mantenimiento/mantenimiento';
import type { MaintenanceProgressResponse, DeviceProgress } from '../../services/TecnicoMantenimientosService';

type RouteParams = {
  maintenanceId: number;
};

export default function MantenimientoCompletado({ route }: { route: { params: RouteParams } }) {
  const { navigateReset } = useSmartNavigation();
  const { token } = useAuth();
  const { maintenanceId } = route.params;

  const [maintenance, setMaintenance] = useState<TecnicoMaintenance | null>(null);
  const [progressData, setProgressData] = useState<MaintenanceProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaintenanceDetail();
    loadProgress();
  }, [maintenanceId]);

  // Bloquear navegación hacia atrás
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Prevenir que el usuario regrese con el botón de atrás
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [])
  );

  const loadMaintenanceDetail = async () => {
    if (!token) return;

    try {
      const response = await TecnicoMantenimientosService.getMaintenanceDetail(
        token,
        maintenanceId
      );

      if (response.success) {
        setMaintenance(response.data);
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
    }
  };

  const loadProgress = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await TecnicoMantenimientosService.getMaintenanceProgress(
        token,
        maintenanceId
      );

      if (response.success) {
        setProgressData(response);
      }
    } catch (error) {
      console.error('Error cargando progreso:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMaintenances = () => {
    // Resetear la navegación para que no pueda volver atrás
    navigateReset('MisMantenimientos');
  };

  // Calcular duración
  const calculateDuration = () => {
    if (!maintenance?.started_at || !maintenance?.completed_at) return '00:00:00';
    
    const start = new Date(maintenance.started_at);
    const end = new Date(maintenance.completed_at);
    const diff = end.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Calcular tiempo por item basado en el progreso
  const calculateTimePerItem = useMemo(() => {
    if (!maintenance?.started_at || !maintenance?.completed_at || !progressData?.data) {
      return null;
    }

    const start = new Date(maintenance.started_at);
    const end = new Date(maintenance.completed_at);
    const totalTimeMs = end.getTime() - start.getTime();

    // Calcular total de items completados desde el progreso
    let totalItemsCompleted = 0;
    if (progressData.data.devices) {
      progressData.data.devices.forEach((device: DeviceProgress) => {
        totalItemsCompleted += device.progress_completed_count || 0;
      });
    }

    if (totalItemsCompleted === 0) return null;

    const timePerItemMs = totalTimeMs / totalItemsCompleted;
    const minutes = Math.floor(timePerItemMs / (1000 * 60));
    const seconds = Math.floor((timePerItemMs % (1000 * 60)) / 1000);

    return {
      totalItems: totalItemsCompleted,
      timePerItem: `${minutes}min ${seconds}seg`,
      totalTime: calculateDuration(),
    };
  }, [maintenance, progressData]);

  // Obtener estadísticas del progreso
  const progressStats = useMemo(() => {
    if (!progressData?.data) {
      return { completed: 0, total: 0, machines: 0 };
    }

    let totalCompleted = 0;
    let totalItems = 0;
    const devices = progressData.data.devices || [];

    devices.forEach((device: DeviceProgress) => {
      totalCompleted += device.progress_completed_count || 0;
      totalItems += device.progress_total || 0;
    });

    return {
      completed: totalCompleted,
      total: totalItems,
      machines: devices.length,
    };
  }, [progressData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const duration = calculateDuration();
  const machinesCount = maintenance?.device?.length || 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <LinearGradient
        colors={['#F8F9FA', '#FFFFFF']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Checkmark de Éxito */}
          <View style={styles.successContainer}>
            <View style={styles.checkmarkContainer}>
              <View style={styles.checkmarkInner}>
                <Ionicons name="checkmark" size={64} color="#fff" />
              </View>
            </View>
            <Text style={styles.successTitle}>¡Excelente Trabajo!</Text>
            <Text style={styles.successSubtitle}>
              El mantenimiento se ha completado exitosamente
            </Text>
          </View>

        {/* Resumen del Servicio */}
        <View style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="document-text" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.cardTitle}>Resumen del Servicio</Text>
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cliente:</Text>
              <Text style={styles.summaryValue}>
                {maintenance?.client?.name || 'N/A'}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fecha:</Text>
              <Text style={styles.summaryValue}>
                {maintenance?.scheduled_date 
                  ? new Date(maintenance.scheduled_date).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duración:</Text>
              <Text style={styles.summaryValue}>{duration}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Máquinas:</Text>
              <Text style={styles.summaryValue}>
                {machinesCount} {machinesCount === 1 ? 'equipo' : 'equipos'}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tareas:</Text>
              <Text style={styles.summaryValue}>
                {progressStats.completed}/{progressStats.total} completadas
              </Text>
            </View>
          </View>
        </View>

        {/* Tiempo de Items */}
        {calculateTimePerItem && (
          <View style={styles.timeCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="time-outline" size={20} color="#10B981" />
              </View>
              <Text style={styles.cardTitle}>Tiempo de Ejecución</Text>
            </View>
            
            <View style={styles.timeContent}>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Tiempo Total:</Text>
                <Text style={styles.timeValue}>{calculateTimePerItem.totalTime}</Text>
              </View>
              
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Items Completados:</Text>
                <Text style={styles.timeValue}>{calculateTimePerItem.totalItems} items</Text>
              </View>
              
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Tiempo Promedio por Item:</Text>
                <Text style={styles.timeValueHighlight}>{calculateTimePerItem.timePerItem}</Text>
              </View>
            </View>

            {/* Progreso por Dispositivo */}
            {progressData?.data?.devices && progressData.data.devices.length > 0 && (
              <View style={styles.devicesProgressContainer}>
                <Text style={styles.devicesProgressTitle}>Progreso por Equipo</Text>
                {progressData.data.devices.map((device: DeviceProgress) => {
                  const deviceInfo = maintenance?.device?.find(
                    (d) => d.client_device_id === device.client_device_id
                  );
                  return (
                    <View key={device.client_device_id} style={styles.deviceProgressCard}>
                      <View style={styles.deviceProgressHeader}>
                        <View style={styles.deviceProgressInfo}>
                          <Text style={styles.deviceProgressName}>
                            {deviceInfo?.brand} {deviceInfo?.model}
                          </Text>
                          {deviceInfo?.serial && (
                            <Text style={styles.deviceProgressSerial}>
                              S/N: {deviceInfo.serial}
                            </Text>
                          )}
                        </View>
                        <View style={styles.deviceProgressBadge}>
                          <Text style={styles.deviceProgressBadgeText}>
                            {device.progress_pct || 0}%
                          </Text>
                        </View>
                      </View>
                      <View style={styles.deviceProgressBarContainer}>
                        <View
                          style={[
                            styles.deviceProgressBarFill,
                            { width: `${device.progress_pct || 0}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.deviceProgressDetails}>
                        {device.progress_completed_count || 0}/{device.progress_total || 0} items completados
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Reporte Generado */}
        <View style={styles.reportCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.cardTitle}>Reporte Generado</Text>
          </View>
          <Text style={styles.reportText}>
            El reporte del mantenimiento ha sido enviado al cliente y guardado en el sistema
          </Text>
          
        </View>

        {/* Botón Principal para Volver */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleBackToMaintenances}
            activeOpacity={0.8}
          >
            <Ionicons name="list" size={22} color="#fff" />
            <Text style={styles.primaryButtonText}>Volver a Mis Mantenimientos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  checkmarkContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  checkmarkInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryContent: {
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  summaryValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  timeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeContent: {
    gap: 16,
    marginTop: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  timeValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  timeValueHighlight: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  devicesProgressContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  devicesProgressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  deviceProgressCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  deviceProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deviceProgressInfo: {
    flex: 1,
  },
  deviceProgressName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  deviceProgressSerial: {
    fontSize: 12,
    color: '#6B7280',
  },
  deviceProgressBadge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deviceProgressBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  deviceProgressBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  deviceProgressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  deviceProgressDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
});

