import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  CrearMantenimiento: undefined;
  DetalleMantenimiento: undefined;
};

type Mantenimiento = {
  id: number;
  tipo: 'preventivo' | 'correctivo';
  equipo: string;
  estado: 'pendiente' | 'realizado' | 'cancelado';
  fecha: string;
};

const mockMantenimientos: Mantenimiento[] = [
  {
    id: 1,
    tipo: 'preventivo',
    equipo: 'Lavadora 30kg',
    estado: 'pendiente',
    fecha: '2024-05-10',
  },
  {
    id: 2,
    tipo: 'correctivo',
    equipo: 'Secadora 20kg',
    estado: 'realizado',
    fecha: '2024-04-18',
  },
  {
    id: 3,
    tipo: 'preventivo',
    equipo: 'Centrifugadora',
    estado: 'cancelado',
    fecha: '2024-04-15',
  },
];

export default function MantenimientosList() {
  const [mantenimientos, setMantenimientos] = useState(mockMantenimientos);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return '#f39c12';
      case 'realizado':
        return '#2ecc71';
      case 'cancelado':
        return '#e74c3c';
      default:
        return '#555';
    }
  };

  const renderItem = ({ item }: { item: Mantenimiento }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DetalleMantenimiento')}
    >
      <View style={styles.row}>
        <MaterialIcons
          name={item.tipo === 'preventivo' ? 'build-circle' : 'report-problem'}
          size={28}
          color={item.tipo === 'preventivo' ? '#0077b6' : '#e67e22'}
        />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>{item.equipo}</Text>
          <Text style={styles.cardSubtitle}>
            {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)} · {item.fecha}
          </Text>
        </View>
      </View>
      <Text style={[styles.estado, { color: getEstadoColor(item.estado) }]}>
        {item.estado.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mis Mantenimientos</Text>

      <FlatList
        data={mantenimientos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('DetalleMantenimiento')}
      >
        <MaterialIcons name="add-circle" size={24} color="#fff" />
        <Text style={styles.buttonText}>Agendar mantenimiento</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, paddingTop:30, textAlign: 'center' },
  card: {
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  estado: {
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  button: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#0077b6',
    padding: 16,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
