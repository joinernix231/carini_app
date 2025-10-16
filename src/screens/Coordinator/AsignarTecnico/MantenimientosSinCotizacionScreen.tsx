import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';
import { MantenimientoCard } from '../../../components/Mantenimiento/MantenimientoCard';
import { useMantenimientosSinCotizacion } from '../../../hooks/mantenimiento/useMantenimientosSinCotizacion';
import { CoordinadorMantenimiento } from '../../../services/CoordinadorMantenimientoService';
import { Device, MantenimientoListItem } from '../../../types/mantenimiento/mantenimiento';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  MantenimientosSinCotizacion: undefined;
  DetalleMantenimiento: { mantenimientoId: number };
  CoordinadorDashboard: undefined;
};

// Helper function to normalize devices
const normalizeDevices = (device: any): Device[] => {
  const devicesRaw = Array.isArray(device) ? device : (device ? [device] : []);
  return devicesRaw.map((d: any) => ({
    id: d.id,
    model: d.model,
    brand: d.brand,
    type: d.type,
    serial: d.serial || '',
    address: d.address || '',
    pivot_description: d.pivot_description || d.description || null,
  }));
};

// Helper function to create list item
const createMantenimientoListItem = (item: CoordinadorMantenimiento): MantenimientoListItem => {
  const devices = normalizeDevices(item.device);
  return {
    id: item.id,
    type: item.type,
    status: item.status as any,
    devices,
    description: item.description || '',
    date_maintenance: item.date_maintenance,
    created_at: item.created_at,
    deviceCount: devices.length,
    primaryDevice: devices[0] || { id: 0, model: 'N/A', brand: 'N/A', type: 'N/A', serial: '', address: '' },
  };
};

export default function MantenimientosSinCotizacionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { mantenimientos, loading, refreshing, error, onRefresh, fetchMantenimientos } = useMantenimientosSinCotizacion();

  // Memoized statistics
  const stats = useMemo(() => ({
    preventivos: mantenimientos.filter(m => m.type === 'preventive').length,
    correctivos: mantenimientos.filter(m => m.type === 'corrective').length,
    total: mantenimientos.length,
  }), [mantenimientos]);

  const handleOpenDetalle = useCallback((mantenimientoId: number) => {
    navigation.navigate('DetalleMantenimiento', { mantenimientoId });
  }, [navigation]);

  const renderMantenimiento = useCallback(({ item }: { item: CoordinadorMantenimiento }) => {
    const listItem = createMantenimientoListItem(item);
    return (
      <MantenimientoCard
        item={listItem}
        onPress={() => handleOpenDetalle(item.id)}
        onDelete={() => {}}
      />
    );
  }, [handleOpenDetalle]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        <View style={styles.header}>
          <BackButton color="#fff" />
          <Text style={styles.headerTitle}>Mantenimientos sin Cotización</Text>
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
          <Text style={styles.headerTitle}>Mantenimientos sin Cotización</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Error al cargar</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={{ marginTop: 12 }}>
            <Text onPress={fetchMantenimientos} style={styles.retryButtonText}>Reintentar</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF7043" />
      
      <LinearGradient
        colors={['#FF7043', '#F4511E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View style={styles.backButtonContainer}>
              <BackButton color="#fff" />
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Sin Cotización</Text>
              <Text style={styles.headerSubtitle}>Pendientes por enviar</Text>
            </View>
            <View style={styles.badgeContainer}>
              <View style={styles.totalBadge}>
                <Text style={styles.totalText}>{stats.total}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#4CAF5015' }]}>
              <MaterialIcons name="build" size={24} color="#4CAF50" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.preventivos}</Text>
              <Text style={styles.statLabel}>Preventivos</Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#FF980015' }]}>
              <MaterialIcons name="warning" size={24} color="#FF9800" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.correctivos}</Text>
              <Text style={styles.statLabel}>Correctivos</Text>
            </View>
          </View>
        </View>
      </View>

      {stats.total === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <MaterialIcons name="check-circle-outline" size={72} color="#4CAF50" />
          </View>
          <Text style={styles.emptyTitle}>¡Todo al día!</Text>
          <Text style={styles.emptyText}>
            No hay mantenimientos{'\n'}pendientes de cotización
          </Text>
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
              colors={['#FF7043']}
              tintColor="#FF7043"
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA'
  },
  headerGradient: {
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  backButtonContainer: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  badgeContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 36,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  totalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginTop: -28,
    marginBottom: 20,
    zIndex: 10,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  listContainer: { 
    paddingHorizontal: 16, 
    paddingTop: 8,
    paddingBottom: 32 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 32 
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF5010',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#333', 
    marginBottom: 8 
  },
  emptyText: { 
    fontSize: 15, 
    color: '#666', 
    textAlign: 'center', 
    lineHeight: 22 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 32,
    backgroundColor: '#F8F9FA',
  },
  errorTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#F44336', 
    marginTop: 16 
  },
  errorText: { 
    fontSize: 15, 
    color: '#666', 
    textAlign: 'center', 
    marginTop: 8,
    lineHeight: 22,
  },
  retryButtonText: { 
    color: '#FF7043', 
    fontSize: 16, 
    fontWeight: '700',
    marginTop: 24,
  },
});


