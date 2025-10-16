import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Image,
  Linking,
  StatusBar,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSmartNavigation } from '../../../hooks/useSmartNavigation';
import { getEquiposVinculados } from '../../../services/EquipoClienteService';
import { useError } from '../../../context/ErrorContext';
import { createMantenimiento } from '../../../services/MantenimientoService';
import { uploadImage } from '../../../services/UploadImage';
import { useAuth } from '../../../context/AuthContext';
import BackButton from '../../../components/BackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MultiDeviceSelector } from '../../../components/Mantenimiento/MultiDeviceSelector';
import { Device } from '../../../types/mantenimiento/mantenimiento';

type RootStackParamList = {
  SolicitarMantenimiento: undefined;
};

const CHECKLIST_MANTENIMIENTO: Record<string, string[]> = {
  lavadora: [
    'Alineación y tensión correas',
    'Limpieza y regulación válvulas solenoides',
    'Inspección de empaques',
    'Inspección de cierre',
    'Ajuste y limpieza cofre eléctrico',
    'Revisión tarjeta electrónica',
    'Engrase y revisión rodamientos del sistema motriz',
    'Inspección de los rodamientos del motor',
    'Revisión parámetros variador',
  ],
  secadora: [
    'Alineación y tensión correas',
    'Limpieza tapas posteriores',
    'Inspección de empaques',
    'Inspección de cierre',
    'Ajuste y limpieza cofre eléctrico',
    'Revisión tarjeta electrónica',
    'Engrase y revisión chumaceras',
  ],
};

