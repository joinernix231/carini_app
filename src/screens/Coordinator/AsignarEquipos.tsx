import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AsignarEquipo() {
  const { token, user } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchEquipos();
    fetchClientes();
  }, []);

  const fetchEquipos = async () => {
    try {
      const res = await API.get('api/devices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipos(res.data.data);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los equipos');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await API.get('api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClientes(res.data.data);
    } catch (e) {
      // Error log removed
    }
  };

  const handleAsignar = async () => {
    if (!equipoSeleccionado || !clienteSeleccionado || !direccion.trim()) {
      Alert.alert('Faltan campos', 'Selecciona cliente, equipo y dirección');
      return;
    }

    try {
      await API.post(
        'api/linkDevices',
        {
          device_id: equipoSeleccionado.id,
          client_id: clienteSeleccionado.id,
          address: direccion,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('✅ Equipo asignado correctamente');
      setEquipoSeleccionado(null);
      setClienteSeleccionado(null);
      setDireccion('');
    } catch (error) {
      Alert.alert('Error', 'No se pudo asignar el equipo');
    }
  };

  const renderEquipo = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, equipoSeleccionado?.id === item.id && styles.selected]}
      onPress={() => setEquipoSeleccionado(item)}
    >
      <Text style={styles.cardTitle}>{item.model}</Text>
      <Text style={styles.cardSubtitle}>Serial: {item.serial}</Text>
      <Text style={styles.cardSubtitle}>Marca: {item.brand}</Text>
    </TouchableOpacity>
  );

  const renderCliente = ({ item }) => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => {
        setClienteSeleccionado(item);
        setModalVisible(false);
      }}
    >
      <Text>{item.legal_representative}</Text>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#0077b6" />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Asignar Equipo</Text>

      <FlatList
        data={equipos}
        renderItem={renderEquipo}
        keyExtractor={(item) => item.id.toString()}
      />

      <Text style={styles.label}>Cliente</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
        <Text style={styles.selectorText}>
          {clienteSeleccionado ? clienteSeleccionado.legal_representative : 'Selecciona un cliente'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color="#0077b6" />
      </TouchableOpacity>

      <Text style={styles.label}>Dirección del equipo</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Calle 45 #12-34"
        value={direccion}
        onChangeText={setDireccion}
      />

      <TouchableOpacity style={styles.button} onPress={handleAsignar}>
        <Text style={styles.buttonText}>Asignar equipo</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <FlatList data={clientes} renderItem={renderCliente} keyExtractor={(i) => i.id.toString()} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#0077b6' },
  card: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 10,
  },
  selected: {
    borderColor: '#0077b6',
    borderWidth: 2,
  },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  cardSubtitle: { color: '#555', fontSize: 14 },
  label: { marginTop: 15, marginBottom: 5, fontWeight: 'bold', color: '#333' },
  selector: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: { fontSize: 14, color: '#555' },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#0077b6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  optionItem: {
    padding: 15,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
});
