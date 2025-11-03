import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { useMaintenanceActions } from '../../hooks/tecnico';
import TecnicoMantenimientosService, {
  TecnicoMaintenance,
} from '../../services/TecnicoMantenimientosService';
import BackButton from '../../components/BackButton';

type RouteParams = {
  maintenanceId: number;
};

export default function DetalleMantenimiento({ route }: { route: { params: RouteParams } }) {
  const { goBack, navigate } = useSmartNavigation();
  const { token } = useAuth();
  const { showError } = useError();
  const { maintenanceId } = route.params;
  const { resuming, resumeMaintenance } = useMaintenanceActions();

  const [maintenance, setMaintenance] = useState<TecnicoMaintenance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaintenanceDetail();
  }, [maintenanceId]);

  const loadMaintenanceDetail = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await TecnicoMantenimientosService.getMaintenanceDetail(
        token,
        maintenanceId
      );

      if (response.success) {
        setMaintenance(response.data);
      } else {
        throw new Error(response.message || 'Error al cargar el detalle');
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
      showError(error);
      goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = useCallback((status: string) => {
    switch (status) {
      case 'assigned':
        return {
          color: '#007AFF',
          bgColor: '#E6F3FF',
          icon: 'document-text-outline' as const,
          label: 'Asignado',
        };
      case 'in_progress':
        return {
          color: '#5856D6',
          bgColor: '#EEEEFC',
          icon: 'trending-up' as const,
          label: 'En Progreso',
        };
      case 'completed':
        return {
          color: '#34C759',
          bgColor: '#E8F5E8',
          icon: 'checkmark-circle' as const,
          label: 'Completado',
        };
      default:
        return {
          color: '#666',
          bgColor: '#F0F0F0',
          icon: 'help' as const,
          label: 'Desconocido',
        };
    }
  }, []);

  // Debe ejecutarse en todas las renderizaciones (antes de returns condicionales)
  const statusConfig = useMemo(
    () => getStatusConfig(maintenance?.status ?? 'assigned'),
    [maintenance?.status, getStatusConfig]
  );

  const handleReprogramar = useCallback(() => {
    Alert.alert(
      'Reprogramar Mantenimiento',
      '¿Deseas reprogramar este mantenimiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reprogramar',
          onPress: () => {
            // TODO: Implementar lógica de reprogramación
            Alert.alert('Info', 'Funcionalidad en desarrollo');
          },
        },
      ]
    );
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando detalle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!maintenance) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>No se pudo cargar el mantenimiento</Text>
          <TouchableOpacity style={styles.retryButton} onPress={goBack}>
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // statusConfig ya memoizado arriba

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={goBack} color="#000" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>Detalle Mantenimiento</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información del Cliente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Información del Cliente</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cliente:</Text>
              <Text style={styles.infoValue}>{maintenance.client.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dirección:</Text>
              <Text style={styles.infoValue}>{maintenance.client.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contacto:</Text>
              <Text style={styles.infoValue}>{maintenance.client.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>{maintenance.client.phone}</Text>
            </View>
          </View>
        </View>

        {/* Detalles del Servicio */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Detalles del Servicio</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <Text style={styles.infoValue}>
                {maintenance.type === 'preventive' ? 'Preventivo' : 'Correctivo'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha:</Text>
              <Text style={styles.infoValue}>
                {TecnicoMantenimientosService.formatDate(maintenance.date_maintenance)} - {maintenance.shift}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Máquinas:</Text>
              <Text style={styles.infoValue}>{maintenance.device.length} equipos</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Equipos a Mantener */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Equipos a Mantener</Text>
          </View>
          {maintenance.device.map((device, index) => (
            <View key={device.id} style={styles.deviceCard}>
              <View style={styles.deviceHeader}>
                <View style={styles.deviceIcon}>
                  <MaterialIcons 
                    name={TecnicoMantenimientosService.getEquipmentIcon(device.type) as any} 
                    size={24} 
                    color="#007AFF" 
                  />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>
                    {TecnicoMantenimientosService.getEquipmentName(device)}
                  </Text>
                  <Text style={styles.deviceSerial}>{device.type} - Serie: {device.serial}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Agregar Comentario */}
        {maintenance.description && (
          <View style={styles.section}>
            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>📝 Descripción</Text>
              <Text style={styles.commentText}>{maintenance.description}</Text>
            </View>
          </View>
        )}

        {/* Botones de Acción */}
        <View style={styles.actionsContainer}>
          {maintenance.status === 'assigned' && (
            <>
              <TouchableOpacity 
                style={[styles.startButton, resuming && styles.startButtonDisabled]} 
                onPress={async () => {
                  // Si ya tiene started_at, significa que fue pausado y debe reanudar
                  if (maintenance.started_at) {
                    // Llamar al endpoint de resume
                    const success = await resumeMaintenance(maintenance.id);
                    if (success) {
                      // Navegar a la pantalla de progreso
                      navigate('MantenimientoEnProgreso', { maintenanceId: maintenance.id });
                    }
                  } else {
                    // Primera vez: ir a capturar fotos iniciales
                    navigate('IniciarMantenimiento', { maintenanceId: maintenance.id });
                  }
                }}
                disabled={resuming}
              >
                {resuming ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons 
                      name={maintenance.started_at ? "play-circle" : "camera"} 
                      size={20} 
                      color="#fff" 
                    />
                    <Text style={styles.startButtonText}>
                      {maintenance.started_at ? 'Reanudar Mantenimiento' : 'Iniciar Mantenimiento'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.reprogramButton} onPress={handleReprogramar}>
                <Ionicons name="calendar" size={20} color="#007AFF" />
                <Text style={styles.reprogramButtonText}>Reprogramar Mantenimiento</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  deviceSerial: {
    fontSize: 13,
    color: '#666',
  },
  commentSection: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsContainer: {
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#C7C7CC',
    opacity: 0.6,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  reprogramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    gap: 8,
  },
  reprogramButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

