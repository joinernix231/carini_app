import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  BackHandler,
  TextInput,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { useMaintenanceTimer, useMaintenanceActions } from '../../hooks/tecnico';
import { PauseReasonModal } from '../../components/Tecnico/Maintenance';
import { useImageUpload } from '../../hooks/useImageUpload';
import TecnicoMantenimientosService, {
  TecnicoMaintenance,
  Device,
} from '../../services/TecnicoMantenimientosService';
import { getChecklistForDeviceType } from '../../utils/maintenanceChecklists';

type RouteParams = {
  maintenanceId: number;
};

export default function MantenimientoEnProgreso({ route }: { route: { params: RouteParams } }) {
  const { navigate, navigateReset } = useSmartNavigation();
  const { token } = useAuth();
  const { showError } = useError();
  const { maintenanceId } = route.params;

  const [maintenance, setMaintenance] = useState<TecnicoMaintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPauseModal, setShowPauseModal] = useState(false);
  
  // Estado para los checklists de cada equipo
  // Estructura: { deviceId: { taskIndex: boolean } }
  const [completedTasks, setCompletedTasks] = useState<{[deviceId: number]: {[taskIndex: number]: boolean}}>({});
  const [expandedDevices, setExpandedDevices] = useState<{[deviceId: number]: boolean}>({});
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const saveProgressRef = useRef<() => Promise<void>>(async () => {});

  // Estados para sugerir cambio de repuesto
  const [sparePartDescription, setSparePartDescription] = useState('');
  const [sparePartPhoto, setSparePartPhoto] = useState<string | null>(null);
  const [suggestingSparePart, setSuggestingSparePart] = useState(false);
  const [selectedDeviceForSparePart, setSelectedDeviceForSparePart] = useState<Device | null>(null);
  const [showDeviceSelectorModal, setShowDeviceSelectorModal] = useState(false);
  
  const { pickImage, takePhoto, uploadImage, uploading } = useImageUpload({
    defaultName: 'spare-part',
    aspect: [4, 3],
  });

  // Usar hooks personalizados (resta tiempo total pausado si viene del backend)
  const { formattedTime } = useMaintenanceTimer(
    maintenance?.started_at,
    maintenance?.total_pause_ms ?? maintenance?.pause_duration_ms ?? 0
  );
  const { pausing, pauseMaintenance: pauseMaintenanceAction } = useMaintenanceActions();

  // Bloquear el botón físico de atrás en Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Mostrar alerta en lugar de permitir salir
        Alert.alert(
          '⚠️ Mantenimiento en Curso',
          'No puedes salir mientras el mantenimiento está en progreso. Debes pausarlo o finalizarlo primero.',
          [{ text: 'Entendido', style: 'cancel' }]
        );
        return true; // Previene el comportamiento por defecto
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // Re-hidratar progreso al enfocar la pantalla
      if (token && maintenanceId) {
        (async () => {
          try {
            const progress = await TecnicoMantenimientosService.getMaintenanceProgress(token, maintenanceId);
            if (progress.success && progress.data?.devices?.length) {
              const map: Record<number, Record<number, boolean>> = {};
              progress.data.devices.forEach((d: any) => {
                const deviceId = d.client_device_id ?? d.device_id ?? d.id;
                const indicesRaw = d.completed_indices ?? [];
                const indices = Array.isArray(indicesRaw)
                  ? indicesRaw
                  : (typeof indicesRaw === 'string' && indicesRaw.length > 0
                      ? indicesRaw.split(',').map((v: string) => Number(v.trim())).filter((n: number) => !isNaN(n))
                      : []);
                const inner: Record<number, boolean> = {};
                indices.forEach((idx: number) => { inner[idx] = true; });
                if (typeof deviceId === 'number') {
                  map[deviceId] = inner;
                }
              });
              setCompletedTasks(map);
            }
          } catch (e) {
            console.log('No se pudo hidratar progreso al enfocar');
          }
        })();
      }

      return () => subscription.remove();
    }, [token, maintenanceId])
  );

  // El timer ahora se maneja con el hook useMaintenanceTimer

  useEffect(() => {
    loadMaintenanceDetail();
  }, [maintenanceId]);

  // Inicializar todos los equipos como expandidos por defecto
  useEffect(() => {
    if (maintenance?.device) {
      const initialExpanded: Record<number, boolean> = {};
      maintenance.device.forEach(device => {
        initialExpanded[device.id] = true;
      });
      setExpandedDevices(initialExpanded);
    }
  }, [maintenance]);

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
        // Hidratar progreso existente
        try {
          const progress = await TecnicoMantenimientosService.getMaintenanceProgress(token, maintenanceId);
          if (progress.success && progress.data?.devices?.length) {
            const map: Record<number, Record<number, boolean>> = {};
            progress.data.devices.forEach((d: any) => {
              const deviceId = d.client_device_id ?? d.device_id ?? d.id;
              const indicesRaw = d.completed_indices ?? [];
              const indices = Array.isArray(indicesRaw)
                ? indicesRaw
                : (typeof indicesRaw === 'string' && indicesRaw.length > 0
                    ? indicesRaw.split(',').map((v: string) => Number(v.trim())).filter((n: number) => !isNaN(n))
                    : []);
              const inner: Record<number, boolean> = {};
              indices.forEach((idx: number) => { inner[idx] = true; });
              if (typeof deviceId === 'number') {
                map[deviceId] = inner;
              }
            });
            setCompletedTasks(map);
          }
        } catch (e) {
          // No bloquear la UI si no hay progreso aún
          console.log('Progreso no disponible aún');
        }
      } else {
        throw new Error(response.message || 'Error al cargar el detalle');
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
      showError(error);
      navigateReset('MisMantenimientos');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseMaintenance = useCallback(() => {
    if (!token) return;
    // Mostrar modal de pausa
    setShowPauseModal(true);
  }, [token]);

  const handleConfirmPause = async (reason: string) => {
    setShowPauseModal(false);
    
    try {
      // Sincronizar progreso antes de pausar
      if (saveTimer) clearTimeout(saveTimer);
      await saveProgress();
    } catch {}

    // Usar el hook para pausar (maneja GPS automáticamente)
    const success = await pauseMaintenanceAction(maintenanceId, reason);
    
    if (success) {
      Alert.alert(
        '✅ Mantenimiento Pausado',
        'El mantenimiento ha sido pausado exitosamente. Puedes reanudarlo desde Mis Mantenimientos.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigateReset('TecnicoDashboard');
            },
          },
        ]
      );
    }
  };

  const handleCancelPause = useCallback(() => {
    setShowPauseModal(false);
  }, []);

  const handleFinalizeMaintenance = useCallback(() => {
    Alert.alert(
      '✅ Finalizar Mantenimiento',
      '¿Has completado todas las tareas del mantenimiento? Esta acción te llevará a la pantalla de finalización.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: async () => {
            try {
              if (saveTimer) clearTimeout(saveTimer);
              // Usar ref para evitar dependencia circular
              await saveProgressRef.current();
              // Navegar a pantalla de finalización
              navigate('FinalizarMantenimiento', { maintenanceId });
            } catch (error) {
              showError(error, 'Error al guardar progreso');
            }
          },
        },
      ]
    );
  }, [navigate, maintenanceId, showError, saveTimer]);

  // Handler para capturar foto del repuesto
  const handlePickSparePartPhoto = useCallback(async () => {
    try {
      Alert.alert(
        'Seleccionar Foto',
        '¿Cómo deseas obtener la foto?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Galería',
            onPress: async () => {
              const imageUri = await pickImage();
              if (imageUri) {
                setSparePartPhoto(imageUri);
              }
            },
          },
          {
            text: 'Cámara',
            onPress: async () => {
              const imageUri = await takePhoto();
              if (imageUri) {
                setSparePartPhoto(imageUri);
              }
            },
          },
        ]
      );
    } catch (error) {
      showError(error, 'Error al seleccionar foto');
    }
  }, [pickImage, takePhoto, showError]);

  // Handler para sugerir cambio de repuesto
  const handleSuggestSparePart = useCallback(async () => {
    if (!sparePartDescription.trim()) {
      Alert.alert('Error', 'Debes describir el repuesto que necesita ser cambiado.');
      return;
    }

    if (!token) return;

    try {
      setSuggestingSparePart(true);

      let photoName: string | null = null;
      
      // Si hay foto, subirla primero
      if (sparePartPhoto) {
        const uploaded = await uploadImage(sparePartPhoto, 'spare-part');
        if (uploaded) {
          photoName = uploaded;
        }
      }

      const response = await TecnicoMantenimientosService.suggestSparePart(
        token,
        maintenanceId,
        {
          description: sparePartDescription.trim(),
          photo: photoName || undefined,
          client_device_id: selectedDeviceForSparePart
            ? ((selectedDeviceForSparePart as any).client_device_id ?? selectedDeviceForSparePart.id)
            : undefined,
        }
      );

      if (response.success) {
        Alert.alert(
          '✅ Sugerencia enviada',
          'La sugerencia de cambio de repuesto ha sido enviada exitosamente.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Limpiar formulario
                setSparePartDescription('');
                setSparePartPhoto(null);
                setSelectedDeviceForSparePart(null);
              },
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Error al enviar sugerencia');
      }
    } catch (error) {
      showError(error, 'Error al sugerir cambio de repuesto');
    } finally {
      setSuggestingSparePart(false);
    }
  }, [sparePartDescription, sparePartPhoto, token, maintenanceId, uploadImage, showError]);

  // Función para prevenir salida accidental
  const handleAttemptExit = useCallback(() => {
    Alert.alert(
      '⚠️ Mantenimiento en Curso',
      'No puedes salir mientras el mantenimiento está en progreso. Debes pausarlo o finalizarlo primero.',
      [{ text: 'Entendido', style: 'cancel' }]
    );
  }, []);

  // Función para toggle de tarea completada
  const toggleTask = useCallback((deviceId: number, taskIndex: number) => {
    setCompletedTasks((prev: {[deviceId: number]: {[taskIndex: number]: boolean}}) => {
      const deviceTasks = prev[deviceId] || {};
      const toggled = !deviceTasks[taskIndex];
      const newDeviceTasks: {[taskIndex: number]: boolean} = { ...deviceTasks, [taskIndex]: toggled };

      // Limpiar claves en false para evitar residuos y estados fantasma
      Object.keys(newDeviceTasks).forEach((k) => {
        const idx = Number(k);
        if (!newDeviceTasks[idx]) delete newDeviceTasks[idx];
      });

      const hasAnyTrue = Object.values(newDeviceTasks).some(Boolean);

      return {
        ...prev,
        [deviceId]: hasAnyTrue ? newDeviceTasks : {}
      };
    });

    // Guardar con debounce
    if (saveTimer) clearTimeout(saveTimer);
    const t = setTimeout(() => {
      saveProgressRef.current();
    }, 800);
    setSaveTimer(t);
  }, [saveTimer]);

  // Función para toggle de expansión de equipo
  const toggleDeviceExpansion = useCallback((deviceId: number) => {
    setExpandedDevices(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId]
    }));
  }, []);

  // Función para obtener progreso de un equipo
  const getDeviceProgress = useCallback((device: Device) => {
    const checklist = getChecklistForDeviceType(device.type);
    const total = checklist.length;
    const deviceKey = (device as any).client_device_id ?? device.id;
    let deviceTasks = completedTasks[deviceKey] || {};
    // Fallback cuando el backend usa otra clave (ej. client_device_id != device.id) y solo hay un equipo
    if (Object.keys(deviceTasks).length === 0 && Object.keys(completedTasks).length === 1) {
      const onlyKey = Number(Object.keys(completedTasks)[0]);
      deviceTasks = completedTasks[onlyKey] || {};
    }
    const completed = Object.values(deviceTasks).filter(Boolean).length;
    return { completed, total };
  }, [completedTasks]);

  // Función para obtener estado de progreso (pendiente, en progreso, completado)
  const getProgressStatus = useCallback((device: Device) => {
    const { completed, total } = getDeviceProgress(device);
    if (completed === 0) return 'pendiente';
    if (completed === total) return 'completado';
    return 'en_progreso';
  }, [getDeviceProgress]);

  // Función para obtener color del badge según estado
  const getProgressBadgeColor = useCallback((status: string) => {
    switch (status) {
      case 'completado':
        return { bg: '#E6F7E6', text: '#34C759', border: '#34C759' };
      case 'en_progreso':
        return { bg: '#E6F3FF', text: '#007AFF', border: '#007AFF' };
      case 'pendiente':
        return { bg: '#FFF9E6', text: '#FF9500', border: '#FF9500' };
      default:
        return { bg: '#F2F2F7', text: '#666', border: '#666' };
    }
  }, []);

  // Enviar progreso al backend (batch)
  const saveProgress = useCallback(async () => {
    if (!token || !maintenance) return;
    try {
      // Enviar SIEMPRE la lista completa de equipos con sus índices actuales
      const payloadDevices = maintenance.device.map((d) => {
        const deviceKey = (d as any).client_device_id ?? d.id;
        const tasks = completedTasks[deviceKey] || {};
        const completedIndices = Object.entries(tasks)
          .filter(([, v]) => v)
          .map(([k]) => Number(k))
          .sort((a, b) => a - b);
        const total = getChecklistForDeviceType(d.type).length;
        const safeIndices = completedIndices.filter((i) => i >= 0 && i < total);
        return {
          client_device_id: deviceKey,
          completed_indices: safeIndices, // puede ser [] para reset
          items_total: total,
        };
      });

      await TecnicoMantenimientosService.updateMaintenanceProgress(
        token,
        maintenance.id,
        payloadDevices
      );
    } catch (e) {
      //console.log('No se pudo guardar progreso aún:', e);
    }
  }, [token, maintenance, completedTasks]);

  useEffect(() => {
    saveProgressRef.current = saveProgress;
  }, [saveProgress]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!maintenance) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />

      {/* Header - Sin botón de atrás */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAttemptExit} style={styles.lockButton}>
          <Ionicons name="lock-closed" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Mantenimiento en Progreso</Text>
          <Text style={styles.subtitle}>Modo de Trabajo Activo</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner de Estado */}
        <View style={styles.statusBanner}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIconContainer}>
              <Ionicons name="construct" size={28} color="#fff" />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Trabajando en Mantenimiento</Text>
              <Text style={styles.statusDescription}>
                Cliente: {maintenance.client.name}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusBadgeText}>ACTIVO</Text>
            </View>
          </View>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <View style={styles.timerContent}>
            <Ionicons name="time" size={24} color="#fff" />
            <View style={styles.timerTextContainer}>
              <Text style={styles.timerLabel}>Tiempo Transcurrido</Text>
              <Text style={styles.timerText}>{formattedTime}</Text>
            </View>
          </View>
        </View>

        {/* Información del Mantenimiento */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Fecha Programada</Text>
                <Text style={styles.infoValue}>
                  {new Date(maintenance.date_maintenance).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#FF9500" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Turno</Text>
                <Text style={styles.infoValue}>{maintenance.shift}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="document-text-outline" size={20} color="#34C759" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tipo</Text>
                <Text style={styles.infoValue}>
                  {maintenance.type === 'preventive' ? 'Preventivo' : 'Correctivo'}
                </Text>
              </View>
            </View>
            {maintenance.latitude && maintenance.longitude && (
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={20} color="#FF3B30" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Ubicación GPS</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {parseFloat(maintenance.latitude).toFixed(4)}°, {parseFloat(maintenance.longitude).toFixed(4)}°
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Descripción del Mantenimiento */}
        {maintenance.description && (
          <View style={styles.descriptionCard}>
            <View style={styles.descriptionHeader}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.descriptionTitle}>Descripción del Trabajo</Text>
            </View>
            <Text style={styles.descriptionText}>{maintenance.description}</Text>
          </View>
        )}

        {/* Sección de Equipos */}
        <View style={styles.sectionHeader}>
          <Ionicons name="construct" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Equipos y Tareas</Text>
          <View style={styles.deviceCountBadge}>
            <Text style={styles.deviceCountText}>{maintenance.device.length}</Text>
          </View>
        </View>

        {/* Lista de Equipos */}
        {maintenance.device.map((device, index) => {
          const checklist = getChecklistForDeviceType(device.type);
          const { completed, total } = getDeviceProgress(device);
          const status = getProgressStatus(device);
          const isExpanded = expandedDevices[device.id] !== false; // Por defecto expandido
          const badgeColors = getProgressBadgeColor(status);
          const deviceKey = device.client_device_id;
          const deviceTasks = (() => {
            let dt = completedTasks[deviceKey] || {};
            if (Object.keys(dt).length === 0 && Object.keys(completedTasks).length === 1) {
              const onlyKey = Number(Object.keys(completedTasks)[0]);
              dt = completedTasks[onlyKey] || {};
            }
            return dt;
          })();

          const statusTextMap: Record<string, string> = {
            completado: 'Completado',
            en_progreso: 'En progreso',
            pendiente: 'Pendiente',
          };

          return (
            <View key={device.id} style={styles.deviceCard}>
              <TouchableOpacity
                onPress={() => toggleDeviceExpansion(device.id)}
                style={styles.deviceHeader}
                activeOpacity={0.7}
              >
                <View style={styles.deviceIconContainer}>
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
                  <Text style={styles.deviceModel}>{device.type} - {device.serial}</Text>
                </View>
                <View style={[styles.progressBadge, { backgroundColor: badgeColors.bg, borderColor: badgeColors.border }]}>
                  <Text style={[styles.progressText, { color: badgeColors.text }]}>
                    {statusTextMap[status]} ({completed}/{total})
                  </Text>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={badgeColors.text} 
                  />
                </View>
              </TouchableOpacity>

              {/* Lista de Tareas - Solo visible si está expandido */}
              {isExpanded && (
                <View style={styles.tasksContainer}>
                  {checklist.map((task, taskIndex) => {
                    const isCompleted = deviceTasks[taskIndex] === true;
                    return (
                      <TouchableOpacity
                        key={taskIndex}
                        style={styles.taskItem}
                        onPress={() => toggleTask(deviceKey, taskIndex)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={isCompleted ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={22}
                          color={isCompleted ? '#0A7AFF' : '#8A8A8E'}
                        />
                        <Text
                          style={[
                            styles.taskText,
                            isCompleted && styles.taskTextCompleted
                          ]}
                        >
                          {task}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Sugerir Cambio de Repuestos */}
        <View style={styles.sparePartsContainer}>
          <View style={styles.sparePartsHeader}>
            <Ionicons name="chatbubble" size={20} color="#FF9500" />
            <Text style={styles.sparePartsTitle}>Sugerir Cambio de Repuestos</Text>
          </View>

          {/* Selector de Equipo */}
          <View style={styles.deviceSelectorSection}>
            <Text style={styles.deviceSelectorLabel}>Equipo afectado:</Text>
            <TouchableOpacity
              style={[
                styles.deviceSelectorButton,
                selectedDeviceForSparePart && styles.deviceSelectorButtonSelected
              ]}
              onPress={() => setShowDeviceSelectorModal(true)}
            >
              {selectedDeviceForSparePart ? (
                <View style={styles.selectedDeviceInfo}>
                  <MaterialIcons name="devices" size={20} color="#007AFF" />
                  <View style={styles.selectedDeviceTextContainer}>
                    <Text style={styles.selectedDeviceName}>
                      {selectedDeviceForSparePart.brand} {selectedDeviceForSparePart.model}
                    </Text>
                    <Text style={styles.selectedDeviceSerial}>
                      Serial: {selectedDeviceForSparePart.serial || 'N/A'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeDeviceButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedDeviceForSparePart(null);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.deviceSelectorPlaceholder}>
                  <Ionicons name="hardware-chip-outline" size={20} color="#999" />
                  <Text style={styles.deviceSelectorPlaceholderText}>
                    Selecciona el equipo afectado
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.sparePartTextInput}
            placeholder="Describe el repuesto que necesita ser cambiado y por qué..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={sparePartDescription}
            onChangeText={setSparePartDescription}
            textAlignVertical="top"
          />

          {sparePartPhoto && (
            <View style={styles.sparePartPhotoPreview}>
              <Image source={{ uri: sparePartPhoto }} style={styles.sparePartPhotoImage} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => {
                  setSparePartPhoto(null);
                }}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={styles.addPhotoButton}
            onPress={handlePickSparePartPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="camera" size={20} color="#007AFF" />
            )}
            <Text style={styles.addPhotoText}>
              {sparePartPhoto ? 'Cambiar Foto del Repuesto' : 'Agregar Foto del Repuesto'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.suggestButton,
              (suggestingSparePart || !sparePartDescription.trim() || !selectedDeviceForSparePart) && styles.buttonDisabled
            ]}
            onPress={handleSuggestSparePart}
            disabled={suggestingSparePart || !sparePartDescription.trim() || !selectedDeviceForSparePart}
          >
            {suggestingSparePart ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="add" size={20} color="#fff" />
            )}
            <Text style={styles.suggestButtonText}>
              {suggestingSparePart ? 'Enviando...' : 'Sugerir Cambio de Repuesto'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Botones de Acción */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.pauseButton, pausing && styles.buttonDisabled]} 
          onPress={handlePauseMaintenance}
          disabled={pausing}
        >
          {pausing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : null}
          <Text style={styles.pauseButtonText}>
            {pausing ? 'Pausando...' : 'Pausar Mantenimiento'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.finalizeButton, pausing && styles.buttonDisabled]} 
          onPress={handleFinalizeMaintenance}
          disabled={pausing}
        >
          <Text style={styles.finalizeButtonText}>Finalizar Mantenimiento</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Pausa - Componente Reutilizable */}
      <PauseReasonModal
        visible={showPauseModal}
        onCancel={handleCancelPause}
        onConfirm={handleConfirmPause}
        loading={pausing}
      />

      {/* Modal Selector de Equipo para Repuesto */}
      <Modal
        visible={showDeviceSelectorModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDeviceSelectorModal(false)}
      >
        <SafeAreaView style={styles.deviceModalContainer}>
          <View style={styles.deviceModalHeader}>
            <Text style={styles.deviceModalTitle}>Seleccionar Equipo</Text>
            <TouchableOpacity
              onPress={() => setShowDeviceSelectorModal(false)}
              style={styles.deviceModalCloseButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={maintenance?.device || []}
            keyExtractor={(item) => {
              const id = (item as any).client_device_id || item.id;
              return id.toString();
            }}
            renderItem={({ item }) => {
              const device = item as Device;
              const deviceId = (device as any).client_device_id ?? device.id;
              const selectedDeviceId = selectedDeviceForSparePart 
                ? ((selectedDeviceForSparePart as any).client_device_id ?? selectedDeviceForSparePart.id)
                : null;
              const isSelected = selectedDeviceId === deviceId;

              return (
                <TouchableOpacity
                  style={[
                    styles.deviceModalItem,
                    isSelected && styles.deviceModalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedDeviceForSparePart(device);
                    setShowDeviceSelectorModal(false);
                  }}
                >
                  <View style={styles.deviceModalItemContent}>
                    <View style={styles.deviceModalItemIcon}>
                      <MaterialIcons
                        name={device.type === 'lavadora' ? 'local-laundry-service' : 'dry-cleaning'}
                        size={24}
                        color={isSelected ? '#007AFF' : '#666'}
                      />
                    </View>
                    <View style={styles.deviceModalItemInfo}>
                      <Text style={[
                        styles.deviceModalItemName,
                        isSelected && styles.deviceModalItemNameSelected
                      ]}>
                        {device.brand} {device.model}
                      </Text>
                      <Text style={styles.deviceModalItemSerial}>
                        Serial: {device.serial || 'N/A'}
                      </Text>
                      <Text style={styles.deviceModalItemType}>
                        Tipo: {device.type || 'N/A'}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.deviceModalEmpty}>
                <Ionicons name="hardware-chip-outline" size={48} color="#C0C0C0" />
                <Text style={styles.deviceModalEmptyText}>No hay equipos disponibles</Text>
              </View>
            }
          />
        </SafeAreaView>
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
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lockButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerRight: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  statusBanner: {
    backgroundColor: '#007AFF',
    padding: 20,
    margin: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  timerContainer: {
    backgroundColor: '#34C759',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  timerLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  descriptionCard: {
    backgroundColor: '#F2F2F7',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
    flex: 1,
  },
  deviceCountBadge: {
    backgroundColor: '#007AFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  deviceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  deviceModel: {
    fontSize: 13,
    color: '#666',
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  tasksContainer: {
    marginTop: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taskText: {
    fontSize: 14,
    color: '#000',
    marginLeft: 12,
    flex: 1,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  sparePartsContainer: {
    backgroundColor: '#FFF9E6',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  sparePartsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sparePartsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
  },
  textAreaContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  sparePartTextInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    minHeight: 100,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sparePartPhotoPreview: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sparePartPhotoImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  deviceSelectorSection: {
    marginBottom: 16,
  },
  deviceSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  deviceSelectorButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 56,
    justifyContent: 'center',
  },
  deviceSelectorButtonSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F0F8FF',
  },
  selectedDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedDeviceTextContainer: {
    flex: 1,
  },
  selectedDeviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  selectedDeviceSerial: {
    fontSize: 12,
    color: '#666',
  },
  removeDeviceButton: {
    padding: 4,
  },
  deviceSelectorPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceSelectorPlaceholderText: {
    flex: 1,
    fontSize: 14,
    color: '#999',
  },
  deviceModalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  deviceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  deviceModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  deviceModalCloseButton: {
    padding: 4,
  },
  deviceModalItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  deviceModalItemSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F0F8FF',
  },
  deviceModalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceModalItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceModalItemInfo: {
    flex: 1,
  },
  deviceModalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  deviceModalItemNameSelected: {
    color: '#007AFF',
  },
  deviceModalItemSerial: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  deviceModalItemType: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  deviceModalEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  deviceModalEmptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginBottom: 12,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  suggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    paddingVertical: 12,
    borderRadius: 8,
  },
  suggestButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  pauseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pauseButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  finalizeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  finalizeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
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
});
