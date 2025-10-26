import React, { useCallback, useState, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '../../../components/BackButton';
import { MantenimientoCard } from '../../../components/Mantenimiento/MantenimientoCard';
import { CoordinadorMantenimiento, CoordinadorMantenimientoService, MantenimientosByPaymentStatus } from '../../../services/CoordinadorMantenimientoService';
import { Device, MantenimientoListItem } from '../../../types/mantenimiento/mantenimiento';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  MantenimientosMain: undefined;
  DetalleMantenimiento: { mantenimientoId: number };
  AsignarTecnico: { mantenimientoId: number };
  CoordinadorDashboard: undefined;
};

export default function MantenimientosMainScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuth();
  const { showError } = useError();
  
  const [mantenimientosData, setMantenimientosData] = useState<MantenimientosByPaymentStatus>({
    paid_pending_review: [],
    pending_payment: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMantenimientos = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await CoordinadorMantenimientoService.getMantenimientosByPaymentStatus(token);
      setMantenimientosData({
        paid_pending_review: data.paid_pending_review || [],
        pending_payment: data.pending_payment || []
      });
    } catch (err: any) {
      // Error log removed
      showError(err, 'Error al cargar los mantenimientos');
      setError('Error al cargar los mantenimientos');
      setMantenimientosData({ paid_pending_review: [], pending_payment: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, showError]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMantenimientos();
  }, [fetchMantenimientos]);

  useEffect(() => {
    fetchMantenimientos();
  }, [fetchMantenimientos]);

  const handleOpenDetalle = useCallback((mantenimiento: CoordinadorMantenimiento) => {
    navigation.navigate('DetalleMantenimiento', { mantenimientoId: mantenimiento.id });
  }, [navigation]);

  const renderMantenimiento = ({ item }: { item: CoordinadorMantenimiento }) => {
    const devicesRaw = Array.isArray(item.device) ? item.device : (item.device ? [item.device] : []);
    const devices: Device[] = devicesRaw.map((d: any) => ({
      id: d.id,
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
    };

    return (
      <MantenimientoCard
        item={listItem}
        onPress={() => handleOpenDetalle(item)}
      />
    );
  };

  const renderSection = (title: string, subtitle: string, data: CoordinadorMantenimiento[], icon: string, gradient: [string, string], accentColor: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderWrapper}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sectionHeader}
        >
          <View style={styles.sectionHeaderContent}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <MaterialIcons name={icon as any} size={28} color="#fff" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionSubtitle}>{subtitle}</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={styles.countText}>{data.length}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
      
      {data.length === 0 ? (
        <View style={styles.emptySection}>
          <View style={[styles.emptyIconContainer, { backgroundColor: `${accentColor}10` }]}>
            <MaterialIcons name="check-circle-outline" size={72} color={accentColor} />
          </View>
          <Text style={styles.emptyTitle}>¡Todo al día!</Text>
          <Text style={styles.emptyText}>No hay mantenimientos pendientes{'\n'}en esta categoría</Text>
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          <FlatList
            data={data}
            renderItem={renderMantenimiento}
            keyExtractor={(item) => `section_${item.id}`}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        <View style={styles.header}>
          <BackButton color="#fff" />
          <Text style={styles.headerTitle}>Mantenimientos</Text>
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
          <Text style={styles.headerTitle}>Mantenimientos</Text>
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

  const totalCount = (mantenimientosData.paid_pending_review?.length || 0) + (mantenimientosData.pending_payment?.length || 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF9800" />
      
      <LinearGradient
        colors={['#FF9800', '#F57C00']}
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
              <Text style={styles.headerTitle}>Gestión de Pagos</Text>
              <Text style={styles.headerSubtitle}>Mantenimientos pendientes</Text>
            </View>
            <View style={styles.badgeContainer}>
              <View style={styles.totalBadge}>
                <Text style={styles.totalText}>{totalCount}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#FF980015' }]}>
              <MaterialIcons name="payment" size={24} color="#FF9800" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{mantenimientosData.paid_pending_review?.length || 0}</Text>
              <Text style={styles.statLabel}>Por Revisar</Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#2196F315' }]}>
              <MaterialIcons name="schedule" size={24} color="#2196F3" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{mantenimientosData.pending_payment?.length || 0}</Text>
              <Text style={styles.statLabel}>Esperando</Text>
            </View>
          </View>
        </View>
      </View>

      <FlatList
        data={[
          { 
            type: 'paid_pending', 
            data: mantenimientosData.paid_pending_review || [],
            title: 'Pagos por Revisar',
            subtitle: 'Cliente ya pagó, verifica el soporte',
            icon: 'payment',
            gradient: ['#FF9800', '#F57C00'],
            accentColor: '#FF9800'
          },
          { 
            type: 'pending_payment', 
            data: mantenimientosData.pending_payment || [],
            title: 'Esperando Pago',
            subtitle: 'Cliente aún no ha realizado el pago',
            icon: 'schedule',
            gradient: ['#2196F3', '#1976D2'],
            accentColor: '#2196F3'
          }
        ]}
        renderItem={({ item }) => renderSection(item.title, item.subtitle, item.data, item.icon, item.gradient as [string, string], item.accentColor)}
        keyExtractor={(item) => item.type}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF9800']}
            tintColor="#FF9800"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
    width: 60,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 56,
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
    paddingTop: 8,
    paddingBottom: 32 
  },
  section: { 
    marginBottom: 24,
    marginHorizontal: 16,
  },
  sectionHeaderWrapper: {
    marginBottom: 12,
  },
  sectionHeader: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitleContainer: {
    flex: 1,
    marginLeft: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  countBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  cardsContainer: {
    paddingHorizontal: 0,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 0,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
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
  retryButton: { 
    backgroundColor: '#1976D2', 
    paddingHorizontal: 32, 
    paddingVertical: 14, 
    borderRadius: 12, 
    marginTop: 24,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
