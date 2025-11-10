import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BackButton from '../../../components/BackButton';
import { MantenimientoCard } from '../../../components/Mantenimiento/MantenimientoCard';
import { useMantenimientosAsignados } from '../../../hooks/mantenimiento/useMantenimientosAsignados';
import { CoordinadorMantenimiento } from '../../../services/CoordinadorMantenimientoService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MantenimientoListItem, Device } from '../../../types/mantenimiento/mantenimiento';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  MantenimientosAsignados: undefined;
  DetalleMantenimiento: { mantenimientoId: number };
  CoordinadorDashboard: undefined;
};

export default function MantenimientosAsignadosScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { mantenimientos, loading, refreshing, error, onRefresh, fetchMantenimientos } = useMantenimientosAsignados();

  const handleVerDetalle = useCallback((mantenimiento: CoordinadorMantenimiento) => {
    const devicesRaw = Array.isArray(mantenimiento.device) ? mantenimiento.device : (mantenimiento.device ? [mantenimiento.device] : []);
    const firstDevice = devicesRaw[0];
    const deviceName = firstDevice ? `${firstDevice.brand} ${firstDevice.model}` : 'equipo';
    const clientName = mantenimiento.client?.name || 'cliente';
    
    Alert.alert(
      'Ver Detalle',
      `¿Deseas ver los detalles del mantenimiento de ${clientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ver Detalle',
          onPress: () => {
            navigation.navigate('DetalleMantenimiento', { mantenimientoId: mantenimiento.id });
          },
        },
      ]
    );
  }, [navigation]);

  const renderMantenimiento = ({ item }: { item: CoordinadorMantenimiento }) => {
    const devicesRaw = Array.isArray(item.device) ? item.device : (item.device ? [item.device] : []);
    const devices: Device[] = devicesRaw.map((d: any) => ({
      id: d.id,
      client_device_id: d.client_device_id || d.id,
      model: d.model,
      brand: d.brand,
      type: d.type,
      serial: d.serial || '',
      address: d.address || '',
      pivot_description: d.pivot_description || d.description || null,
    }));

    const listItem: MantenimientoListItem = {
      id: item.id,
      type: item.type,
      status: item.status as any,
      devices,
      description: item.description || '',
      date_maintenance: item.date_maintenance,
      created_at: item.created_at,
      deviceCount: devices.length,
      primaryDevice: devices[0] || { id: 0, model: 'N/A', brand: 'N/A', type: 'N/A', serial: '', address: '' },
      clientName: item.client?.name || null,
    };

    return (
      <MantenimientoCard
        item={listItem}
        onPress={() => handleVerDetalle(item)}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        <View style={styles.header}>
          <BackButton color="#fff" />
          <Text style={styles.headerTitle}>Mantenimientos Asignados</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Cargando mantenimientos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        <View style={styles.header}>
          <BackButton color="#fff" />
          <Text style={styles.headerTitle}>Mantenimientos Asignados</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Error al cargar</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMantenimientos}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      <View style={styles.header}>
        <BackButton color="#fff" />
        <Text style={styles.headerTitle}>Mantenimientos Asignados</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{mantenimientos.length}</Text>
            <Text style={styles.statLabel}>Asignados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {mantenimientos.filter(m => m.type === 'preventive').length}
            </Text>
            <Text style={styles.statLabel}>Preventivos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {mantenimientos.filter(m => m.type === 'corrective').length}
            </Text>
            <Text style={styles.statLabel}>Correctivos</Text>
          </View>
        </View>

        <FlatList
          data={mantenimientos}
          renderItem={renderMantenimiento}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1976D2']}
              tintColor="#1976D2"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="assignment" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No hay mantenimientos asignados</Text>
              <Text style={styles.emptyText}>
                Los mantenimientos aparecerán aquí una vez que sean asignados a técnicos.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 16,
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Compensar el BackButton
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1976D2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F44336',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
