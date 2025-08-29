import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import BackButton from '../../../components/BackButton';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { asignarEquipo as asignarEquipoCliente } from '../../../services/EquipoClienteService';
import { getEquiposVinculados as getEquiposEmpresa } from '../../../services/EquiposService';

const { height: screenHeight } = Dimensions.get('window');

// Types for devices returned by /api/devices
interface Device {
  id: number;
  model: string;
  brand: string;
  serial: string;
  type: string;
  manufactured_at?: string;
}

// Local navigation typing
type RootStackParamList = {
  MisEquipos: undefined;
  AgregarEquipo: undefined;
};

export default function AgregarEquipo() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuth();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [serial, setSerial] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);

  useEffect(() => {
    if (token) loadDevices();
  }, [token]);

  // Filter devices when typing
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setFilteredDevices(devices);
      return;
    }
    setFilteredDevices(
        devices.filter(d =>
            (d.model || '').toLowerCase().includes(q) ||
            (d.brand || '').toLowerCase().includes(q) ||
            (d.serial || '').toLowerCase().includes(q) ||
            (d.type || '').toLowerCase().includes(q)
        )
    );
  }, [searchQuery, devices]);

  const loadDevices = async () => {
    try {
      setLoadingDevices(true);
      const data = await getEquiposEmpresa(token!);
      // data may be paginated array already; ensure it's an array
      if (Array.isArray(data)) {
        // some APIs return richer objects; normalize if needed
        const normalized: Device[] = data.map((d: any) => ({
          id: d.id ?? d.device?.id ?? 0,
          model: d.model ?? d.device?.model ?? 'N/A',
          brand: d.brand ?? d.device?.brand ?? 'N/A',
          serial: d.serial ?? d.device?.serial ?? 'N/A',
          type: d.type ?? d.device?.type ?? 'device',
          manufactured_at: d.manufactured_at ?? d.device?.manufactured_at,
        }));
        setDevices(normalized);
        setFilteredDevices(normalized);
      } else {
        setDevices([]);
        setFilteredDevices([]);
      }
    } catch (err) {
      console.error('Error cargando dispositivos de la empresa', err);
      Alert.alert('Error', 'No se pudo cargar la lista de dispositivos.');
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  const validate = () => {
    if (!selectedDevice) {
      Alert.alert('Validación', 'Debes seleccionar un dispositivo');
      return false;
    }
    if (!serial.trim()) {
      Alert.alert('Validación', 'Debes ingresar el serial');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Validación', 'Debes ingresar la dirección');
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    if (!token) {
      Alert.alert('Error', 'No hay sesión activa');
      return;
    }
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        serial: serial.trim(),
        address: address.trim(),
        device_id: Number(selectedDevice!.id),
      } as const;

      await asignarEquipoCliente(payload as any, token);

      Alert.alert('Éxito', 'Equipo vinculado correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error vinculando equipo:', error?.response?.data ?? error);
      const msg = error?.response?.data?.message || 'No se pudo vincular el equipo';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderDeviceItem = ({ item }: { item: Device }) => {
    const isSelected = selectedDevice?.id === item.id;
    return (
        <TouchableOpacity
            style={[styles.deviceItem, isSelected && styles.deviceItemSelected]}
            onPress={() => setSelectedDevice(item)}
            activeOpacity={0.8}
        >
          <View style={[styles.deviceIcon, { backgroundColor: '#E6F3FF' }]}>
            <MaterialIcons name="devices" size={20} color="#007AFF" />
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceTitle}>{item.model} • {item.brand}</Text>
            <Text style={styles.deviceSubtitle}>ID: {item.id} • Tipo: {item.type}</Text>
          </View>
          {isSelected && (
              <MaterialIcons name="check-circle" size={22} color="#2ecc71" />
          )}
        </TouchableOpacity>
    );
  };

  const renderDevicesList = () => {
    if (loadingDevices) {
      return (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#007AFF" />
            <Text style={styles.loadingText}>Cargando dispositivos...</Text>
          </View>
      );
    }

    if (devices.length === 0) {
      return (
          <View style={styles.emptyBox}>
            <MaterialIcons name="info" size={20} color="#999" />
            <Text style={styles.emptyText}>No hay dispositivos disponibles</Text>
          </View>
      );
    }

    return (
        <FlatList
            data={filteredDevices}
            keyExtractor={(item) => `device_${item.id}`}
            renderItem={renderDeviceItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 70, // altura aproximada de cada item
              offset: 70 * index,
              index,
            })}
        />
    );
  };

  return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

        {/* Header fijo */}
        <View style={styles.header}>
          <BackButton style={{ marginTop: 8 }} color="#000" size={24} />
          <Text style={styles.title}>Agregar equipo</Text>
          <Text style={styles.subtitle}>Selecciona un dispositivo y completa los datos</Text>
        </View>

        {/* Contenido principal */}
        <View style={styles.content}>
          {/* Sección de dispositivos con altura fija */}
          <View style={styles.devicesSection}>
            <Text style={styles.sectionTitle}>Dispositivos de la empresa</Text>

            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color="#999" />
              <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar dispositivos..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialIcons name="clear" size={20} color="#999" />
                  </TouchableOpacity>
              )}
            </View>

            {/* Lista de dispositivos */}
            <View style={styles.devicesListContainer}>
              {renderDevicesList()}
            </View>
          </View>

          {/* Formulario fijo en la parte inferior */}
          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>Serial</Text>
            <TextInput
                style={styles.input}
                placeholder="Ej: SN-s8676-vgb"
                placeholderTextColor="#999"
                value={serial}
                onChangeText={setSerial}
            />

            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput
                style={styles.input}
                placeholder="Ej: Calle 83a #69-50"
                placeholderTextColor="#999"
                value={address}
                onChangeText={setAddress}
            />

            <TouchableOpacity
                style={[styles.submitButton, submitting && { opacity: 0.8 }]}
                onPress={onSubmit}
                disabled={submitting}
                activeOpacity={0.9}
            >
              {submitting ? (
                  <ActivityIndicator color="#fff" />
              ) : (
                  <>
                    <Ionicons name="save" size={20} color="#fff" />
                    <Text style={styles.submitText}>Vincular equipo</Text>
                  </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    marginTop: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#666'
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  devicesSection: {
    flex: 1,
    minHeight: screenHeight * 0.4, // 40% de la pantalla mínimo
    maxHeight: screenHeight * 0.55, // 55% de la pantalla máximo
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginHorizontal: 20,
    marginBottom: 8
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  devicesListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 10,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center'
  },
  loadingText: {
    color: '#666'
  },
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center'
  },
  emptyText: {
    color: '#666'
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deviceItemSelected: {
    borderWidth: 2,
    borderColor: '#2ecc71',
    shadowColor: '#2ecc71',
    shadowOpacity: 0.1,
  },
  deviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  deviceInfo: {
    flex: 1
  },
  deviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000'
  },
  deviceSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  formSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '700'
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    fontSize: 16,
    color: '#000'
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800'
  },
});