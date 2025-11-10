import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanResponder } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import * as Location from 'expo-location';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useMaintenanceTimer } from '../../hooks/tecnico';
import { TecnicoMantenimientosService, 
  TecnicoMaintenance,
  Device,
  MaintenanceProgressResponse,
  DeviceProgress,
} from '../../services/TecnicoMantenimientosService';
import BackButton from '../../components/BackButton';

const { width, height } = Dimensions.get('window');

type RouteParams = {
  maintenanceId: number;
};

interface DeviceFinalPhoto {
  deviceId: number;
  device: Device;
  photoUri: string | null;
  photoName: string | null;
  captured: boolean;
  uploading: boolean;
}

// Componente mejorado de firma con SVG
interface SignatureCanvasProps {
  onSignatureChange: (imageName: string | null) => void;
  width: number;
  height: number;
  isFullscreen?: boolean;
  onClose?: () => void;
  onSave?: (signerName: string, signerDocument: string, signatureRef: React.RefObject<View>) => Promise<void>;
  uploading?: boolean;
  uploadImage?: (uri: string, name: string) => Promise<string | null>;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ 
  onSignatureChange, 
  width, 
  height, 
  isFullscreen = false,
  onClose,
  onSave,
  uploading = false,
  uploadImage,
}) => {
  const [paths, setPaths] = useState<Array<Array<{ x: number; y: number }>>>([]);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerDocument, setSignerDocument] = useState('');
  const signatureRef = useRef<View>(null);

  const buildPathString = (points: Array<{ x: number; y: number }>): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setIsDrawing(true);
      setCurrentPath([{ x: locationX, y: locationY }]);
    },
    onPanResponderMove: (evt) => {
      if (!isDrawing) return;
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath((prev) => {
        if (prev.length === 0) {
          return [{ x: locationX, y: locationY }];
        }
        const lastPoint = prev[prev.length - 1];
        // Solo agregar punto si hay suficiente distancia
        if (Math.abs(locationX - lastPoint.x) > 2 || Math.abs(locationY - lastPoint.y) > 2) {
          return [...prev, { x: locationX, y: locationY }];
        }
        return prev;
      });
    },
    onPanResponderRelease: () => {
      if (currentPath.length > 2) {
        setPaths((prev) => [...prev, currentPath]);
      }
      setCurrentPath([]);
      setIsDrawing(false);
    },
  });

  const clearSignature = () => {
    setPaths([]);
    setCurrentPath([]);
    setIsDrawing(false);
    setSignerName('');
    setSignerDocument('');
    onSignatureChange(null);
  };

  const saveSignature = async () => {
    if (!signatureRef.current || !uploadImage) return;
    
    const hasSignature = paths.length > 0 || currentPath.length > 2;
    if (!hasSignature) {
      Alert.alert('Firma requerida', 'Por favor, realiza una firma antes de guardar.');
      return;
    }

    if (!signerName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor, ingresa el nombre de quien firma.');
      return;
    }

    if (!signerDocument.trim()) {
      Alert.alert('Cédula requerida', 'Por favor, ingresa la cédula de quien firma.');
      return;
    }

    try {
      // Capturar el componente como imagen
      const uri = await captureRef(signatureRef.current, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
      });

      // Generar nombre único para la firma
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const signatureName = `signature_${timestamp}_${randomString}`;

      // Subir la imagen a AWS
      const imageName = await uploadImage(uri, signatureName);

      if (imageName) {
        onSignatureChange(imageName);
        Alert.alert(
          'Firma guardada',
          `Firma de ${signerName.trim()} (C.C. ${signerDocument.trim()}) guardada exitosamente.`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (onClose) onClose();
              },
            },
          ]
        );
      } else {
        throw new Error('No se pudo subir la firma');
      }
    } catch (error) {
      console.error('Error guardando firma:', error);
      Alert.alert('Error', 'No se pudo guardar la firma. Por favor, intenta de nuevo.');
      throw error;
    }
  };

  const canvasHeight = isFullscreen ? height - 400 : height - 80;
  const canvasWidth = isFullscreen ? width - 40 : width - 40;

  return (
    <View style={[styles.signatureContainer, { width, height }, isFullscreen && styles.signatureFullscreen]}>
      <View style={styles.signatureHeader}>
        <Text style={styles.signatureHeaderText}>
          {isFullscreen ? 'Firma del Cliente' : 'Toca para firmar en pantalla completa'}
        </Text>
        {isFullscreen && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-circle" size={28} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {isFullscreen && (
        <View style={styles.signerInfoContainer}>
          <View style={styles.signerInfoRow}>
            <View style={styles.signerInfoLabelContainer}>
              <Ionicons name="person-outline" size={18} color="#6B7280" />
              <Text style={styles.signerInfoLabel}>Nombre completo</Text>
            </View>
            <TextInput
              style={styles.signerInfoInput}
              placeholder="Nombre de quien firma"
              value={signerName}
              onChangeText={setSignerName}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.signerInfoRow}>
            <View style={styles.signerInfoLabelContainer}>
              <Ionicons name="card-outline" size={18} color="#6B7280" />
              <Text style={styles.signerInfoLabel}>Cédula</Text>
            </View>
            <TextInput
              style={styles.signerInfoInput}
              placeholder="Número de cédula"
              value={signerDocument}
              onChangeText={setSignerDocument}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
      )}
      
      <View 
        ref={signatureRef}
        style={styles.signatureCanvas} 
        collapsable={false}
      >
        <View {...panResponder.panHandlers} style={StyleSheet.absoluteFill}>
          <Svg height={canvasHeight} width={canvasWidth} style={styles.svgContainer}>
          {paths.map((pathPoints, index) => {
            const pathString = buildPathString(pathPoints);
            if (!pathString) return null;
            return (
              <Path
                key={index}
                d={pathString}
                stroke="#1F2937"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
          {currentPath.length > 1 && (
            <Path
              d={buildPathString(currentPath)}
              stroke="#1F2937"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* Mostrar nombre y cédula en la firma */}
          {isFullscreen && signerName && (
            <SvgText
              x={20}
              y={canvasHeight - 40}
              fontSize="14"
              fill="#1F2937"
              fontWeight="600"
            >
              {signerName}
            </SvgText>
          )}
          {isFullscreen && signerDocument && (
            <SvgText
              x={20}
              y={canvasHeight - 20}
              fontSize="12"
              fill="#6B7280"
            >
              C.C. {signerDocument}
            </SvgText>
          )}
          </Svg>
        </View>
        {!isDrawing && paths.length === 0 && currentPath.length === 0 && (
          <View style={styles.signaturePlaceholder}>
            <Ionicons name="create-outline" size={48} color="#D1D5DB" />
            <Text style={styles.signaturePlaceholderText}>
              {isFullscreen ? 'Firma aquí arrastrando tu dedo' : 'Toca para abrir en pantalla completa'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.signatureActions}>
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={clearSignature}
          disabled={uploading}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.clearButtonText}>Limpiar</Text>
        </TouchableOpacity>
        {isFullscreen && (
          <TouchableOpacity 
            style={[
              styles.doneButton,
              (!signerName || !signerDocument || paths.length === 0) && styles.buttonDisabled
            ]} 
            onPress={saveSignature}
            disabled={uploading || !signerName || !signerDocument || paths.length === 0}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            )}
            <Text style={styles.doneButtonText}>
              {uploading ? 'Guardando...' : 'Guardar Firma'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function FinalizarMantenimiento({ route }: { route: { params: RouteParams } }) {
  const { navigate, navigateReset, goBack } = useSmartNavigation();
  const { token } = useAuth();
  const { showError } = useError();
  const { maintenanceId } = route.params;

  const [maintenance, setMaintenance] = useState<TecnicoMaintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceFinalPhotos, setDeviceFinalPhotos] = useState<DeviceFinalPhoto[]>([]);
  const [finalObservations, setFinalObservations] = useState('');
  const [clientSignature, setClientSignature] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [progressData, setProgressData] = useState<MaintenanceProgressResponse | null>(null);
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  // Callback para manejar cuando se guarda la firma
  const handleSignatureSaved = useCallback((imageName: string | null) => {
    setClientSignature(imageName);
    if (imageName) {
      setUploadingSignature(false);
    }
  }, []);

  const imageUpload = useImageUpload({
    aspect: [4, 3],
    quality: 0.8,
    allowsEditing: true,
    defaultName: 'final-photo',
  });

  const signatureUpload = useImageUpload({
    quality: 1.0,
    allowsEditing: false,
    defaultName: 'signature',
  });

  const { formattedTime } = useMaintenanceTimer(
    maintenance?.started_at,
    maintenance?.total_pause_ms ?? maintenance?.pause_duration_ms ?? 0
  );

  useEffect(() => {
    loadMaintenanceDetail();
    loadProgress();
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
        // Inicializar array de fotos finales por dispositivo
        const photos = response.data.device.map((device) => ({
          deviceId: device.client_device_id,
          device,
          photoUri: null,
          photoName: null,
          captured: false,
          uploading: false,
        }));
        setDeviceFinalPhotos(photos);
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
      // No mostrar error al usuario, solo log
    }
  };


  const takeFinalPhoto = useCallback(async (deviceId: number) => {
    if (!token) return;

    try {
      const photoUri = await imageUpload.takePhoto();
      if (photoUri) {
        setDeviceFinalPhotos((prev) =>
          prev.map((p) =>
            p.deviceId === deviceId ? { ...p, photoUri, captured: true, uploading: true } : p
          )
        );

        // Subir foto
        const photoName = await imageUpload.uploadImage(photoUri, `final-${deviceId}`);
        if (photoName) {
          setDeviceFinalPhotos((prev) =>
            prev.map((p) =>
              p.deviceId === deviceId ? { ...p, photoName, uploading: false } : p
            )
          );
        } else {
          throw new Error('Error al subir la foto');
        }
      }
    } catch (error) {
      showError(error, 'Error al capturar foto final');
      setDeviceFinalPhotos((prev) =>
        prev.map((p) => (p.deviceId === deviceId ? { ...p, uploading: false } : p))
      );
    }
  }, [token, imageUpload, showError]);


  const handleCompleteMaintenance = useCallback(async () => {
    if (!token || !maintenance) return;

    // Validar que todas las fotos finales estén capturadas
    const missingPhotos = deviceFinalPhotos.filter((p) => !p.captured || !p.photoName);
    if (missingPhotos.length > 0) {
      Alert.alert(
        'Fotos Faltantes',
        `Debes capturar la foto final para ${missingPhotos.length} equipo(s).`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Validar firma del cliente
    if (!clientSignature) {
      Alert.alert(
        'Firma Requerida',
        'Se requiere la firma del cliente para completar el mantenimiento.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setCompleting(true);

      // Obtener GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos permisos de ubicación para finalizar.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Preparar fotos finales (sin prefijo images/)
      const finalPhotos = deviceFinalPhotos
        .filter((p) => p.photoName)
        .map((p) => ({
          client_device_id: p.deviceId,
          photo: p.photoName!,
        }));

      // Preparar firma (sin prefijo images/)
      const signaturePath = clientSignature ? clientSignature : undefined;

      // Completar mantenimiento
      const response = await TecnicoMantenimientosService.completeMaintenance(
        token,
        maintenanceId,
        {
          latitude,
          longitude,
          final_observations: finalObservations.trim() || undefined,
          client_signature: signaturePath,
          final_photos: finalPhotos,
        }
      );

      if (response.success) {
        // Navegar a pantalla de completado
        navigate('MantenimientoCompletado', { maintenanceId });
      } else {
        throw new Error(response.message || 'Error al completar mantenimiento');
      }
    } catch (error) {
      showError(error, 'Error al completar mantenimiento');
    } finally {
      setCompleting(false);
    }
  }, [token, maintenance, deviceFinalPhotos, clientSignature, finalObservations, maintenanceId, navigate, showError]);

  // Calcular progreso desde los datos reales del endpoint
  const progress = useMemo(() => {
    if (!progressData?.data || !maintenance) {
      return { 
        completed: 0, 
        total: 0, 
        machines: 0, 
        totalMachines: 0,
        completedMachines: 0,
        avgProgress: 0,
      };
    }

    const { devices, global } = progressData.data;
    
    let totalTasks = 0;
    let completedTasks = 0;
    let completedMachines = 0;

    devices.forEach((device: DeviceProgress) => {
      totalTasks += device.progress_total || 0;
      completedTasks += device.progress_completed_count || 0;
      if (device.progress_status === 'completed') {
        completedMachines++;
      }
    });

    return {
      completed: completedTasks,
      total: totalTasks,
      machines: completedMachines,
      totalMachines: global?.total_devices || devices.length,
      completedMachines,
      avgProgress: global?.avg_progress_pct || 0,
      devices: devices as DeviceProgress[],
    };
  }, [progressData, maintenance]);

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
      
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => navigate('MantenimientoEnProgreso', { maintenanceId })} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Finalizar Mantenimiento</Text>
          <Text style={styles.headerSubtitle}>Completa todos los pasos</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Resumen de Progreso */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.progressTitle}>Progreso Completado</Text>
          </View>
          
          <View style={styles.progressStats}>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Tiempo total:</Text>
              <Text style={styles.progressValue}>{formattedTime}</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Tareas completadas:</Text>
              <Text style={styles.progressValue}>
                {progress.completed}/{progress.total} {progress.total > 0 ? `(${Math.round((progress.completed / progress.total) * 100)}%)` : ''}
              </Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Máquinas completadas:</Text>
              <Text style={styles.progressValue}>
                {progress.completedMachines}/{progress.totalMachines} {progress.totalMachines > 0 ? `(${Math.round((progress.completedMachines / progress.totalMachines) * 100)}%)` : ''}
              </Text>
            </View>
            {progress.avgProgress > 0 && (
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Progreso promedio:</Text>
                <Text style={styles.progressValue}>{progress.avgProgress.toFixed(1)}%</Text>
              </View>
            )}
          </View>

          {/* Progreso por Máquina */}
          {progress.devices && progress.devices.length > 0 && (
            <View style={styles.devicesProgressContainer}>
              <Text style={styles.devicesProgressTitle}>Progreso por Máquina</Text>
              {progress.devices.map((deviceProgress: DeviceProgress) => {
                const device = maintenance?.device.find(d => d.client_device_id === deviceProgress.client_device_id);
                const devicePct = deviceProgress.progress_pct || 0;
                const isCompleted = deviceProgress.progress_status === 'completed';
                
                return (
                  <View key={deviceProgress.client_device_id} style={styles.deviceProgressCard}>
                    <View style={styles.deviceProgressHeader}>
                      <MaterialIcons 
                        name={isCompleted ? "check-circle" : "radio-button-unchecked"} 
                        size={20} 
                        color={isCompleted ? "#34C759" : "#FF9500"} 
                      />
                      <View style={styles.deviceProgressInfo}>
                        <Text style={styles.deviceProgressName}>
                          {device?.brand} {device?.model}
                        </Text>
                        <Text style={styles.deviceProgressSerial}>
                          Serial: {device?.serial || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.deviceProgressBadge}>
                        <Text style={[
                          styles.deviceProgressBadgeText,
                          { color: isCompleted ? '#34C759' : '#FF9500' }
                        ]}>
                          {devicePct.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.deviceProgressBarContainer}>
                      <View style={styles.deviceProgressBar}>
                        <View 
                          style={[
                            styles.deviceProgressBarFill,
                            { 
                              width: `${devicePct}%`,
                              backgroundColor: isCompleted ? '#34C759' : '#FF9500',
                            }
                          ]} 
                        />
                      </View>
                    </View>
                    
                    <View style={styles.deviceProgressDetails}>
                      <Text style={styles.deviceProgressDetailText}>
                        Tareas: {deviceProgress.progress_completed_count || 0}/{deviceProgress.progress_total || 0}
                      </Text>
                      <Text style={[
                        styles.deviceProgressStatus,
                        { color: isCompleted ? '#34C759' : '#FF9500' }
                      ]}>
                        {isCompleted ? 'Completado' : 'En progreso'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Fotos Finales Requeridas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="camera" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Fotos Finales Requeridas</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Toma fotos del estado final de cada máquina
          </Text>

          {deviceFinalPhotos.map((devicePhoto) => (
            <View key={devicePhoto.deviceId} style={styles.devicePhotoCard}>
              <View style={styles.devicePhotoHeader}>
                <MaterialIcons name="devices" size={20} color="#666" />
                <Text style={styles.devicePhotoName}>
                  {devicePhoto.device.brand} {devicePhoto.device.model}
                </Text>
                {devicePhoto.captured && devicePhoto.photoName && (
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                )}
              </View>

              {devicePhoto.photoUri ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: devicePhoto.photoUri }} style={styles.photoPreviewImage} />
                  {devicePhoto.uploading && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="large" color="#fff" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.changePhotoButton}
                    onPress={() => takeFinalPhoto(devicePhoto.deviceId)}
                  >
                    <Ionicons name="camera" size={16} color="#007AFF" />
                    <Text style={styles.changePhotoText}>Cambiar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.capturePhotoButton}
                  onPress={() => takeFinalPhoto(devicePhoto.deviceId)}
                  disabled={devicePhoto.uploading}
                >
                  {devicePhoto.uploading ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={24} color="#007AFF" />
                      <Text style={styles.capturePhotoText}>Tomar Foto Final</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Observaciones Finales */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color="#FF9500" />
            <Text style={styles.sectionTitle}>Observaciones Finales</Text>
          </View>
          <TextInput
            style={styles.observationsInput}
            placeholder="Agrega comentarios sobre el trabajo realizado, observaciones importantes, recomendaciones al cliente, etc."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            value={finalObservations}
            onChangeText={setFinalObservations}
            textAlignVertical="top"
          />
        </View>

        {/* Firma del Cliente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create" size={20} color="#FF9500" />
            <Text style={styles.sectionTitle}>Firma del Cliente</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Se requiere firma del cliente para confirmar el servicio
          </Text>
          
          <TouchableOpacity 
            style={styles.signaturePreview}
            onPress={() => setSignatureModalVisible(true)}
            activeOpacity={0.8}
          >
            {clientSignature ? (
              <View style={styles.signaturePreviewContent}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.signaturePreviewText}>Firma registrada</Text>
                <Text style={styles.signaturePreviewSubtext}>Toca para editar</Text>
              </View>
            ) : (
              <View style={styles.signaturePreviewContent}>
                <Ionicons name="create-outline" size={32} color="#9CA3AF" />
                <Text style={styles.signaturePreviewText}>Toca para firmar</Text>
                <Text style={styles.signaturePreviewSubtext}>Pantalla completa</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal de Firma en Pantalla Completa */}
        <Modal
          visible={signatureModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSignatureModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <SignatureCanvas
              onSignatureChange={handleSignatureSaved}
              width={width}
              height={height}
              isFullscreen={true}
              onClose={() => setSignatureModalVisible(false)}
              uploading={uploadingSignature}
              uploadImage={async (uri: string, name: string) => {
                setUploadingSignature(true);
                try {
                  const imageName = await signatureUpload.uploadImage(uri, name);
                  return imageName;
                } catch (error) {
                  console.error('Error subiendo firma:', error);
                  return null;
                } finally {
                  setUploadingSignature(false);
                }
              }}
            />
          </SafeAreaView>
        </Modal>
      </ScrollView>

      {/* Botón Completar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            (completing || !clientSignature || deviceFinalPhotos.some((p) => !p.photoName)) &&
              styles.buttonDisabled,
          ]}
          onPress={handleCompleteMaintenance}
          disabled={
            completing ||
            !clientSignature ||
            deviceFinalPhotos.some((p) => !p.photoName)
          }
        >
          {completing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
          )}
          <Text style={styles.completeButtonText}>
            {completing ? 'Completando...' : 'Completar Mantenimiento'}
          </Text>
        </TouchableOpacity>
      </View>
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
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  progressSection: {
    backgroundColor: '#E8F5E9',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
  },
  progressStats: {
    gap: 12,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  devicesProgressContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#C8E6C9',
  },
  devicesProgressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 16,
  },
  deviceProgressCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  deviceProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  deviceProgressInfo: {
    flex: 1,
  },
  deviceProgressName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  deviceProgressSerial: {
    fontSize: 12,
    color: '#6B7280',
  },
  deviceProgressBadge: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deviceProgressBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deviceProgressBarContainer: {
    marginBottom: 10,
  },
  deviceProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  deviceProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  deviceProgressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceProgressDetailText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  deviceProgressStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    marginLeft: 28,
  },
  devicePhotoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  devicePhotoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  devicePhotoName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  photoPreview: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  photoPreviewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  capturePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    gap: 8,
  },
  capturePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  observationsInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 120,
    fontSize: 14,
    color: '#000',
    marginTop: 8,
  },
  signaturePreview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 12,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  signaturePreviewContent: {
    alignItems: 'center',
    gap: 8,
  },
  signaturePreviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  signaturePreviewSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  signatureContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 20,
  },
  signatureFullscreen: {
    backgroundColor: '#fff',
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 20,
  },
  signatureHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  signatureCanvas: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  signerInfoContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  signerInfoRow: {
    marginBottom: 12,
  },
  signerInfoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  signerInfoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  signerInfoInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
  },
  svgContainer: {
    flex: 1,
  },
  signaturePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  signaturePlaceholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  signatureActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  doneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

