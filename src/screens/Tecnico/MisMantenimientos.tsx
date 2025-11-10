import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  RefreshControl,
  Modal,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTecnicoMantenimientos } from '../../hooks/useTecnicoMantenimientos';
import { MaintenanceCard } from '../../components/Tecnico/Maintenance';
import TecnicoMantenimientosService, { 
  TecnicoMaintenance, 
  MaintenanceStatus,
  Client
} from '../../services/TecnicoMantenimientosService';
import BackButton from '../../components/BackButton';

type FilterType = 'all' | MaintenanceStatus;
type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';

export default function MisMantenimientos() {
  const { navigate } = useSmartNavigation();
  const { 
    maintenances: allMaintenances, 
    loading, 
    refreshing, 
    refreshMaintenances, 
    applyFilters 
  } = useTecnicoMantenimientos();
  
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true); // Mostrar solo activos por defecto

  // Filtrar mantenimientos según el filtro seleccionado
  const maintenances = useMemo(() => {
    let filtered = allMaintenances;

    // Si showActiveOnly es true, mostrar solo assigned e in_progress
    if (showActiveOnly && filterStatus === 'all') {
      filtered = allMaintenances.filter(m => 
        m.status === 'assigned' || m.status === 'in_progress'
      );
    } else if (filterStatus !== 'all') {
      filtered = allMaintenances.filter(m => m.status === filterStatus);
    }

    return filtered;
  }, [allMaintenances, filterStatus, showActiveOnly]);

  // Manejar el botón físico de "atrás" de Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Navegar al Dashboard del técnico en lugar de salir de la app
        navigate('TecnicoDashboard');
        return true; // Previene el comportamiento por defecto
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [navigate])
  );

  const onRefresh = async () => {
    await refreshMaintenances();
  };

  const handleFilterChange = async (status: FilterType) => {
    setFilterStatus(status);
    // Si se selecciona un filtro específico, desactivar showActiveOnly
    if (status !== 'all') {
      setShowActiveOnly(false);
      // Aplicar filtros al backend
      const dateFilterValue = dateFilter !== 'all' ? dateFilter as 'today' | 'week' | 'month' : undefined;
      await applyFilters(
        status as MaintenanceStatus,
        dateFilterValue
      );
    } else {
      // Si se selecciona "Todos", activar showActiveOnly para mostrar solo activos
      setShowActiveOnly(true);
      // Cargar todos sin filtro de estado
      const dateFilterValue = dateFilter !== 'all' ? dateFilter as 'today' | 'week' | 'month' : undefined;
      await applyFilters('all', dateFilterValue);
    }
  };

  const handleDateFilterChange = (filter: DateFilterType) => {
    setDateFilter(filter);
  };

  const applyAdvancedFilters = async () => {
    setFilterModalVisible(false);
    // Si se selecciona un filtro específico, desactivar showActiveOnly
    if (filterStatus !== 'all') {
      setShowActiveOnly(false);
    } else {
      setShowActiveOnly(true);
    }
    // Aplicar filtros al backend
    const dateFilterValue = dateFilter !== 'all' ? dateFilter as 'today' | 'week' | 'month' : undefined;
    await applyFilters(
      filterStatus === 'all' ? 'all' : filterStatus as MaintenanceStatus,
      dateFilterValue
    );
  };

  const resetFilters = async () => {
    setDateFilter('all');
    setFilterStatus('all');
    setShowActiveOnly(true); // Volver a mostrar solo activos
    await applyFilters('all', undefined);
  };

  const getStatusConfig = (status: MaintenanceStatus) => {
    switch (status) {
      case 'assigned':
        return {
          color: '#007AFF',
          bgColor: '#E6F3FF',
          icon: 'document-text-outline' as const,
          label: 'Asignado'
        };
      case 'in_progress':
        return {
          color: '#5856D6',
          bgColor: '#EEEEFC',
          icon: 'trending-up' as const,
          label: 'En Progreso'
        };
      case 'completed':
        return {
          color: '#34C759',
          bgColor: '#E8F5E8',
          icon: 'checkmark-circle' as const,
          label: 'Completado'
        };
      default:
        return {
          color: '#666',
          bgColor: '#F0F0F0',
          icon: 'help' as const,
          label: 'Desconocido'
        };
    }
  };

  const getEquipmentIcon = (deviceType: string) => {
    return TecnicoMantenimientosService.getEquipmentIcon(deviceType);
  };

  const renderMaintenanceItem = ({ item }: { item: TecnicoMaintenance }) => {
    // Navegación inteligente según el estado del mantenimiento (usando last_action_log)
    const handleMaintenancePress = () => {
      const lastAction = item.last_action_log?.action;
      
      // Si está en progreso (start o resume), ir directamente a la pantalla de trabajo
      if (lastAction === 'start' || lastAction === 'resume') {
        navigate('MantenimientoEnProgreso', { maintenanceId: item.id });
      } else {
        // Si está pausado, asignado, completado o sin action logs, ir al detalle
        // Desde el detalle se puede reanudar si está pausado
        navigate('DetalleMantenimiento', { maintenanceId: item.id });
      }
    };
    
    return <MaintenanceCard maintenance={item} onPress={handleMaintenancePress} />;
  };

  const FilterChip = ({ 
    status, 
    label, 
    count 
  }: { 
    status: FilterType; 
    label: string; 
    count?: number;
  }) => {
    // Si es "Todos" y showActiveOnly está activo, considerarlo activo
    const isActive = filterStatus === status || (status === 'all' && showActiveOnly && filterStatus === 'all');
    return (
      <TouchableOpacity
        style={[
          styles.filterChip,
          isActive && styles.filterChipActive
        ]}
        onPress={() => handleFilterChange(status)}
      >
        <Text style={[
          styles.filterChipText,
          isActive && styles.filterChipTextActive
        ]}>
          {label}
        </Text>
        {count !== undefined && (
          <View style={[
            styles.countBadge,
            isActive && styles.countBadgeActive
          ]}>
            <Text style={[
              styles.countText,
              isActive && styles.countTextActive
            ]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getFilteredCount = (status: FilterType) => {
    if (status === 'all') {
      // Si showActiveOnly está activo, contar solo assigned e in_progress
      if (showActiveOnly) {
        return allMaintenances.filter(m => 
          m.status === 'assigned' || m.status === 'in_progress'
        ).length;
      }
      return allMaintenances.length;
    }
    return allMaintenances.filter(m => m.status === status).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => navigate('TecnicoDashboard')} color="#000" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>Mis Mantenimientos</Text>
          <Text style={styles.subtitle}>
            {showActiveOnly && filterStatus === 'all' 
              ? `${maintenances.length} activo${maintenances.length !== 1 ? 's' : ''} (Asignados y En Progreso)`
              : `${maintenances.length} ${maintenances.length === 1 ? 'servicio' : 'servicios'}`
            }
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Filtros rápidos */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          <FilterChip status="all" label="Todos" count={getFilteredCount('all')} />
          <FilterChip status="assigned" label="Asignados" count={getFilteredCount('assigned')} />
          <FilterChip status="in_progress" label="En Progreso" count={getFilteredCount('in_progress')} />
          <FilterChip status="completed" label="Completados" count={getFilteredCount('completed')} />
        </ScrollView>
      </View>

      {/* Lista de mantenimientos */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando mantenimientos...</Text>
          </View>
        ) : (
          <FlatList
            data={maintenances}
            renderItem={renderMaintenanceItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor="#007AFF"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No hay mantenimientos</Text>
                <Text style={styles.emptySubtext}>
                  {dateFilter !== 'all' 
                    ? `No hay mantenimientos para el filtro de fecha seleccionado`
                    : showActiveOnly && filterStatus === 'all'
                      ? 'No tienes mantenimientos asignados o en progreso'
                      : filterStatus === 'all' 
                        ? 'No tienes mantenimientos asignados'
                        : `No hay mantenimientos ${getStatusConfig(filterStatus as MaintenanceStatus).label.toLowerCase()}`
                  }
                </Text>
              </View>
            }
          />
        )}
      </View>


      {/* Modal de Filtros Avanzados */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Por Estado</Text>
                <View style={styles.filterOptions}>
                  <FilterChip status="all" label="Todos" />
                  <FilterChip status="assigned" label="Asignados" />
                  <FilterChip status="in_progress" label="En Progreso" />
                  <FilterChip status="completed" label="Completados" />
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Por Fecha</Text>
                
                <TouchableOpacity 
                  style={[styles.dateFilterButton, dateFilter === 'all' && styles.dateFilterButtonActive]}
                  onPress={() => handleDateFilterChange('all')}
                >
                  <Ionicons name="calendar-clear" size={20} color={dateFilter === 'all' ? '#007AFF' : '#666'} />
                  <Text style={[styles.dateFilterText, dateFilter === 'all' && styles.dateFilterTextActive]}>
                    Todas las Fechas
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.dateFilterButton, dateFilter === 'today' && styles.dateFilterButtonActive]}
                  onPress={() => handleDateFilterChange('today')}
                >
                  <Ionicons name="today" size={20} color={dateFilter === 'today' ? '#007AFF' : '#666'} />
                  <Text style={[styles.dateFilterText, dateFilter === 'today' && styles.dateFilterTextActive]}>
                    Hoy
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.dateFilterButton, dateFilter === 'week' && styles.dateFilterButtonActive]}
                  onPress={() => handleDateFilterChange('week')}
                >
                  <Ionicons name="calendar" size={20} color={dateFilter === 'week' ? '#007AFF' : '#666'} />
                  <Text style={[styles.dateFilterText, dateFilter === 'week' && styles.dateFilterTextActive]}>
                    Esta Semana
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.dateFilterButton, dateFilter === 'month' && styles.dateFilterButtonActive]}
                  onPress={() => handleDateFilterChange('month')}
                >
                  <Ionicons name="calendar-outline" size={20} color={dateFilter === 'month' ? '#007AFF' : '#666'} />
                  <Text style={[styles.dateFilterText, dateFilter === 'month' && styles.dateFilterTextActive]}>
                    Este Mes
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterActions}>
                <TouchableOpacity 
                  style={styles.resetFiltersButton}
                  onPress={resetFilters}
                >
                  <Ionicons name="refresh" size={20} color="#666" />
                  <Text style={styles.resetFiltersText}>Limpiar Filtros</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.applyFiltersButton}
                  onPress={applyAdvancedFilters}
                >
                  <Text style={styles.applyFiltersText}>Aplicar Filtros</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  countBadge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  countTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  equipmentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  equipmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  equipmentDetail: {
    fontSize: 13,
    color: '#666',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginBottom: 12,
    gap: 12,
  },
  dateFilterButtonActive: {
    backgroundColor: '#E6F3FF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dateFilterText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  dateFilterTextActive: {
    color: '#007AFF',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  resetFiltersButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  resetFiltersText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFiltersText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
