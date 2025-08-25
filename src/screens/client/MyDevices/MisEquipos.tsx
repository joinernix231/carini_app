import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../context/AuthContext';
import { getEquiposVinculados } from '../../../services/EquipoClienteService';

const { width } = Dimensions.get('window');

// Tipos
type Equipo = {
  id: number;
  device: {
    id: number;
    model: string;
    brand: string;
    serial: string;
    type: string;
    manufactured_at: string;
  };
  address: string;
};

type RootStackParamList = {
  MisEquipos: undefined;
  SolicitarMantenimiento: undefined;
  Historial: undefined;
  Productos: undefined;
  DetalleEquipo: { deviceId: number };
};

// Función para obtener el icono según el tipo de equipo
const getEquipmentIcon = (type: string) => {
  const typeMap: { [key: string]: keyof typeof MaterialIcons.glyphMap } = {
    'aire_acondicionado': 'ac-unit',
    'refrigerador': 'kitchen',
    'lavadora': 'local-laundry-service',
    'secadora': 'dry',
    'horno': 'microwave',
    'default': 'settings'
  };
  return typeMap[type.toLowerCase()] || typeMap['default'];
};

// Función para obtener el color según el tipo
const getEquipmentColor = (type: string) => {
  const colorMap: { [key: string]: string } = {
    'aire_acondicionado': '#2196F3',
    'refrigerador': '#4CAF50',
    'lavadora': '#9C27B0',
    'secadora': '#FF9800',
    'horno': '#F44336',
    'default': '#607D8B'
  };
  return colorMap[type.toLowerCase()] || colorMap['default'];
};

// Componente mejorado para cada equipo
const EquipoCard = ({ item, onPress }: { item: Equipo; onPress: () => void }) => {
  const equipmentColor = getEquipmentColor(item.device.type);
  const equipmentIcon = getEquipmentIcon(item.device.type);

  return (
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: equipmentColor }]}>
            <MaterialIcons name={equipmentIcon} size={28} color="#fff" />
          </View>
          <View style={styles.equipmentInfo}>
            <Text style={styles.cardTitle}>{item.device.model}</Text>
            <Text style={styles.brandText}>{item.device.brand}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Activo</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MaterialIcons name="confirmation-number" size={16} color="#666" />
            <Text style={styles.infoText}>Serial: {item.serial}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={16} color="#666" />
            <Text style={styles.infoText}>{item.address}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.verDetalleContainer}>
            <Text style={styles.verDetalleText}>Ver detalle</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#0077b6" />
          </View>
        </View>
      </TouchableOpacity>
  );
};

// Componente de estado vacío
const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="devices" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No hay equipos registrados</Text>
      <Text style={styles.emptySubtitle}>
        Aún no tienes equipos vinculados
      </Text>
    </View>
);

export default function MisEquipos() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [filteredEquipos, setFilteredEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { token } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (token) fetchEquipos();
  }, [token]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEquipos(equipos);
    } else {
      const filtered = equipos.filter(equipo =>
          equipo.device.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
          equipo.device.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          equipo.device.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
          equipo.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEquipos(filtered);
    }
  }, [searchQuery, equipos]);

  const fetchEquipos = async () => {
    try {
      const data = await getEquiposVinculados(token!);
      setEquipos(data);
      setFilteredEquipos(data);
    } catch (error: any) {
      console.error('Error fetching equipos', error);
      Alert.alert('Error', 'No se pudieron cargar los equipos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEquipos();
  }, []);

  if (loading) {
    return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0077b6" />
            <Text style={styles.loadingText}>Cargando equipos...</Text>
          </View>
        </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mis Equipos</Text>
          <Text style={styles.subtitle}>
            {equipos.length} {equipos.length === 1 ? 'equipo registrado' : 'equipos registrados'}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#999" />
          <TextInput
              style={styles.searchInput}
              placeholder="Buscar equipos..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="clear" size={20} color="#999" />
              </TouchableOpacity>
          )}
        </View>

        {/* Equipment List */}
        {filteredEquipos.length === 0 ? (
            <EmptyState />
        ) : (
            <FlatList
                data={filteredEquipos}
                renderItem={({ item }) => (
                    <EquipoCard
                        item={item}
                        onPress={() => navigation.navigate('DetalleEquipo', { deviceId: item.id })}
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
            />
        )}
      </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  equipmentInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  brandText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#27ae60',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  verDetalleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verDetalleText: {
    color: '#0077b6',
    fontWeight: 'bold',
    marginRight: 5,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
});
