import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';
import { MantenimientoCard } from '../../../components/Mantenimiento/MantenimientoCard';
import { CoordinadorMantenimiento, CoordinadorMantenimientoService } from '../../../services/CoordinadorMantenimientoService';
import { Device, MantenimientoListItem } from '../../../types/mantenimiento/mantenimiento';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import { MantenimientosService, FilterType } from '../../../services/MantenimientosService';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Mantenimientos: undefined;
  DetalleMantenimiento: { mantenimientoId: number };
  CoordinadorDashboard: undefined;
};

// Tipos para filtros (ya importado desde MantenimientosService)

type FilterOption = {
  label: string;
  value: string;
  field: string;
  comparator: FilterType['comparator'];
};

// Opciones de filtros predefinidas
const FILTER_OPTIONS: FilterOption[] = [
  { label: 'Estado: Pendiente', value: 'pending', field: 'status', comparator: 'in' },
  { label: 'Estado: Cotizado', value: 'quoted', field: 'status', comparator: 'in' },
  { label: 'Estado: Asignado', value: 'assigned', field: 'status', comparator: 'in' },
  { label: 'Estado: En Progreso', value: 'in_progress', field: 'status', comparator: 'in' },
  { label: 'Estado: Completado', value: 'completed', field: 'status', comparator: 'in' },
  { label: 'Estado: Cancelado', value: 'cancelled', field: 'status', comparator: 'in' },
  { label: 'Estado: Rechazado', value: 'rejected', field: 'status', comparator: 'in' },
  { label: 'Tipo: Preventivo', value: 'preventive', field: 'type', comparator: 'in' },
  { label: 'Tipo: Correctivo', value: 'corrective', field: 'type', comparator: 'in' },
  { label: 'Requiere Pago', value: 'false', field: 'is_paid', comparator: 'is' },
  { label: 'No Requiere Pago', value: 'null', field: 'is_paid', comparator: 'null' },
  { label: 'Pago Verificado', value: 'true', field: 'is_paid', comparator: 'is' },
];

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

