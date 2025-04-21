import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  AgendarMantenimiento: undefined;
  SolicitarMantenimiento: undefined;
};

const equiposMock = ['Lavadora 30kg', 'Secadora 20kg Gas', 'Centrifugadora rápida'];
const tiposIntervencionMock = ['Revisión general', 'Cambio de repuesto', 'Ajuste de temperatura', 'Diagnóstico eléctrico'];

export default function CrearMantenimiento() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [tipo, setTipo] = useState<'preventivo' | 'correctivo'>('preventivo');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(null);
  const [tipoIntervencion, setTipoIntervencion] = useState<string | null>(null);
  const [modalEquipo, setModalEquipo] = useState(false);
  const [modalIntervencion, setModalIntervencion] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);

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

  const handleSubmit = () => {
    if (!descripcion.trim() || !equipoSeleccionado || !tipoIntervencion) {
      Alert.alert('Campos incompletos', 'Completa todos los campos antes de continuar.');
      return;
    }

    if (tipo === 'correctivo') {
        Linking.openURL('tel:+573114705572').catch(() => {
          Alert.alert('Error', 'No se pudo abrir la app de llamadas.');
        });
        return;
      }
      

    Alert.alert('✅ Mantenimiento registrado', 'Tu solicitud ha sido creada correctamente.', [
      { text: 'OK', onPress: () => navigation.navigate('SolicitarMantenimiento') },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nuevo Mantenimiento</Text>

      {/* Selector de equipo */}
      <Text style={styles.label}>Equipo</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setModalEquipo(true)}>
        <Text style={styles.selectorText}>
          {equipoSeleccionado || 'Selecciona un equipo'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color="#0077b6" />
      </TouchableOpacity>

      <Modal visible={modalEquipo} animationType="slide">
        <FlatList
          data={equiposMock}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setEquipoSeleccionado(item);
                setModalEquipo(false);
              }}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </Modal>

      {/* Tipo de mantenimiento */}
      <Text style={styles.label}>Tipo</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.toggleButton, tipo === 'preventivo' && styles.active]}
          onPress={() => setTipo('preventivo')}
        >
          <Text style={styles.toggleText}>Preventivo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, tipo === 'correctivo' && styles.active]}
          onPress={() => setTipo('correctivo')}
        >
          <Text style={styles.toggleText}>Correctivo</Text>
        </TouchableOpacity>
      </View>

      {/* Fecha */}
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

      {/* Selector de tipo de intervención */}
      <Text style={styles.label}>Tipo de intervención</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setModalIntervencion(true)}>
        <Text style={styles.selectorText}>
          {tipoIntervencion || 'Selecciona tipo de intervención'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color="#0077b6" />
      </TouchableOpacity>

      <Modal visible={modalIntervencion} animationType="slide">
        <FlatList
          data={tiposIntervencionMock}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setTipoIntervencion(item);
                setModalIntervencion(false);
              }}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </Modal>

      {/* Foto del equipo */}
      <Text style={styles.label}>Foto del equipo (opcional)</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        <MaterialIcons name="add-a-photo" size={20} color="#0077b6" />
        <Text style={styles.selectorText}>Seleccionar imagen</Text>
      </TouchableOpacity>
      {foto && <Image source={{ uri: foto }} style={styles.preview} />}

      {/* Descripción */}
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        placeholder="Describe el problema o solicitud"
        multiline
        numberOfLines={4}
        style={styles.textArea}
        value={descripcion}
        onChangeText={setDescripcion}
      />

      {/* Botón */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Registrar mantenimiento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0077b6', textAlign: 'center', marginBottom: 20 },
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
  toggleText: { color: '#fff', fontWeight: 'bold' },
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
