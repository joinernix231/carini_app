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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getEquiposVinculados } from '../../../services/EquipoClienteService';
import { createMantenimiento, getFechasDisponiblesTecnicos } from '../../../services/MantenimientoService';
import { uploadImage } from '../../../services/UploadImage';
import { useAuth } from '../../../context/AuthContext';

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuth();

  const [equipos, setEquipos] = useState<
      { id: number; name: string; maintenance_type_id: number; tipo_equipo?: string }[]
  >([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<{
    id: number;
    name: string;
    maintenance_type_id: number;
    tipo_equipo?: string;
  } | null>(null);

  const [tipo, setTipo] = useState<'preventive' | 'corrective'>('preventive');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState<Date | null>(null);
  const [fechasDisponibles, setFechasDisponibles] = useState<string[]>([]);
  const [foto, setFoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  const [modalEquipo, setModalEquipo] = useState(false);
  const [modalFechas, setModalFechas] = useState(false);

  // Función helper para crear fecha local desde string YYYY-MM-DD
  const createLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 porque Date() usa 0-11 para meses
  };

  useEffect(() => {
    const cargarEquiposYFechas = async () => {
      if (!token) return;

      try {
        const equiposData = await getEquiposVinculados(token);
        const listaEquipos = equiposData.map((item: any) => {
          const { device, address, id } = item;
          return {
            id,
            name: `${device.model} (${device.serial}) - ${address}`,
            maintenance_type_id: device.maintenance_type_id || 1,
            tipo_equipo: device.type,
          };
        });
        setEquipos(listaEquipos);

        const response = await getFechasDisponiblesTecnicos(token);
        if (response.success && Array.isArray(response.data)) {
          setFechasDisponibles(response.data);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        Alert.alert('Error', 'Hubo un problema cargando los datos.');
      }
    };

    cargarEquiposYFechas();
  }, [token]);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permisos necesarios', 'Se necesitan permisos para acceder a la galería de fotos.');
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
          const uploadResult = await uploadImage(uri, nombreImagen, token);

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

      if (!equipoSeleccionado) {
        Alert.alert('Error', 'Selecciona un equipo.');
        return;
      }

      if (tipo === 'preventive' && !fecha) {
        Alert.alert('Error', 'Selecciona una fecha disponible.');
        return;
      }

      if (tipo === 'corrective' && descripcion.trim() === '') {
        Alert.alert('Error', 'La descripción es obligatoria para mantenimientos correctivos.');
        return;
      }

      const payload: any = {
        client_device_id: equipoSeleccionado.id,
        type: tipo,
        description: descripcion.trim(),
        photo: nombreImagen,
      };

      if (tipo === 'preventive') {
        payload.date_maintenance = fecha?.toISOString().split('T')[0];
      }

      console.log('Enviando payload:', payload);
      await createMantenimiento(payload, token);

      setEquipoSeleccionado(null);
      setDescripcion('');
      setFecha(null);
      setFoto(null);

      if (tipo === 'corrective') {
        Alert.alert('Llama al soporte', 'Para mantenimientos correctivos llama al 3104856772', [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Llamar',
            onPress: () => {
              Linking.openURL('tel:3104856772');
              navigation.navigate('SolicitarMantenimiento');
            },
          },
        ]);
      } else {
        Alert.alert('✅ Mantenimiento registrado', 'Tu solicitud ha sido creada correctamente.', [
          { text: 'OK', onPress: () => navigation.navigate('SolicitarMantenimiento') },
        ]);
      }
    } catch (error: any) {
      console.error('Error al crear mantenimiento:', error);
      if (error.response?.data?.data) {
        const mensajes = Object.values(error.response.data.data).flat().join('\n');
        Alert.alert('Error de validación', mensajes);
      } else {
        Alert.alert('Error', 'Ocurrió un error al registrar el mantenimiento.');
      }
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
    if (!equipoSeleccionado) return false;
    if (tipo === 'preventive' && !fecha) return false;
    if (tipo === 'corrective' && !descripcion.trim()) return false;
    return true;
  };

  const renderEquipoSelector = () => (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Equipo a mantener</Text>
        <TouchableOpacity
            style={[styles.selector, equipoSeleccionado && styles.selectorFilled]}
            onPress={() => setModalEquipo(true)}
        >
          <View style={styles.selectorContent}>
            <View style={styles.selectorIcon}>
              <Ionicons
                  name="hardware-chip"
                  size={24}
                  color={equipoSeleccionado ? "#007AFF" : "#666"}
              />
            </View>
            <View style={styles.selectorTextContainer}>
              <Text style={[
                styles.selectorText,
                equipoSeleccionado && styles.selectorTextFilled
              ]}>
                {equipoSeleccionado?.name || 'Selecciona un equipo'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-down" size={24} color="#666" />
        </TouchableOpacity>
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
    if (tipo !== 'preventive' || !equipoSeleccionado?.tipo_equipo) return null;

    const checklistItems = CHECKLIST_MANTENIMIENTO[equipoSeleccionado.tipo_equipo.toLowerCase()];
    if (!checklistItems) return null;

    return (
        <View style={styles.checklistContainer}>
          <View style={styles.checklistHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.checklistTitle}>Este mantenimiento incluye:</Text>
          </View>
          {checklistItems.map((item, index) => (
              <View key={index} style={styles.checklistItem}>
                <View style={styles.checklistBullet} />
                <Text style={styles.checklistItemText}>{item}</Text>
              </View>
          ))}
        </View>
    );
  };

  const renderFechaSelector = () => {
    if (tipo !== 'preventive') return null;

    return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha programada</Text>
          <TouchableOpacity
              style={[styles.selector, fecha && styles.selectorFilled]}
              onPress={() => setModalFechas(true)}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorIcon}>
                <Ionicons
                    name="calendar"
                    size={24}
                    color={fecha ? "#007AFF" : "#666"}
                />
              </View>
              <View style={styles.selectorTextContainer}>
                <Text style={[
                  styles.selectorText,
                  fecha && styles.selectorTextFilled
                ]}>
                  {fecha ? fecha.toLocaleDateString('es-CO', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Selecciona una fecha'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={24} color="#666" />
          </TouchableOpacity>
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
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
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
          {renderFechaSelector()}
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

        {/* Modal Equipos */}
        <Modal visible={modalEquipo} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalEquipo(false)}>
                <Text style={styles.modalCancelButton}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Seleccionar Equipo</Text>
              <View style={styles.modalSpacer} />
            </View>
            <FlatList
                data={equipos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => {
                          setEquipoSeleccionado(item);
                          setModalEquipo(false);
                        }}
                    >
                      <Ionicons name="hardware-chip" size={24} color="#007AFF" />
                      <Text style={styles.modalItemText}>{item.name}</Text>
                      {equipoSeleccionado?.id === item.id && (
                          <Ionicons name="checkmark" size={24} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
            />
          </SafeAreaView>
        </Modal>

        {/* Modal Fechas */}
        <Modal visible={modalFechas} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalFechas(false)}>
                <Text style={styles.modalCancelButton}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Fechas Disponibles</Text>
              <View style={styles.modalSpacer} />
            </View>
            <FlatList
                data={fechasDisponibles}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => {
                          setFecha(createLocalDate(item));
                          setModalFechas(false);
                        }}
                    >
                      <Ionicons name="calendar" size={24} color="#007AFF" />
                      <Text style={styles.modalItemText}>
                        {createLocalDate(item).toLocaleDateString('es-CO', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                      {fecha && fecha.toDateString() === createLocalDate(item).toDateString() && (
                          <Ionicons name="checkmark" size={24} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
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
    paddingTop: 15,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
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
});