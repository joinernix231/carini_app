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
  Image,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { useMaintenanceActions } from '../../hooks/tecnico';
import { TecnicoMantenimientosService, 
  TecnicoMaintenance,
  MaintenanceProgressResponse,
  DeviceProgress } from '../../services/TecnicoMantenimientosService';
import { MantenimientoInformationService, MaintenanceInformation } from '../../services/MantenimientoInformationService';
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
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInformation | null>(null);
  const [progressData, setProgressData] = useState<MaintenanceProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [markingOnTheWay, setMarkingOnTheWay] = useState(false);
  
  // Estados para secciones colapsables
  const [expandedSections, setExpandedSections] = useState({
    client: false, // Información del cliente colapsada por defecto
    devices: false, // Equipos colapsados por defecto
    photos: true, // Fotos expandidas por defecto
    time: true, // Tiempo expandido por defecto
    logs: false, // Logs colapsados por defecto
    progress: false, // Progreso colapsado por defecto
  });

  useEffect(() => {
    loadMaintenanceDetail();
    loadMaintenanceInformation();
  }, [maintenanceId]);

  useEffect(() => {
    // Cargar progreso solo si el mantenimiento está completado (usando last_action_log)
    const isCompleted = maintenance?.last_action_log?.action === 'end';
    if (isCompleted) {
      loadProgress();
    }
  }, [maintenance?.last_action_log?.action, maintenanceId]);

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

  const loadProgress = async () => {
    if (!token) return;

    try {
      const response = await TecnicoMantenimientosService.getMaintenanceProgress(
        token,
        maintenanceId
      );

      if (response.success) {
        setProgressData(response);
      }
    } catch (error) {
      console.error('Error cargando progreso:', error);
    }
  };

  const loadMaintenanceInformation = async () => {
    if (!token) return;

    try {
      const info = await MantenimientoInformationService.getMaintenanceInformation(
        maintenanceId,
        token
      );
      setMaintenanceInfo(info);
    } catch (error) {
      console.error('Error cargando información del mantenimiento:', error);
      // No mostrar error al usuario, solo log
    }
  };

  const handleMarkOnTheWay = async () => {
    if (!token) return;
    
    try {
      setMarkingOnTheWay(true);
      
      // Obtener GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos permisos de ubicación para marcar que estás en camino.');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Marcar como "en camino"
      const response = await TecnicoMantenimientosService.markOnTheWay(
        token,
        maintenanceId,
        { latitude, longitude }
      );
      
      if (response.success) {
        // Recargar ambos datos para actualizar la UI
        await Promise.all([
          loadMaintenanceDetail(),
          loadMaintenanceInformation()
        ]);
        
        Alert.alert(
          '✅ En Camino',
          'Has marcado que estás en camino al lugar del mantenimiento.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      showError(error, 'Error al marcar en camino');
    } finally {
      setMarkingOnTheWay(false);
    }
  };

  // Función para obtener el subestado basado en last_action_log
  // Según la documentación: NO usar status, usar last_action_log.action
  const getSubStatus = useCallback((maintenance: TecnicoMaintenance | null): string => {
    if (!maintenance) return 'assigned';
    
    // Si no hay last_action_log, está solo asignado (no activo)
    if (!maintenance.last_action_log) {
      return 'assigned';
    }
    
    // Usar last_action_log.action para determinar el estado real
    switch (maintenance.last_action_log.action) {
      case 'assign':
        return 'assigned';
      case 'on_the_way':
        return 'on_the_way';
      case 'start':
        return 'in_progress';
      case 'pause':
        return 'paused';
      case 'resume':
        return 'in_progress';
      case 'end':
        return 'completed';
      default:
        return 'assigned';
    }
  }, []);

  const getStatusConfig = useCallback((subStatus: string) => {
    switch (subStatus) {
      case 'assigned':
        return {
          color: '#007AFF',
          bgColor: '#E6F3FF',
          icon: 'document-text-outline' as const,
          label: 'Asignado',
        };
      case 'on_the_way':
        return {
          color: '#FFC107',
          bgColor: '#FFF9E6',
          icon: 'car' as const,
          label: 'En Camino',
        };
      case 'in_progress':
        return {
          color: '#5856D6',
          bgColor: '#EEEEFC',
          icon: 'trending-up' as const,
          label: 'En Progreso',
        };
      case 'paused':
        return {
          color: '#FF9800',
          bgColor: '#FFF3E0',
          icon: 'pause-circle' as const,
          label: 'Pausado',
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

  // Funciones para formatear logs
  const getLogActionText = useCallback((action: string) => {
    switch (action) {
      case 'assign':
        return 'Asignado';
      case 'on_the_way':
        return 'En Camino';
      case 'start':
        return 'Inicio';
      case 'pause':
        return 'Pausa';
      case 'resume':
        return 'Reanudación';
      case 'end':
        return 'Finalización';
      default:
        return action;
    }
  }, []);

  const getLogActionColor = useCallback((action: string) => {
    switch (action) {
      case 'assign':
        return '#007AFF';
      case 'on_the_way':
        return '#FFC107';
      case 'start':
        return '#10B981';
      case 'pause':
        return '#F59E0B';
      case 'resume':
        return '#3B82F6';
      case 'end':
        return '#34C759';
      default:
        return '#6B7280';
    }
  }, []);

  const getLogActionIcon = useCallback((action: string) => {
    switch (action) {
      case 'assign':
        return 'document-text';
      case 'on_the_way':
        return 'car';
      case 'start':
        return 'play-circle';
      case 'pause':
        return 'pause-circle';
      case 'resume':
        return 'play-forward-circle';
      case 'end':
        return 'checkmark-circle';
      default:
        return 'ellipse';
    }
  }, []);

  const formatLogDateTime = useCallback((dateString: string | null) => {
    if (!dateString) return 'No disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateString;
    }
  }, []);

  // Función para toggle de secciones
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Obtener subestado y configuración
  const subStatus = useMemo(() => getSubStatus(maintenance), [maintenance, getSubStatus]);
  const statusConfig = useMemo(
    () => getStatusConfig(subStatus),
    [subStatus, getStatusConfig]
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
        {/* Resumen Principal - Siempre visible */}
        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryTitleRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                  <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} />
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                </View>
                <Text style={styles.summaryId}>#{maintenance.id}</Text>
              </View>
              <Text style={styles.summaryClientName}>{maintenance.client.name}</Text>
              <View style={styles.summaryInfoGrid}>
                <View style={styles.summaryInfoItem}>
                  <Ionicons name="calendar" size={14} color="#666" />
                  <Text style={styles.summaryInfoText}>
                    {TecnicoMantenimientosService.formatDate(maintenance.date_maintenance)}
                  </Text>
                </View>
                <View style={styles.summaryInfoItem}>
                  <Ionicons name="time" size={14} color="#666" />
                  <Text style={styles.summaryInfoText}>{maintenance.shift}</Text>
                </View>
                <View style={styles.summaryInfoItem}>
                  <Ionicons name="construct" size={14} color="#666" />
                  <Text style={styles.summaryInfoText}>{maintenance.device.length} equipos</Text>
                </View>
                <View style={styles.summaryInfoItem}>
                  <Ionicons name="settings" size={14} color="#666" />
                  <Text style={styles.summaryInfoText}>
                    {maintenance.type === 'preventive' ? 'Preventivo' : 'Correctivo'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Información del Cliente - Colapsable */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('client')}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <Ionicons name="business" size={20} color="#007AFF" />
              <Text style={styles.collapsibleHeaderTitle}>Información del Cliente</Text>
            </View>
            <Ionicons
              name={expandedSections.client ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
          {expandedSections.client && (
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
          )}
        </View>

        {/* Equipos a Mantener - Colapsable */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('devices')}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <Ionicons name="construct" size={20} color="#007AFF" />
              <Text style={styles.collapsibleHeaderTitle}>
                Equipos a Mantener ({maintenance.device.length})
              </Text>
            </View>
            <Ionicons
              name={expandedSections.devices ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
          {expandedSections.devices && (
            <>
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
            </>
          )}
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

        {/* Fotos del Mantenimiento - Solo si está iniciado o completado - Colapsable */}
        {(() => {
          const lastAction = maintenance.last_action_log?.action;
          const isActive = lastAction === 'start' || lastAction === 'resume' || lastAction === 'pause';
          const isCompleted = lastAction === 'end';
          return (isActive || isCompleted) && maintenanceInfo;
        })() && maintenanceInfo && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => toggleSection('photos')}
              activeOpacity={0.7}
            >
              <View style={styles.collapsibleHeaderLeft}>
                <Ionicons name="camera-outline" size={20} color="#007AFF" />
                <Text style={styles.collapsibleHeaderTitle}>
                  Fotos del Mantenimiento
                  {maintenanceInfo.photos && maintenanceInfo.photos.length > 0 && (
                    <Text style={styles.collapsibleHeaderCount}> ({maintenanceInfo.photos.length})</Text>
                  )}
                </Text>
              </View>
              <Ionicons
                name={expandedSections.photos ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            {expandedSections.photos && (
              <>
                {maintenanceInfo.photos && maintenanceInfo.photos.length > 0 ? (
              <View style={styles.photosContainer}>
                {/* Fotos Iniciales */}
                {maintenanceInfo.photos.filter(p => p.photo_type === 'initial').length > 0 && (
                  <View style={styles.photoGroup}>
                    <Text style={styles.photoGroupTitle}>Fotos Iniciales</Text>
                    <View style={styles.photoGrid}>
                      {maintenanceInfo.photos
                        .filter(p => p.photo_type === 'initial')
                        .map((photo) => (
                          <TouchableOpacity
                            key={photo.id}
                            style={styles.photoItem}
                            onPress={() => setSelectedImage(photo.photo_url)}
                          >
                            <Image
                              source={{ uri: photo.photo_url }}
                              style={styles.photoThumbnail}
                              resizeMode="cover"
                            />
                            <View style={styles.photoOverlay}>
                              <Ionicons name="expand" size={16} color="#fff" />
                            </View>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                )}
                {/* Fotos Finales */}
                {maintenanceInfo.photos.filter(p => p.photo_type === 'final').length > 0 && (
                  <View style={styles.photoGroup}>
                    <Text style={styles.photoGroupTitle}>Fotos Finales</Text>
                    <View style={styles.photoGrid}>
                      {maintenanceInfo.photos
                        .filter(p => p.photo_type === 'final')
                        .map((photo) => (
                          <TouchableOpacity
                            key={photo.id}
                            style={styles.photoItem}
                            onPress={() => setSelectedImage(photo.photo_url)}
                          >
                            <Image
                              source={{ uri: photo.photo_url }}
                              style={styles.photoThumbnail}
                              resizeMode="cover"
                            />
                            <View style={styles.photoOverlay}>
                              <Ionicons name="expand" size={16} color="#fff" />
                            </View>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                )}
              </View>
                ) : (
                  <View style={styles.noPhotosContainer}>
                    <Ionicons name="camera-outline" size={48} color="#C7C7CC" />
                    <Text style={styles.noPhotosText}>No hay fotos disponibles</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Tiempo de Ejecución - Mostrar si está activo o completado - Colapsable */}
        {(() => {
          const lastAction = maintenance.last_action_log?.action;
          const isActive = lastAction === 'start' || lastAction === 'resume' || lastAction === 'pause';
          const isCompleted = lastAction === 'end';
          return (isActive || isCompleted) && (maintenance.elapsed_work_time || maintenanceInfo);
        })() && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => toggleSection('time')}
              activeOpacity={0.7}
            >
              <View style={styles.collapsibleHeaderLeft}>
                <Ionicons name="time-outline" size={20} color="#34C759" />
                <Text style={styles.collapsibleHeaderTitle}>Tiempo de Ejecución</Text>
              </View>
              <Ionicons
                name={expandedSections.time ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            {expandedSections.time && (
              <View style={styles.timeCard}>
              <View style={styles.timeContent}>
                {/* Usar elapsed_work_time del backend si está disponible (recomendado) */}
                {maintenance.elapsed_work_time ? (
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>Tiempo Transcurrido:</Text>
                    <Text style={styles.timeValue}>{maintenance.elapsed_work_time.formatted}</Text>
                  </View>
                ) : maintenanceInfo?.total_work_time ? (
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>Tiempo Total:</Text>
                    <Text style={styles.timeValue}>{maintenanceInfo.total_work_time}</Text>
                  </View>
                ) : null}
                
                {/* Tiempo pausado - Usar total_pause_ms del backend si está disponible */}
                {maintenance.total_pause_ms !== undefined && maintenance.total_pause_ms > 0 ? (
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>Tiempo Pausado:</Text>
                    <Text style={styles.timeValue}>
                      {(() => {
                        const totalSeconds = Math.floor(maintenance.total_pause_ms / 1000);
                        const hours = Math.floor(totalSeconds / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const seconds = totalSeconds % 60;
                        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                      })()}
                    </Text>
                  </View>
                ) : maintenanceInfo?.total_pause_formatted ? (
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>Tiempo Pausado:</Text>
                    <Text style={styles.timeValue}>{maintenanceInfo.total_pause_formatted}</Text>
                  </View>
                ) : null}

                {/* Progreso por Dispositivo - Solo si está completado - Colapsable */}
                {maintenance.last_action_log?.action === 'end' && maintenanceInfo && maintenanceInfo.devices && maintenanceInfo.devices.length > 0 && (
                  <View style={styles.devicesProgressContainer}>
                    <TouchableOpacity
                      style={[styles.collapsibleHeader, { marginBottom: expandedSections.progress ? 12 : 0 }]}
                      onPress={() => toggleSection('progress')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.devicesProgressTitle}>Progreso por Equipo</Text>
                      <Ionicons
                        name={expandedSections.progress ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#666"
                      />
                    </TouchableOpacity>
                    {expandedSections.progress && (
                      <>
                        {maintenanceInfo.devices.map((device) => {
                      const progress = device.pivot;
                      return (
                        <View key={device.id} style={styles.deviceProgressCard}>
                          <View style={styles.deviceProgressHeader}>
                            <View style={styles.deviceProgressInfo}>
                              <Text style={styles.deviceProgressName}>
                                {device.device?.brand} {device.device?.model}
                              </Text>
                              {device.serial && (
                                <Text style={styles.deviceProgressSerial}>
                                  S/N: {device.serial}
                                </Text>
                              )}
                            </View>
                            <View style={styles.deviceProgressBadge}>
                              <Text style={styles.deviceProgressBadgeText}>
                                {progress?.progress_pct || 0}%
                              </Text>
                            </View>
                          </View>
                          <View style={styles.deviceProgressBarContainer}>
                            <View
                              style={[
                                styles.deviceProgressBarFill,
                                { width: `${progress?.progress_pct || 0}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.deviceProgressDetails}>
                            {progress?.progress_completed_count || 0}/{progress?.progress_total || 0} items completados
                          </Text>
                        </View>
                      );
                    })}
                      </>
                    )}
                  </View>
                )}
              </View>
            </View>
            )}
          </View>
        )}

        {/* Logs del Técnico - Historial de Actividad - Colapsable */}
        {maintenanceInfo && maintenanceInfo.action_logs && maintenanceInfo.action_logs.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => toggleSection('logs')}
              activeOpacity={0.7}
            >
              <View style={styles.collapsibleHeaderLeft}>
                <Ionicons name="document-text-outline" size={20} color="#007AFF" />
                <Text style={styles.collapsibleHeaderTitle}>
                  Historial de Actividad ({maintenanceInfo.action_logs.length})
                </Text>
              </View>
              <Ionicons
                name={expandedSections.logs ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            {expandedSections.logs && (
              <View style={styles.card}>
              {maintenanceInfo.action_logs.map((log: any, index: number) => {
                const isLast = index === maintenanceInfo.action_logs.length - 1;
                const actionColor = getLogActionColor(log.action);
                const actionText = getLogActionText(log.action);
                const actionIcon = getLogActionIcon(log.action);

                return (
                  <View key={log.id || index} style={styles.logItem}>
                    <View style={styles.logTimeline}>
                      <View style={[styles.logDot, { backgroundColor: actionColor }]} />
                      {!isLast && <View style={styles.logLine} />}
                    </View>
                    <View style={styles.logContent}>
                      <View style={styles.logHeader}>
                        <View style={styles.logActionHeader}>
                          <Ionicons name={actionIcon as any} size={18} color={actionColor} />
                          <Text style={styles.logAction}>{actionText}</Text>
                        </View>
                        <Text style={styles.logDate}>
                          {formatLogDateTime(log.timestamp || log.created_at)}
                        </Text>
                      </View>
                      {log.reason && (
                        <View style={[styles.logReason, { backgroundColor: `${actionColor}15` }]}>
                          <Text style={[styles.logReasonText, { color: actionColor }]}>
                            {log.reason}
                          </Text>
                        </View>
                      )}
                      {log.latitude && log.longitude && (
                        <TouchableOpacity
                          style={styles.logLocation}
                          onPress={() => {
                            const { openOpenStreetMap } = require('../../utils/mapUtils');
                            openOpenStreetMap(log.latitude, log.longitude);
                          }}
                        >
                          <Ionicons name="location" size={14} color="#0EA5E9" />
                          <Text style={[styles.logLocationText, { color: '#0EA5E9', textDecorationLine: 'underline' }]}>
                            Ver ubicación en mapa
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
              </View>
            )}
          </View>
        )}

        {/* Botones de Acción - Basados en last_action_log según documentación */}
        <View style={styles.actionsContainer}>
          {(() => {
            const lastAction = maintenance.last_action_log?.action;
            
            // Sin action logs o solo asignado -> Mostrar "En Camino" e "Iniciar"
            if (!lastAction || lastAction === 'assign') {
              return (
                <>
                  {/* Botón "En Camino" */}
                  <TouchableOpacity
                    style={[
                      styles.onTheWayButton,
                      markingOnTheWay && styles.onTheWayButtonDisabled
                    ]}
                    onPress={handleMarkOnTheWay}
                    disabled={markingOnTheWay}
                  >
                    {markingOnTheWay ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="car" size={20} color="#fff" />
                        <Text style={styles.onTheWayButtonText}>En Camino</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.reprogramButton} onPress={handleReprogramar}>
                    <Ionicons name="calendar" size={20} color="#007AFF" />
                    <Text style={styles.reprogramButtonText}>Reprogramar Mantenimiento</Text>
                  </TouchableOpacity>
                </>
              );
            }
            
            // En camino -> Mostrar "Iniciar"
            if (lastAction === 'on_the_way') {
              return (
                <>
                  <TouchableOpacity
                    style={[
                      styles.startButton,
                      resuming && styles.startButtonDisabled
                    ]}
                    onPress={async () => {
                      navigate('IniciarMantenimiento', { maintenanceId: maintenance.id });
                    }}
                    disabled={resuming}
                  >
                    {resuming ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="camera" size={20} color="#fff" />
                        <Text style={styles.startButtonText}>Iniciar Mantenimiento</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.reprogramButton} onPress={handleReprogramar}>
                    <Ionicons name="calendar" size={20} color="#007AFF" />
                    <Text style={styles.reprogramButtonText}>Reprogramar Mantenimiento</Text>
                  </TouchableOpacity>
                </>
              );
            }
            
            // Pausado -> Mostrar "Reanudar"
            if (lastAction === 'pause') {
              return (
                <>
                  <TouchableOpacity
                    style={[
                      styles.startButton,
                      resuming && styles.startButtonDisabled
                    ]}
                    onPress={async () => {
                      const success = await resumeMaintenance(maintenance.id);
                      if (success) {
                        navigate('MantenimientoEnProgreso', { maintenanceId: maintenance.id });
                      }
                    }}
                    disabled={resuming}
                  >
                    {resuming ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="play-circle" size={20} color="#fff" />
                        <Text style={styles.startButtonText}>Reanudar Mantenimiento</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              );
            }
            
            // Completado -> No mostrar botones
            if (lastAction === 'end') {
              return null;
            }
            
            // En progreso (start o resume) -> Los botones se manejan en MantenimientoEnProgreso
            return null;
          })()}
        </View>
      </ScrollView>

      {/* Modal para ver imagen en grande */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  summaryHeader: {
    gap: 12,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  summaryClientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  summaryInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  summaryInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: '45%',
  },
  summaryInfoText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  collapsibleHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  collapsibleHeaderCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
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
  onTheWayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC107',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  onTheWayButtonDisabled: {
    backgroundColor: '#C7C7CC',
    opacity: 0.6,
  },
  onTheWayButtonText: {
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
  timeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  timeContent: {
    gap: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  timeValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  timeValueHighlight: {
    fontSize: 15,
    color: '#34C759',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  devicesProgressContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  devicesProgressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  deviceProgressCard: {
    backgroundColor: '#F9F9F9',
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
    color: '#000',
    marginBottom: 4,
  },
  deviceProgressSerial: {
    fontSize: 12,
    color: '#666',
  },
  deviceProgressBadge: {
    backgroundColor: '#34C759',
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
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  deviceProgressBarFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  deviceProgressDetails: {
    fontSize: 12,
    color: '#666',
  },
  photosContainer: {
    gap: 20,
  },
  photoGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  photoGroupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotosContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noPhotosText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  confirmationWarningContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  confirmationWarningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  confirmationWarningContent: {
    flex: 1,
  },
  confirmationWarningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 6,
  },
  confirmationWarningText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  logTimeline: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  logDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  logLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E5EA',
    marginTop: 4,
    minHeight: 20,
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  logAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  logDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  logReason: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  logReasonText: {
    fontSize: 13,
    lineHeight: 18,
  },
  logLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  logLocationText: {
    fontSize: 12,
  },
});

