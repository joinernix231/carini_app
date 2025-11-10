import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import { useMantenimientosSinAsignar } from '../../../hooks/mantenimiento/useMantenimientosSinAsignar';
import { useMantenimientosAsignados } from '../../../hooks/mantenimiento/useMantenimientosAsignados';
import { CoordinadorMantenimiento } from '../../../services/CoordinadorMantenimientoService';
import { Device, MantenimientoListItem } from '../../../types/mantenimiento/mantenimiento';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import MantenimientoConfirmationService, { UnconfirmedMaintenance } from '../../../services/MantenimientoConfirmationService';

const { width } = Dimensions.get('window');

type TabType = 'aprobados' | 'asignados' | 'sin_confirmar';

type RootStackParamList = {
  AsignarTecnicoMain: undefined;
  AsignarTecnico: { mantenimientoId: number };
  DetalleMantenimiento: { mantenimientoId: number };
  CoordinadorDashboard: undefined;
};

// Helper para normalizar dispositivos
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

// Helper para crear list item
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
    clientName: item.client?.name || null,
  };
};

export default function AsignarTecnicoMainScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuth();
  const { showError } = useError();
  
  const [activeTab, setActiveTab] = useState<TabType>('aprobados');
  
  // Hooks para cada pestaña
  const aprobadosHook = useMantenimientosSinAsignar();
  const asignadosHook = useMantenimientosAsignados();
  const [sinConfirmar, setSinConfirmar] = useState<UnconfirmedMaintenance[]>([]);
  const [loadingSinConfirmar, setLoadingSinConfirmar] = useState(false);
  const [refreshingSinConfirmar, setRefreshingSinConfirmar] = useState(false);

  // Cargar mantenimientos sin confirmar
  const loadSinConfirmar = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoadingSinConfirmar(true);
      const data = await MantenimientoConfirmationService.getUnconfirmedMaintenances(token, {
        unpaginated: true,
      });
      setSinConfirmar(data);
    } catch (error: any) {
      showError(error, 'Error al cargar mantenimientos sin confirmar');
    } finally {
      setLoadingSinConfirmar(false);
      setRefreshingSinConfirmar(false);
    }
  }, [token, showError]);

  // Cargar datos según la pestaña activa
  React.useEffect(() => {
    if (activeTab === 'sin_confirmar') {
      loadSinConfirmar();
    }
  }, [activeTab, loadSinConfirmar]);

  const handleAsignarTecnico = useCallback((mantenimiento: CoordinadorMantenimiento) => {
    navigation.navigate('AsignarTecnico', { mantenimientoId: mantenimiento.id });
  }, [navigation]);

  const handleVerDetalle = useCallback((mantenimientoId: number) => {
    navigation.navigate('DetalleMantenimiento', { mantenimientoId });
  }, [navigation]);

  // Renderizar mantenimiento para pestañas Aprobados y Asignados
  const renderMantenimiento = useCallback(({ item }: { item: CoordinadorMantenimiento }) => {
    const listItem = createMantenimientoListItem(item);
    
    return (
      <MantenimientoCard
        item={listItem}
        onPress={() => activeTab === 'aprobados' 
          ? handleAsignarTecnico(item) 
          : handleVerDetalle(item.id)
        }
        onDelete={() => {}}
      />
    );
  }, [activeTab, handleAsignarTecnico, handleVerDetalle]);

  // Renderizar mantenimiento sin confirmar
  const renderSinConfirmar = useCallback(({ item }: { item: UnconfirmedMaintenance }) => {
    return (
      <View style={styles.sinConfirmarCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.statusBadge}>
              <MaterialIcons name="schedule" size={16} color="#F59E0B" />
              <Text style={styles.statusBadgeText}>Pendiente</Text>
            </View>
            <Text style={styles.maintenanceId}>#{item.id}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.clientInfo}>
            <MaterialIcons name="person" size={20} color="#1976D2" />
            <View style={styles.clientDetails}>
              <Text style={styles.clientName}>{item.client.name}</Text>
              <Text style={styles.clientPhone}>{item.client.phone}</Text>
            </View>
          </View>

          {item.technician && (
            <View style={styles.technicianInfo}>
              <MaterialIcons name="engineering" size={20} color="#6B7280" />
              <Text style={styles.technicianName}>
                Técnico: {item.technician.user.name}
              </Text>
            </View>
          )}

          <View style={styles.dateInfo}>
            <MaterialIcons name="event" size={20} color="#6B7280" />
            <Text style={styles.dateText}>
              {item.date_maintenance} ({item.shift === 'AM' ? 'Mañana' : 'Tarde'})
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleVerDetalle(item.id)}
          >
            <MaterialIcons name="visibility" size={18} color="#1976D2" />
            <Text style={styles.actionButtonText}>Ver Detalle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleVerDetalle]);

  // Obtener datos según la pestaña activa
  const getCurrentData = () => {
    switch (activeTab) {
      case 'aprobados':
        return aprobadosHook.mantenimientos;
      case 'asignados':
        return asignadosHook.mantenimientos;
      case 'sin_confirmar':
        return sinConfirmar;
      default:
        return [];
    }
  };

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'aprobados':
        return aprobadosHook.loading;
      case 'asignados':
        return asignadosHook.loading;
      case 'sin_confirmar':
        return loadingSinConfirmar;
      default:
        return false;
    }
  };

  const getCurrentRefreshing = () => {
    switch (activeTab) {
      case 'aprobados':
        return aprobadosHook.refreshing;
      case 'asignados':
        return asignadosHook.refreshing;
      case 'sin_confirmar':
        return refreshingSinConfirmar;
      default:
        return false;
    }
  };

  const getCurrentError = () => {
    switch (activeTab) {
      case 'aprobados':
        return aprobadosHook.error;
      case 'asignados':
        return asignadosHook.error;
      case 'sin_confirmar':
        return null;
      default:
        return null;
    }
  };

  const handleRefresh = useCallback(() => {
    switch (activeTab) {
      case 'aprobados':
        aprobadosHook.onRefresh();
        break;
      case 'asignados':
        asignadosHook.onRefresh();
        break;
      case 'sin_confirmar':
        setRefreshingSinConfirmar(true);
        loadSinConfirmar();
        break;
    }
  }, [activeTab, aprobadosHook, asignadosHook, loadSinConfirmar]);

  const currentData = getCurrentData();
  const loading = getCurrentLoading();
  const refreshing = getCurrentRefreshing();
  const error = getCurrentError();

  // Estadísticas
  const aprobadosCount = aprobadosHook.mantenimientos.length;
  const asignadosCount = asignadosHook.mantenimientos.length;
  const sinConfirmarCount = sinConfirmar.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      {/* Header con gradiente */}
      <LinearGradient
        colors={['#1976D2', '#1565C0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <BackButton color="#fff" />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Asignación de Técnicos</Text>
            <Text style={styles.headerSubtitle}>
              Gestiona la asignación de mantenimientos
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Pestañas */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'aprobados' && styles.tabActive]}
          onPress={() => setActiveTab('aprobados')}
        >
          <MaterialIcons 
            name="assignment-turned-in" 
            size={20} 
            color={activeTab === 'aprobados' ? '#1976D2' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'aprobados' && styles.tabTextActive]}>
            Aprobados
          </Text>
          {aprobadosCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{aprobadosCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'asignados' && styles.tabActive]}
          onPress={() => setActiveTab('asignados')}
        >
          <MaterialIcons 
            name="engineering" 
            size={20} 
            color={activeTab === 'asignados' ? '#1976D2' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'asignados' && styles.tabTextActive]}>
            Asignados
          </Text>
          {asignadosCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{asignadosCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'sin_confirmar' && styles.tabActive]}
          onPress={() => setActiveTab('sin_confirmar')}
        >
          <MaterialIcons 
            name="schedule" 
            size={20} 
            color={activeTab === 'sin_confirmar' ? '#1976D2' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'sin_confirmar' && styles.tabTextActive]}>
            Sin Confirmar
          </Text>
          {sinConfirmarCount > 0 && (
            <View style={[styles.badge, styles.badgeWarning]}>
              <Text style={styles.badgeText}>{sinConfirmarCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        {loading && currentData.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={styles.loadingText}>Cargando mantenimientos...</Text>
          </View>
        ) : error && currentData.length === 0 ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color="#F44336" />
            <Text style={styles.errorTitle}>Error al cargar</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : currentData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons 
              name="check-circle" 
              size={80} 
              color="#4CAF50" 
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'aprobados' ? '¡Todo al día!' : 
               activeTab === 'asignados' ? 'No hay mantenimientos asignados' : 
               '¡Excelente!'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'aprobados' ? 'No hay mantenimientos aprobados pendientes de asignar técnico.' : 
               activeTab === 'asignados' ? 'Los mantenimientos aparecerán aquí una vez que sean asignados a técnicos.' : 
               'No hay mantenimientos pendientes de confirmación.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={currentData}
            renderItem={activeTab === 'sin_confirmar' 
              ? renderSinConfirmar 
              : renderMantenimiento
            }
            keyExtractor={(item) => {
              if (activeTab === 'sin_confirmar') {
                return `sin_confirmar_${(item as UnconfirmedMaintenance).id}`;
              }
              return `mantenimiento_${(item as CoordinadorMantenimiento).id}`;
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
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
  headerGradient: {
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1976D2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#1976D2',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#1976D2',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeWarning: {
    backgroundColor: '#F59E0B',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    padding: 32,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Estilos para sin confirmar
  sinConfirmarCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  maintenanceId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  cardContent: {
    gap: 12,
    marginBottom: 16,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  technicianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  technicianName: {
    fontSize: 14,
    color: '#6B7280',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },
});

