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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getEquiposVinculados } from '../../../services/EquipoClienteService';
import { getTiposMantenimiento } from '../../../services/MantenimientoTypeService';
import { createMantenimiento } from '../../../services/MantenimientoService';
import { useAuth } from '../../../context/AuthContext';

type RootStackParamList = {
  SolicitarMantenimiento: undefined;
};

export default function CrearMantenimiento() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuth();


  const [equipos, setEquipos] = useState<
    { id: number; nombre: string; maintenance_type_id: number }[]
  >([]);

  const [tiposIntervencionReal, setTiposIntervencionReal] = useState<
  { id: number; nombre: string }[]
>([]);

  const [loadingEquipos, setLoadingEquipos] = useState(true);

  const [tipo, setTipo] = useState<'preventive' | 'corrective'>('preventive');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const [equipoSeleccionado, setEquipoSeleccionado] = useState<{
    id: number;
    name: string;
    maintenance_type_id: number;
  } | null>(null);

  const [tipoIntervencion, setTipoIntervencion] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [modalEquipo, setModalEquipo] = useState(false);
  const [modalIntervencion, setModalIntervencion] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);



  useEffect(() => {
    const cargarDatos = async () => {
      if (!token) return;
  
      try {
        setLoadingEquipos(true);
  
        const [equiposData, intervencionData] = await Promise.all([
          getEquiposVinculados(token),
          getTiposMantenimiento(token),
        ]);
  
        const listaEquipos = equiposData.map((item: any) => {
          const { device, address, id } = item;
          return {
            id,
            name: `${device.model} (${device.serial}) - ${address}`,
            maintenance_type_id: device.maintenance_type_id || 1,
          };
        });
  
        setEquipos(listaEquipos);
        setTiposIntervencionReal(intervencionData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos');
      } finally {
        setLoadingEquipos(false);
      }
    };
  
    cargarDatos();
  }, [token]);
  

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (selectedDate: Date) => {
    setFecha(selectedDate);
    hideDatePicker();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se requiere permiso para acceder a la galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setFoto(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!descripcion.trim() || !equipoSeleccionado || !tipoIntervencion) {
      Alert.alert('Campos incompletos', 'Completa todos los campos antes de continuar.');
      return;
    }

    if (tipo === 'corrective') {
      Alert.alert('Llama al soporte', 'Para mantenimientos correctivos llama al 3104856772');
      return;
    }

    try {
      const payload = {
        client_device_id: equipoSeleccionado.id,
        type: tipo,
        date_maintenance: fecha.toISOString().split('T')[0],
        maintenance_type_id: tipoIntervencion.id,
        description: descripcion.trim(),
        photo: foto || undefined,
      };
      alert(payload)

      await createMantenimiento(payload,token);
    

      Alert.alert('✅ Mantenimiento registrado', 'Tu solicitud ha sido creada correctamente.', [
        { text: 'OK', onPress: () => navigation.navigate('SolicitarMantenimiento') },
      ]);
    } catch (error) {
      console.error('Error al crear mantenimiento:', error);
      Alert.alert('Error', 'Ocurrió un error al registrar el mantenimiento.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nuevo Mantenimiento</Text>

      <Text style={styles.label}>Equipo</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setModalEquipo(true)}>
        <Text style={styles.selectorText}>
          {equipoSeleccionado?.name || 'Selecciona un equipo'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color="#0077b6" />
      </TouchableOpacity>
      <Modal visible={modalEquipo} animationType="slide">
        <FlatList
          data={equipos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setEquipoSeleccionado(item);
                setModalEquipo(false);
              }}
            >
              <Text>{item.nombre}</Text>
            </TouchableOpacity>
          )}
        />
      </Modal>

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.toggleButton, tipo === 'preventive' && styles.active]}
          onPress={() => setTipo('preventive')}
        >
          <Text style={styles.toggleText}>Preventivo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, tipo === 'corrective' && styles.active]}
          onPress={() => setTipo('corrective')}
        >
          <Text style={styles.toggleText}>Correctivo</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Fecha programada</Text>
      <TouchableOpacity style={styles.datePicker} onPress={showDatePicker}>
        <MaterialIcons name="calendar-today" size={20} color="#0077b6" />
        <Text style={{ marginLeft: 10 }}>{fecha.toLocaleDateString()}</Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />

      <Text style={styles.label}>Tipo de intervención</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setModalIntervencion(true)}>
        <Text style={styles.selectorText}>
          {tipoIntervencion?.name || 'Selecciona tipo de intervención'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color="#0077b6" />
      </TouchableOpacity>
      <Modal visible={modalIntervencion} animationType="slide">
      <FlatList
  data={tiposIntervencionReal}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => {
        setTipoIntervencion(item);
        setModalIntervencion(false);
      }}
    >
      <Text>{item.nombre}</Text>
    </TouchableOpacity>
  )}
/>

      </Modal>

      <Text style={styles.label}>Foto del equipo (opcional)</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        <MaterialIcons name="add-a-photo" size={20} color="#0077b6" />
        <Text style={styles.selectorText}>Seleccionar imagen</Text>
      </TouchableOpacity>
      {foto && <Image source={{ uri: foto }} style={styles.preview} />}

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        placeholder="Describe el problema o solicitud"
        multiline
        numberOfLines={4}
        style={styles.textArea}
        value={descripcion}
        onChangeText={setDescripcion}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Registrar mantenimiento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0077b6', textAlign: 'center', marginBottom: 20, marginTop: 30 },
  label: { fontSize: 14, color: '#555', marginTop: 10, marginBottom: 4 },
  buttonGroup: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  toggleButton: {
    flex: 1,
    borderColor: '#0077b6',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  active: { backgroundColor: '#0077b6' },
  toggleText: { color: '#023047', fontWeight: 'bold' },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectorText: { fontSize: 14, color: '#555' },
  optionItem: {
    padding: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  textArea: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#00b4d8',
    padding: 14,
    borderRadius: 8,
  },
  submitText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
