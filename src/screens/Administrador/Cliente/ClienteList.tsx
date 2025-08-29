import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import BackButton from '../../../components/BackButton';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../context/AuthContext';
import { getClientes, deleteCliente } from '../../../services/ClienteService';

// Stack params used locally for navigation typing
type RootStackParamList = {
  ClienteList: undefined;
  DetalleCliente: { id: number };
};

// Updated Cliente type to reflect new API fields
export type Cliente = {
  id: number;
  identifier: string | null;
  name: string;
  email?: string | null;
  legal_representative?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  created_at?: string | null;
};

export default function ClienteList() {
  const { token } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const fetchClientes = async (showLoading = true) => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }
      if (showLoading) setLoading(true);

      const data = await getClientes(token);

      if (Array.isArray(data)) {
        setClientes(data);
      } else {
        console.warn('Datos no válidos recibidos:', data);
        setClientes([]);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      Alert.alert('Error', 'No se pudieron cargar los clientes');
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const eliminarCliente = (id: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!token) return;
              await deleteCliente(id, token);

              setClientes(prev => prev.filter(c => c.id !== id));
              Alert.alert('Éxito', 'Cliente eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar cliente:', error);
              Alert.alert('Error', 'No se pudo eliminar el cliente');
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchClientes(false);
    } catch (error) {
      console.error('Error al refrescar clientes:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchClientes();
    }, [token])
  );

  const renderItem = ({ item }: { item: Cliente }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DetalleCliente', { id: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.userIcon}>
          <Ionicons name="person-circle-outline" size={40} color="#007AFF" />
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.clientName}>{item.name}</Text>
          <Text style={styles.clientEmail}>{item.email || item.identifier || item.phone || '-'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{item.city || '-'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarCliente(item.id)}>
          <MaterialIcons name="delete-outline" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <BackButton style={{ marginBottom: 10 }} color="#000" size={24} />
      <View style={styles.titleSection}>
        <Text style={styles.title}>Clientes</Text>
        <Text style={styles.subtitle}>Gestiona tus clientes registrados</Text>
      </View>
      <View style={styles.statsCard}>
        <Text style={styles.statNumber}>{clientes.length}</Text>
        <Text style={styles.statLabel}>Total clientes</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={80} color="#C0C0C0" />
      <Text style={styles.emptyTitle}>No hay clientes</Text>
      <Text style={styles.emptySubtitle}>Crea tu primer cliente para comenzar a gestionar</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('CrearCliente')}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.emptyButtonText}>Crear cliente</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Cargando clientes...</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        {renderHeader()}
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      {clientes.length === 0 ? (
        <View style={styles.container}>
          {renderHeader()}
          {renderEmptyState()}
        </View>
      ) : (
        <>
          <FlatList
            ListHeaderComponent={renderHeader}
            data={clientes}
            renderItem={renderItem}
            keyExtractor={(item) => `cliente_${item.id}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#007AFF"
                colors={["#007AFF"]}
              />
            }
          />
          <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CrearCliente')} activeOpacity={0.9}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  titleSection: { marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '800', color: '#000', marginTop: 20 },
  subtitle: { fontSize: 17, color: '#666', fontWeight: '500' },
  statsCard: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  statNumber: { fontSize: 26, fontWeight: '800', color: '#007AFF' },
  statLabel: { fontSize: 15, color: '#666', fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  userIcon: { marginRight: 16 },
  infoSection: { flex: 1 },
  clientName: { fontSize: 18, fontWeight: '700', color: '#000' },
  clientEmail: { fontSize: 15, color: '#666', marginBottom: 6 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: { fontSize: 13, color: '#007AFF', fontWeight: '700' },
  deleteButton: { padding: 6, borderRadius: 8, backgroundColor: '#FFF5F5' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: '#000', marginTop: 16 },
  emptySubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
});
