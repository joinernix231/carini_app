import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../context/AuthContext';
import { getMantenimientos } from '../../../services/MantenimientoService';

type RootStackParamList = {
  CrearMantenimiento: undefined;
  DetalleMantenimiento: { id: number };
};

type Mantenimiento = {
  id: number;
  tipo: 'preventivo' | 'correctivo';
  equipo: string;
  estado: string; // Ahora es string, no Text
  fecha: string;
};

export default function MantenimientosList() {
  const { token } = useAuth();
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const traducirEstado = (estadoIngles: string): string => {
    const traducciones: Record<string, string> = {
      pending: 'Pendiente',
      assigned: 'Asignado',
      in_progress: 'En progreso',
      completed: 'Completado',
    };
    return traducciones[estadoIngles] || estadoIngles;
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return '#f39c12';
      case 'Asignado':
      case 'En progreso':
        return '#3498db';
      case 'Completado':
        return '#2ecc71';
      case 'Cancelado':
        return '#e74c3c';
      default:
        return '#555';
    }
  };

  const fetchMantenimientos = async () => {
    try {
      if (!token) return;

      const data = await getMantenimientos(token);

      const formattedData: Mantenimiento[] = data.map((item: any) => ({
        id: item.id,
        tipo: item.type,
        equipo: item.device?.model || 'Equipo sin nombre',
        estado: item.status, // aquí dejamos el valor en inglés
        fecha: item.date_maintenance,
      }));

      setMantenimientos(formattedData);
    } catch (error) {
      console.error('Error al cargar mantenimientos:', error);
    }
  };

  useEffect(() => {
    fetchMantenimientos();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMantenimientos().then(() => setRefreshing(false));
  }, []);

  const renderItem = ({ item }: { item: Mantenimiento }) => {
    const estadoTraducido = traducirEstado(item.estado);
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('DetalleMantenimiento', { id: item.id })}
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
          <Text style={[styles.estado, { color: getEstadoColor(estadoTraducido) }]}>
            {estadoTraducido.toUpperCase()}
          </Text>
        </TouchableOpacity>
    );
  };

  return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Mis Mantenimientos</Text>

        {mantenimientos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>Aún no tienes mantenimientos registrados</Text>
            </View>
        ) : (
            <FlatList
                data={mantenimientos}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
        )}

        <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('CrearMantenimiento')}
        >
          <MaterialIcons name="add-circle" size={24} color="#fff" />
          <Text style={styles.buttonText}>Agendar mantenimiento</Text>
        </TouchableOpacity>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingTop: 30,
    textAlign: 'center',
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});