export default function MantenimientosScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuth();
  const { showError } = useError();
  
  const [mantenimientos, setMantenimientos] = useState<CoordinadorMantenimiento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Fetch mantenimientos con filtros
  const fetchMantenimientos = useCallback(async (page: number = 1, reset: boolean = false) => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const response = await MantenimientosService.getMantenimientosWithFilters(
        token,
        activeFilters,
        page
      );

      const newMantenimientos = response.data || [];

      if (reset) {
        setMantenimientos(newMantenimientos);
      } else {
        setMantenimientos(prev => page === 1 ? newMantenimientos : [...prev, ...newMantenimientos]);
      }

      setHasMore(page < response.last_page);
      setCurrentPage(page);
    } catch (err: any) {
      // Error log removed
      showError(err, 'Error al cargar los mantenimientos');
      setError('Error al cargar los mantenimientos');
      if (reset) {
        setMantenimientos([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, showError, activeFilters]);

  const onRefresh = useCallback(() => {
    fetchMantenimientos(1, true);
  }, [fetchMantenimientos]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchMantenimientos(currentPage + 1, false);
    }
  }, [loading, hasMore, currentPage, fetchMantenimientos]);

  const handleOpenDetalle = useCallback((mantenimientoId: number) => {
    navigation.navigate('DetalleMantenimiento', { mantenimientoId });
  }, [navigation]);

  const renderMantenimiento = useCallback(({ item }: { item: CoordinadorMantenimiento }) => {
    const listItem = createMantenimientoListItem(item);
    return (
      <MantenimientoCard
        item={listItem}
        onPress={() => handleOpenDetalle(item.id)}
      />
    );
  }, [handleOpenDetalle]);

  // Datos renderizados (sin búsqueda local)
  const filteredMantenimientos = mantenimientos;

  // Estadísticas memoizadas
  const stats = useMemo(() => ({
    total: filteredMantenimientos.length,
    preventivos: filteredMantenimientos.filter(m => m.type === 'preventive').length,
    correctivos: filteredMantenimientos.filter(m => m.type === 'corrective').length,
    pendientes: filteredMantenimientos.filter(m => m.status === 'pending').length,
    cotizados: filteredMantenimientos.filter(m => m.status === 'quoted').length,
    asignados: filteredMantenimientos.filter(m => m.status === 'assigned').length,
    enProgreso: filteredMantenimientos.filter(m => m.status === 'in_progress').length,
    completados: filteredMantenimientos.filter(m => m.status === 'completed').length,
  }), [filteredMantenimientos]);

  // Aplicar filtro
  const applyFilter = useCallback((filter: FilterOption) => {
    const newFilter: FilterType = {
      field: filter.field,
      comparator: filter.comparator,
      value: filter.value,
    };

    setActiveFilters(prev => {
      const exists = prev.some(f => f.field === filter.field && f.value === filter.value);
      if (exists) {
        return prev.filter(f => !(f.field === filter.field && f.value === filter.value));
      } else {
        return [...prev, newFilter];
      }
    });
  }, []);

  // Limpiar todos los filtros
  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
  }, []);

  // Efecto para recargar cuando cambien los filtros
  useEffect(() => {
    fetchMantenimientos(1, true);
  }, [activeFilters]);

  useEffect(() => {
    fetchMantenimientos(1, true);
  }, []);

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filtros</Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearAllText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filtersContainer}>
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.sectionTitle}>Filtros Activos ({activeFilters.length})</Text>
            {activeFilters.length > 0 ? (
              <View style={styles.activeFiltersList}>
                {activeFilters.map((filter, index) => (
                  <View key={index} style={styles.activeFilterTag}>
                    <Text style={styles.activeFilterText}>
                      {FILTER_OPTIONS.find(opt => opt.field === filter.field && opt.value === filter.value)?.label || `${filter.field}: ${filter.value}`}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setActiveFilters(prev => prev.filter((_, i) => i !== index))}
                    >
                      <MaterialIcons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noFiltersText}>No hay filtros activos</Text>
            )}
          </View>

          <View style={styles.filtersSection}>
            <Text style={styles.sectionTitle}>Filtrar por Estado</Text>
            {FILTER_OPTIONS.filter(opt => opt.field === 'status').map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterOption,
                  activeFilters.some(f => f.field === option.field && f.value === option.value) && styles.filterOptionActive
                ]}
                onPress={() => applyFilter(option)}
              >
                <Text style={[
                  styles.filterOptionText,
                  activeFilters.some(f => f.field === option.field && f.value === option.value) && styles.filterOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {activeFilters.some(f => f.field === option.field && f.value === option.value) && (
                  <MaterialIcons name="check" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filtersSection}>
            <Text style={styles.sectionTitle}>Filtrar por Tipo</Text>
            {FILTER_OPTIONS.filter(opt => opt.field === 'type').map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterOption,
                  activeFilters.some(f => f.field === option.field && f.value === option.value) && styles.filterOptionActive
                ]}
                onPress={() => applyFilter(option)}
              >
                <Text style={[
                  styles.filterOptionText,
                  activeFilters.some(f => f.field === option.field && f.value === option.value) && styles.filterOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {activeFilters.some(f => f.field === option.field && f.value === option.value) && (
                  <MaterialIcons name="check" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filtersSection}>
            <Text style={styles.sectionTitle}>Filtrar por Pago</Text>
            {FILTER_OPTIONS.filter(opt => opt.field === 'is_paid').map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterOption,
                  activeFilters.some(f => f.field === option.field && f.value === option.value) && styles.filterOptionActive
                ]}
                onPress={() => applyFilter(option)}
              >
                <Text style={[
                  styles.filterOptionText,
                  activeFilters.some(f => f.field === option.field && f.value === option.value) && styles.filterOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {activeFilters.some(f => f.field === option.field && f.value === option.value) && (
                  <MaterialIcons name="check" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading && mantenimientos.length === 0) {
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

  if (error && mantenimientos.length === 0) {
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
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchMantenimientos(1, true)}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      <LinearGradient
        colors={['#1976D2', '#1565C0']}
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
              <Text style={styles.headerTitle}>Mantenimientos</Text>
              <Text style={styles.headerSubtitle}>Gestión completa</Text>
            </View>
            <View style={styles.badgeContainer}>
              <View style={styles.totalBadge}>
                <Text style={styles.totalText}>{stats.total}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Filtros */}
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={[styles.filterButton, activeFilters.length > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <MaterialIcons name="filter-list" size={20} color={activeFilters.length > 0 ? "#fff" : "#666"} />
          {activeFilters.length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilters.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Estadísticas rápidas */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.preventivos}</Text>
            <Text style={styles.statLabel}>Preventivos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.correctivos}</Text>
            <Text style={styles.statLabel}>Correctivos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.pendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.cotizados}</Text>
            <Text style={styles.statLabel}>Cotizados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.asignados}</Text>
            <Text style={styles.statLabel}>Asignados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.enProgreso}</Text>
            <Text style={styles.statLabel}>En Progreso</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completados}</Text>
            <Text style={styles.statLabel}>Completados</Text>
          </View>
        </ScrollView>
      </View>

      {filteredMantenimientos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <MaterialIcons name="search-off" size={72} color="#9E9E9E" />
          </View>
          <Text style={styles.emptyTitle}>No hay mantenimientos</Text>
          <Text style={styles.emptyText}>No hay mantenimientos que coincidan con los filtros aplicados</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMantenimientos}
          renderItem={renderMantenimiento}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1976D2"]}
              tintColor="#1976D2"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading && !refreshing ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#1976D2" />
                <Text style={styles.loadingMoreText}>Cargando más...</Text>
              </View>
            ) : null
          }
        />
      )}

      {renderFilterModal()}
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  totalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#1976D2',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  statsContainer: {
    paddingVertical: 12,
  },
  statsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1976D2',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 2,
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
    backgroundColor: '#9E9E9E10',
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
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  clearAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  filtersContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  activeFiltersContainer: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  noFiltersText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  filtersSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterOptionActive: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  filterOptionTextActive: {
    color: '#1976D2',
    fontWeight: '600',
  },
});
