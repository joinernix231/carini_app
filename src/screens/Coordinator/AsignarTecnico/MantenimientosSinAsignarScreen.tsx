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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BackButton from '../../../components/BackButton';
import { MantenimientoCard } from '../../../components/Mantenimiento/MantenimientoCard';
import { useMantenimientosSinAsignar } from '../../../hooks/mantenimiento/useMantenimientosSinAsignar';
import { CoordinadorMantenimiento } from '../../../services/CoordinadorMantenimientoService';
import { Device, MantenimientoListItem } from '../../../types/mantenimiento/mantenimiento';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
  MantenimientosSinAsignar: undefined;
  DetalleMantenimiento: { mantenimientoId: number };
  CoordinadorDashboard: undefined;
};

export default function MantenimientosSinAsignarScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { mantenimientos, loading, refreshing, error, onRefresh, fetchMantenimientos } = useMantenimientosSinAsignar();

  const handleOpenDetalle = useCallback((mantenimiento: CoordinadorMantenimiento) => {
    navigation.navigate('DetalleMantenimiento', { mantenimientoId: mantenimiento.id });
  }, [navigation]);

  const renderMantenimiento = ({ item }: { item: CoordinadorMantenimiento }) => {
    // Adaptar datos del servicio al componente de tarjeta
    const devicesRaw = Array.isArray(item.device) ? item.device : (item.device ? [item.device] : []);
    const devices: Device[] = devicesRaw.map((d) => ({
      id: d.id,
      model: d.model,
      brand: d.brand,
      type: d.type,
      serial: '',
      address: '',
      pivot_description: d.description || null,
    }));

    const listItem: MantenimientoListItem = {
      id: item.id,
      type: item.type,
      status: item.status,
      devices,
      description: item.description || '',
      date_maintenance: item.date_maintenance,
      created_at: item.created_at,
      deviceCount: devices.length,
      primaryDevice: devices[0] || { id: 0, model: 'N/A', brand: 'N/A', type: 'N/A', serial: '', address: '' },
    };

    return (
      <MantenimientoCard
        item={listItem}
        onPress={() => handleOpenDetalle(item)}
        onDelete={() => {}}
      />
    );
  };

  const preventivosCount = mantenimientos.filter(m => m.type === 'preventive').length;
  const correctivosCount = mantenimientos.filter(m => m.type === 'corrective').length;
  const totalCount = mantenimientos.length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        <View style={styles.header}>
          <BackButton color="#fff" />
          <Text style={styles.headerTitle}>Mantenimientos Sin Asignar</Text>
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
          <Text style={styles.headerTitle}>Mantenimientos Sin Asignar</Text>
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
        <Text style={styles.headerTitle}>Verificar Mantenimientos</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="build" size={24} color="#4CAF50" />
            <Text style={styles.statNumber}>{preventivosCount}</Text>
            <Text style={styles.statLabel}>Preventivos</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="warning" size={24} color="#FF9800" />
            <Text style={styles.statNumber}>{correctivosCount}</Text>
            <Text style={styles.statLabel}>Correctivos</Text>
          </View>
        </View>

        {totalCount === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="check-circle" size={80} color="#4CAF50" />
            <Text style={styles.congratsTitle}>¡Felicitaciones!</Text>
            <Text style={styles.congratsSubtitle}>Excelente trabajo coordinador</Text>
            <Text style={styles.congratsText}>
              No hay mantenimientos pendientes por verificar. Todos los equipos están siendo atendidos correctamente.
            </Text>
            <View style={styles.successBadge}>
              <MaterialIcons name="stars" size={20} color="#4CAF50" />
              <Text style={styles.successBadgeText}>Todo al día</Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={mantenimientos}
            renderItem={renderMantenimiento}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1976D2']}
                tintColor="#1976D2"
              />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1976D2',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 40, // Compensar el BackButton
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1976D2',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
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
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F44336',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
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
    paddingHorizontal: 32,
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 20,
  },
  congratsSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976D2',
    marginTop: 8,
  },
  congratsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 24,
  },
  successBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
});