export default function CrearMantenimiento() {
  const { navigate, navigateReplace } = useSmartNavigation();
  const { token } = useAuth();
  const { showError } = useError();

  const [equipos, setEquipos] = useState<
      { 
        id: number; 
        name: string; 
        tipo_equipo?: string;
        serial?: string;
        brand?: string;
        device_info?: any;
      }[]
  >([]);

  // Estado para equipos seleccionados
  const [selectedDevices, setSelectedDevices] = useState<{ device_id: number; description?: string }[]>([]);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

  const [tipo, setTipo] = useState<'preventive' | 'corrective'>('preventive');
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const cargarEquipos = async () => {
      if (!token) return;

      try {
        const equiposData = await getEquiposVinculados(token);
        
        const listaEquipos = equiposData.map((item: any) => {
          const { device, address, id, serial } = item;
          console.log('🔍 device', device);
          return {
            id,
            name: `${device.model} - ${address}`,
            tipo_equipo: device.type,
            serial: serial,
            brand: 'Carini', // Siempre Carini
            device_info: device,
          };
        });
        setEquipos(listaEquipos);

      } catch (error) {
        console.error('Error al cargar datos:', error);
        Alert.alert('Error', 'Hubo un problema cargando los datos.');
      }
    };

    cargarEquipos();
  }, [token]);

    const pickImage = async () => {
        try {
            const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                if (canAskAgain) {
                    // El usuario negó, pero aún podemos volver a preguntar
                    Alert.alert(
                        'Permisos requeridos',
                        'Necesitamos acceso a tu galería para seleccionar imágenes.',
                        [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Intentar de nuevo', onPress: () => pickImage() }
                        ]
                    );
                } else {
                    // El usuario negó permanentemente
                    Alert.alert(
                        'Permiso denegado',
                        'Debes habilitar el acceso a la galería desde los ajustes de tu dispositivo.',
                        [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Abrir ajustes', onPress: () => Linking.openSettings() }
                        ]
                    );
                }
                return;
            }

            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!resultado.canceled && resultado.assets.length > 0) {
                setFoto(resultado.assets[0]);
            }
        } catch (error) {
            console.error('Error al seleccionar imagen:', error);
            Alert.alert('Error', 'Hubo un problema al seleccionar la imagen.');
        }
    };

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    try {
      let nombreImagen: string | undefined;

      if (foto) {
        try {
          nombreImagen = `maintenances/mantenimiento_${Date.now()}`;
          const uri = foto.uri;

          if (!uri) {
            Alert.alert('Error', 'La imagen seleccionada no es válida.');
            return;
          }

          console.log('Subiendo imagen:', nombreImagen);
          const uploadResult = await uploadImage(uri, nombreImagen!, token!);

          if (uploadResult) {
            console.log('Imagen subida exitosamente:', uploadResult);
          } else {
            Alert.alert('Advertencia', 'No se pudo subir la imagen, pero se continuará con el registro.');
            nombreImagen = undefined;
          }
        } catch (uploadError) {
          console.error('Error al subir imagen:', uploadError);
          const shouldContinue = await new Promise((resolve) => {
            Alert.alert(
                'Error de imagen',
                '¿Deseas continuar sin la imagen?',
                [
                  { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
                  { text: 'Continuar', onPress: () => resolve(true) }
                ]
            );
          });

          if (!shouldContinue) {
            return;
          }
          nombreImagen = undefined;
        }
      }

      // Validar selección de equipos
      if (selectedDevices.length === 0) {
        Alert.alert('Error', 'Selecciona al menos un equipo.');
        return;
      }

      if (tipo === 'corrective' && descripcion.trim() === '') {
        Alert.alert('Error', 'La descripción es obligatoria para mantenimientos correctivos.');
        return;
      }

      // Crear payload para múltiples equipos
      const payload: any = {
        type: tipo,
        description: descripcion.trim(),
        photo: nombreImagen,
        client_devices: selectedDevices.map(device => ({
          id: device.device_id,
          description: device.description || null
        })),
      };

      console.log('Enviando payload:', payload);
      await createMantenimiento(payload, token!);

      setSelectedDevices([]);
      setDescripcion('');
      setFoto(null);

      if (tipo === 'corrective') {
        Alert.alert('Llama al soporte', 'Para mantenimientos correctivos llama al 3104856772', [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Llamar',
            onPress: () => {
              Linking.openURL('tel:3104856772');
              navigate('SolicitarMantenimiento');
            },
          },
        ]);
      } else {
        Alert.alert('✅ Mantenimiento registrado', 'Tu solicitud ha sido creada correctamente.', [
          { text: 'OK', onPress: () => navigateReplace('SolicitarMantenimiento') },
        ]);
      }
    } catch (error: any) {
      console.error('Error al crear mantenimiento:', error);
      showError(error, 'Ocurrió un error al registrar el mantenimiento.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    Alert.alert(
        'Remover imagen',
        '¿Estás seguro de que deseas remover la imagen?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Remover', onPress: () => setFoto(null) },
        ]
    );
  };

    const isFormValid = () => {
        // Validar selección de equipos
        if (selectedDevices.length === 0) return false;
        
        if (tipo === 'preventive') {
            return true;
        }
        if (tipo === 'corrective') {
            return descripcion.trim().length > 0;
        }
        return false;
    };


    const renderEquipoSelector = () => (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Equipos a mantener</Text>
        <Text style={styles.sectionSubtitle}>Selecciona uno o más equipos para el mantenimiento</Text>
        
        {/* Selector de equipos */}
        <TouchableOpacity
          style={[styles.selector, selectedDevices.length > 0 && styles.selectorFilled]}
          onPress={() => setShowDeviceSelector(true)}
        >
          <View style={styles.selectorContent}>
            <View style={styles.selectorIcon}>
              <Ionicons
                  name="hardware-chip"
                  size={24}
                  color={selectedDevices.length > 0 ? "#007AFF" : "#666"}
              />
            </View>
            <View style={styles.selectorTextContainer}>
              <Text style={[
                styles.selectorText,
                selectedDevices.length > 0 && styles.selectorTextFilled
              ]}>
                {selectedDevices.length === 0
                  ? 'Seleccionar equipos'
                  : `${selectedDevices.length} equipo${selectedDevices.length !== 1 ? 's' : ''} seleccionado${selectedDevices.length !== 1 ? 's' : ''}`
                }
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        {/* Lista de equipos seleccionados */}
        {selectedDevices.length > 0 && (
          <View style={styles.selectedDevicesContainer}>
            {selectedDevices.map((selection, index) => {
              const device = equipos.find(e => e.id === selection.device_id);
              return (
                <View key={selection.device_id} style={styles.selectedDeviceItem}>
                  <View style={styles.selectedDeviceInfo}>
                    <Text style={styles.selectedDeviceModel}>
                      {device?.name || 'Equipo no encontrado'}
                    </Text>
                    {selection.description && (
                      <Text style={styles.selectedDeviceDescription}>
                        {selection.description}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.removeDeviceButton}
                    onPress={() => setSelectedDevices(prev => 
                      prev.filter(sel => sel.device_id !== selection.device_id)
                    )}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>
  );

  const renderTipoSelector = () => (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tipo de mantenimiento</Text>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
              style={[
                styles.segmentButton,
                styles.segmentButtonLeft,
                tipo === 'preventive' && styles.segmentButtonActive
              ]}
              onPress={() => setTipo('preventive')}
          >
            <Ionicons
                name="shield-checkmark"
                size={20}
                color={tipo === 'preventive' ? '#fff' : '#007AFF'}
            />
            <Text style={[
              styles.segmentText,
              tipo === 'preventive' && styles.segmentTextActive
            ]}>
              Preventivo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={[
                styles.segmentButton,
                styles.segmentButtonRight,
                tipo === 'corrective' && styles.segmentButtonActive
              ]}
              onPress={() => setTipo('corrective')}
          >
            <Ionicons
                name="warning"
                size={20}
                color={tipo === 'corrective' ? '#fff' : '#FF6B47'}
            />
            <Text style={[
              styles.segmentText,
              tipo === 'corrective' && styles.segmentTextActive
            ]}>
              Correctivo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
  );

  const renderChecklist = () => {
    if (tipo !== 'preventive' || selectedDevices.length === 0) return null;

    // Obtener tipos de equipos seleccionados
    const deviceTypes = selectedDevices.map(selection => {
      const device = equipos.find(e => e.id === selection.device_id);
      return device?.tipo_equipo?.toLowerCase();
    }).filter(Boolean);

    if (deviceTypes.length === 0) return null;

    // Agrupar equipos por tipo
    const equipmentGroups: { [key: string]: string[] } = {};
    selectedDevices.forEach(selection => {
      const device = equipos.find(e => e.id === selection.device_id);
      const type = device?.tipo_equipo?.toLowerCase();
      if (type && device) {
        if (!equipmentGroups[type]) {
          equipmentGroups[type] = [];
        }
        equipmentGroups[type].push(device.name);
      }
    });

    // Si todos los equipos son del mismo tipo, mostrar un solo checklist
    if (Object.keys(equipmentGroups).length === 1) {
      const equipmentType = Object.keys(equipmentGroups)[0];
      const checklistItems = CHECKLIST_MANTENIMIENTO[equipmentType];
      
      if (!checklistItems) return null;

      return (
        <View style={styles.checklistContainer}>
          <View style={styles.checklistHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.checklistTitle}>
              Mantenimiento preventivo para {equipmentType}s incluye:
            </Text>
          </View>
          {checklistItems.map((item, index) => (
            <View key={index} style={styles.checklistItem}>
              <View style={styles.checklistBullet} />
              <Text style={styles.checklistItemText}>{item}</Text>
            </View>
          ))}
        </View>
      );
    }

    // Si hay diferentes tipos de equipos, mostrar checklists separados
    return (
      <View style={styles.checklistContainer}>
        <View style={styles.checklistHeader}>
          <Ionicons name="checkmark-circle" size={24} color="#34C759" />
          <Text style={styles.checklistTitle}>
            Mantenimientos preventivos incluidos:
          </Text>
        </View>
        
        {Object.entries(equipmentGroups).map(([equipmentType, deviceNames]) => {
          const checklistItems = CHECKLIST_MANTENIMIENTO[equipmentType];
          if (!checklistItems) return null;

          return (
            <View key={equipmentType} style={styles.checklistGroup}>
              <View style={styles.checklistGroupHeader}>
                <Ionicons 
                  name={equipmentType === 'lavadora' ? 'water' : 'flame'} 
                  size={20} 
                  color="#34C759" 
                />
                <Text style={styles.checklistGroupTitle}>
                  {equipmentType === 'lavadora' ? 'Lavadoras' : 'Secadoras'} ({deviceNames.length})
                </Text>
              </View>
              
              {checklistItems.map((item, index) => (
                <View key={index} style={styles.checklistItem}>
                  <View style={styles.checklistBullet} />
                  <Text style={styles.checklistItemText}>{item}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    );
  };


  const renderImagePicker = () => (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Foto del equipo</Text>
        <Text style={styles.sectionSubtitle}>Opcional - Ayuda a identificar el problema</Text>

        {!foto ? (
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <View style={styles.imagePickerContent}>
                <View style={styles.imagePickerIcon}>
                  <Ionicons name="camera" size={36} color="#007AFF" />
                </View>
                <Text style={styles.imagePickerText}>Seleccionar foto</Text>
                <Text style={styles.imagePickerSubtext}>JPG, PNG hasta 5MB</Text>
              </View>
            </TouchableOpacity>
        ) : (
            <View style={styles.imageContainer}>
              <Image source={{ uri: foto.uri }} style={styles.imagePreview} />
              <View style={styles.imageOverlay}>
                <TouchableOpacity style={styles.imageAction} onPress={pickImage}>
                  <Ionicons name="pencil" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageAction} onPress={removeImage}>
                  <Ionicons name="trash" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
        )}
      </View>
  );

  const renderDescripcion = () => {
    if (tipo !== 'corrective') return null;

    return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción del problema</Text>
          <Text style={styles.sectionSubtitle}>Describe detalladamente el problema</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
                placeholder="Ej: La lavadora no centrifuga correctamente, hace ruido extraño..."
                multiline
                numberOfLines={4}
                style={styles.textArea}
                value={descripcion}
                onChangeText={setDescripcion}
                textAlignVertical="top"
                placeholderTextColor="#999"
            />
            <Text style={styles.characterCount}>
              {descripcion.length}/500
            </Text>
          </View>
        </View>
    );
  };

  return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.header}>
          <BackButton
              style={styles.backButton}
              color="#000"
              size={28}
          />
          <Text style={styles.title}>Nuevo Mantenimiento</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
          {renderEquipoSelector()}
          {renderTipoSelector()}
          {renderChecklist()}
          {renderImagePicker()}
          {renderDescripcion()}

          <TouchableOpacity
              style={[
                styles.submitButton,
                !isFormValid() && styles.submitButtonDisabled,
                loading && styles.submitButtonLoading
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid() || loading}
          >
            {loading ? (
                <Text style={styles.submitText}>Procesando...</Text>
            ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.submitText}>Registrar mantenimiento</Text>
                </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Modal Selector de Equipos */}
        <Modal
          visible={showDeviceSelector}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <MultiDeviceSelector
            devices={equipos.map(eq => ({
              id: eq.id,
              model: eq.name.split(' - ')[0] || eq.name,
              brand: 'Carini', // Siempre Carini
              type: eq.tipo_equipo || 'equipo',
              serial: eq.serial || 'N/A',
              address: eq.name.split(' - ')[1] || 'N/A',
            }))}
            selectedDevices={selectedDevices}
            onSelectionChange={setSelectedDevices}
            onClose={() => setShowDeviceSelector(false)}
          />
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
    paddingTop: 15,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginLeft: -44,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  selector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorText: {
    fontSize: 17,
    color: '#666',
    fontWeight: '400',
  },
  selectorTextFilled: {
    color: '#000',
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
    borderRadius: 8,
  },
  segmentButtonLeft: {},
  segmentButtonRight: {},
  segmentButtonActive: {
    backgroundColor: '#007AFF',
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  checklistContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#C8E6C8',
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D2E',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 8,
  },
  checklistBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D2E',
    marginTop: 8,
    marginRight: 16,
  },
  checklistItemText: {
    fontSize: 16,
    color: '#2E7D2E',
    lineHeight: 24,
    flex: 1,
    fontWeight: '500',
  },
  imagePicker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D0D0D0',
    borderStyle: 'dashed',
  },
  imagePickerContent: {
    alignItems: 'center',
  },
  imagePickerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePickerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  imagePickerSubtext: {
    fontSize: 16,
    color: '#666',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  imageAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  textArea: {
    padding: 20,
    fontSize: 17,
    color: '#000',
    minHeight: 140,
    maxHeight: 220,
  },
  characterCount: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    fontSize: 14,
    color: '#666',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonLoading: {
    backgroundColor: '#0056CC',
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  modalCancelButton: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalSpacer: {
    width: 70,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  modalItemText: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    fontWeight: '500',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginLeft: 60,
  },
  // Estilos para el selector de modo
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  // Estilos para equipos seleccionados
  selectedDevicesContainer: {
    marginTop: 12,
  },
  selectedDeviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedDeviceInfo: {
    flex: 1,
  },
  selectedDeviceModel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  selectedDeviceDescription: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  removeDeviceButton: {
    marginLeft: 8,
  },
  // Estilos para checklist agrupado
  checklistGroup: {
    marginBottom: 20,
    paddingLeft: 8,
  },
  checklistGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  checklistGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D2E',
  },
});