import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { useImageUpload } from '../../hooks/useImageUpload';
import TecnicoMantenimientosService, {
  TecnicoMaintenance,
  Device,
} from '../../services/TecnicoMantenimientosService';
import BackButton from '../../components/BackButton';

type RouteParams = {
  maintenanceId: number;
};

interface DevicePhoto {
  deviceId: number;
  photoUri: string | null; // URI local de la imagen
  photoName: string | null; // Nombre de la imagen subida a S3
  captured: boolean;
  uploading: boolean;
}

export default function IniciarMantenimiento({ route }: { route: { params: RouteParams } }) {
  const { goBack, navigateReset } = useSmartNavigation();
  const { token } = useAuth();
  const { showError } = useError();
  const { maintenanceId } = route.params;

  const [maintenance, setMaintenance] = useState<TecnicoMaintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [devicePhotos, setDevicePhotos] = useState<DevicePhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Hook para subir imágenes
  const imageUpload = useImageUpload({
    aspect: [4, 3],
    quality: 0.8,
    allowsEditing: true,
    defaultName: 'maintenance',
  });

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
        // Inicializar array de fotos por dispositivo
        const photos = response.data.device.map((device) => ({
          deviceId: device.client_device_id,
          photoUri: null,
          photoName: null,
          captured: false,
          uploading: false,
        }));
        setDevicePhotos(photos);
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

  const takePhoto = useCallback(async (deviceId: number) => {
    if (!token) return;

    try {
      // Paso 1: Tomar la foto usando el hook
      const photoUri = await imageUpload.takePhoto();
      
      if (!photoUri) {
        console.log('❌ No se capturó ninguna foto - posiblemente el usuario canceló o no hay permisos');
        return;
      }

      //console.log('📸 Foto capturada:', photoUri);

      // Marcar como uploading
      setDevicePhotos((prev) =>
        prev.map((item) =>
          item.deviceId === deviceId
            ? { ...item, photoUri, uploading: true, captured: false }
            : item
        )
      );

      // Paso 2: Subir la foto a S3
      const customName = `maintenance_${maintenanceId}_device_${deviceId}_initial`;
      const imageName = await imageUpload.uploadImage(photoUri, customName);

      if (!imageName) {
        throw new Error('Error al subir la imagen a S3');
      }

      //console.log('☁️ Imagen subida a S3:', imageName);

      // Actualizar estado con el nombre de la imagen
      setDevicePhotos((prev) =>
        prev.map((item) =>
          item.deviceId === deviceId
            ? { ...item, photoName: imageName, uploading: false, captured: true }
            : item
        )
      );

      // No mostrar alert, solo actualizar la UI
      //console.log('✅ Foto capturada y subida correctamente');
    } catch (error) {
      console.error('❌ Error en takePhoto:', error);
      
      // Revertir estado en caso de error
      setDevicePhotos((prev) =>
        prev.map((item) =>
          item.deviceId === deviceId
            ? { ...item, uploading: false, captured: false, photoUri: null, photoName: null }
            : item
        )
      );

      // Mostrar error más específico según el tipo de error
      let errorMessage = 'No se pudo capturar o subir la foto. Intenta nuevamente.';
      
      if (error instanceof Error) {
        if (error.message.includes('permission') || error.message.includes('permiso')) {
          errorMessage = 'Se requiere permiso para acceder a la cámara. Ve a Configuración y habilita el acceso a la cámara para esta aplicación.';
        } else if (error.message.includes('camera') || error.message.includes('cámara')) {
          errorMessage = 'Error al acceder a la cámara. Verifica que la cámara esté disponible y no esté siendo usada por otra aplicación.';
        } else if (error.message.includes('upload') || error.message.includes('subir')) {
          errorMessage = 'Error al subir la imagen. Verifica tu conexión a internet e intenta nuevamente.';
        }
      }

      Alert.alert('Error', errorMessage);
      showError(error);
    }
  }, [token, imageUpload, maintenanceId, showError]);

  const canConfirm = useMemo(() => {
    return devicePhotos.some((item) => item.captured);
  }, [devicePhotos]);

  const handleConfirm = () => {
    const capturedCount = devicePhotos.filter((item) => item.captured).length;
    const totalDevices = devicePhotos.length;

    Alert.alert(
      'Confirmar e Iniciar',
      `Has capturado ${capturedCount} de ${totalDevices} fotos.\n¿Deseas iniciar el mantenimiento?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: () => startMaintenance(),
        },
      ]
    );
  };

  const startMaintenance = async () => {
    if (!token) return;

    try {
      setSubmitting(true);
      
      console.log('🚀 Iniciando mantenimiento...');

      // Obtener todas las fotos capturadas
      const capturedPhotos = devicePhotos.filter((item) => item.captured && item.photoName);

      if (capturedPhotos.length === 0) {
        Alert.alert('Error', 'Debes capturar al menos una foto antes de iniciar el mantenimiento.');
        return;
      }

      // Paso 1: Obtener ubicación GPS
      console.log('📍 Obteniendo ubicación GPS...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos de Ubicación',
          'Necesitamos permisos de ubicación para iniciar el mantenimiento.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      console.log('📍 Ubicación obtenida:', { latitude, longitude });

      // Paso 2: Subir fotos
      const photosToUpload = capturedPhotos.map((devicePhoto) => ({
        client_device_id: devicePhoto.deviceId,
        photo: devicePhoto.photoName!,
        photo_type: 'initial' as const,
      }));

      console.log(`📤 Subiendo ${photosToUpload.length} fotos...`);
      const photosResponse = await TecnicoMantenimientosService.uploadMaintenancePhotos(
        token,
        maintenanceId,
        photosToUpload
      );

      if (!photosResponse.success) {
        throw new Error(photosResponse.message || 'Error al guardar las fotos');
      }

      // Paso 3: Iniciar mantenimiento con ubicación
      console.log('🚀 Iniciando mantenimiento con ubicación...');
      const startResponse = await TecnicoMantenimientosService.startMaintenance(
        token,
        maintenanceId,
        { latitude, longitude }
      );

      if (!startResponse.success) {
        throw new Error(startResponse.message || 'Error al iniciar el mantenimiento');
      }

      console.log('✅ Mantenimiento iniciado exitosamente');

      Alert.alert(
        '¡Mantenimiento Iniciado!',
        `Se han subido ${capturedPhotos.length} foto(s) inicial(es) y el mantenimiento ha sido iniciado exitosamente.`,
        [
          {
            text: 'Continuar',
            onPress: () => {
              // Navegar a la pantalla de mantenimiento en progreso
              navigateReset('MantenimientoEnProgreso', { maintenanceId });
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error iniciando mantenimiento:', error);
      Alert.alert(
        'Error',
        'Hubo un problema al iniciar el mantenimiento. Por favor, intenta nuevamente.'
      );
      showError(error);
    } finally {
      setSubmitting(false);
    }
  };

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
        <BackButton onPress={goBack} color="#fff" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>Foto Inicial Requerida</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner de Instrucciones */}
        <View style={styles.instructionBanner}>
          <Ionicons name="camera" size={24} color="#FF9500" />
          <View style={styles.instructionText}>
            <Text style={styles.instructionTitle}>Captura el estado inicial</Text>
            <Text style={styles.instructionSubtitle}>
              Toma una foto de cada máquina antes de iniciar el mantenimiento
            </Text>
          </View>
        </View>

        {/* Lista de Dispositivos */}
        {maintenance.device.map((device, index) => {
          const devicePhoto = devicePhotos.find((p) => p.deviceId === device.client_device_id);
          const isCaptured = devicePhoto?.captured || false;
          const isUploading = devicePhoto?.uploading || false;

          return (
            <View key={device.id} style={styles.deviceCard}>
              <View style={styles.deviceHeader}>
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
                  <Text style={styles.deviceSerial}>{device.type} - Serie: {device.serial}</Text>
                </View>
                {isUploading && (
                  <ActivityIndicator size="small" color="#007AFF" />
                )}
              </View>

              {/* Área de Foto */}
              {devicePhoto?.photoUri ? (
                <View style={styles.photoPreview}>
                  <Image
                    source={{ uri: devicePhoto.photoUri }}
                    style={styles.photoImage}
                  />
                  {isUploading ? (
                    <View style={styles.photoOverlay}>
                      <ActivityIndicator size="large" color="#fff" />
                      <Text style={[styles.uploadingText, { color: '#fff', marginTop: 12 }]}>Subiendo foto…</Text>
                    </View>
                  ) : isCaptured ? (
                    <View style={styles.photoOverlay}>
                      <View style={styles.photoBadge}>
                        <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                        <Text style={styles.photoBadgeText}>Foto Capturada y Subida</Text>
                      </View>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => takePhoto(device.client_device_id)}
                    disabled={isUploading}
                  >
                    <Ionicons name="camera" size={20} color="#007AFF" />
                    <Text style={styles.retakeButtonText}>Tomar Nuevamente</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.takePhotoButton}
                  onPress={() => takePhoto(device.client_device_id)}
                  disabled={isUploading}
                >
                  <Ionicons name="camera" size={32} color="#007AFF" />
                  <Text style={styles.takePhotoText}>Tomar Foto Inicial</Text>
                  <Text style={styles.takePhotoSubtext}>Estado antes del mantenimiento</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Información de Progreso */}
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {devicePhotos.filter((p) => p.captured).length}/{devicePhotos.length} fotos capturadas
          </Text>
          {!canConfirm && (
            <Text style={styles.warningText}>
              ⚠️ Debes tomar al menos 1 foto para continuar
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Botón de Confirmar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!canConfirm || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.confirmButtonText}>
                {`Confirmar e Iniciar (${devicePhotos.filter((p) => p.captured).length}/${devicePhotos.length} fotos)`}
              </Text>
            </>
          )}
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 16,
    margin: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    gap: 12,
  },
  instructionText: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  instructionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
    gap: 12,
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
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  deviceSerial: {
    fontSize: 13,
    color: '#666',
  },
  takePhotoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  takePhotoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 12,
  },
  takePhotoSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    backgroundColor: '#F0F8FF',
  },
  uploadingText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 12,
    fontWeight: '600',
  },
  photoPreview: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  photoBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressInfo: {
    alignItems: 'center',
    padding: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9500',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
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
});

