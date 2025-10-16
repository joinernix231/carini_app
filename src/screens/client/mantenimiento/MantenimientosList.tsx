import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import BackButton from '../../../components/BackButton';
import { useFocusEffect } from '@react-navigation/native';
import { useSmartNavigation } from '../../../hooks/useSmartNavigation';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import {
  getMantenimientos,
  deleteMantenimiento,
} from '../../../services/MantenimientoService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MantenimientoCard } from '../../../components/Mantenimiento/MantenimientoCard';
import { MantenimientoListItem } from '../../../types/mantenimiento/mantenimiento';

export default function MantenimientosList() {
  const { token } = useAuth();
  const { showError } = useError();
  const { navigate } = useSmartNavigation();
  const [mantenimientos, setMantenimientos] = useState<MantenimientoListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const traducirEstado = (estadoIngles: string): string => {
    const traducciones: Record<string, string> = {
      pending: 'Pendiente',
      assigned: 'Asignado',
      in_progress: 'En progreso',
      completed: 'Completado',
      cancelled: 'Cancelado',
    };
    return traducciones[estadoIngles] || estadoIngles;
  };

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return {
          color: '#FF9500',
          bgColor: '#FFF5E6',
          icon: 'time-outline' as const,
        };
      case 'Asignado':
        return {
          color: '#007AFF',
          bgColor: '#E6F3FF',
          icon: 'document-text-outline' as const,
        };
      case 'En progreso':
        return {
          color: '#5856D6',
          bgColor: '#EEEEFC',
          icon: 'trending-up' as const,
        };
      case 'Completado':
        return {
          color: '#34C759',
          bgColor: '#E8F5E8',
          icon: 'checkmark-circle' as const,
        };
      case 'Cancelado':
        return {
          color: '#FF3B30',
          bgColor: '#FFE6E6',
          icon: 'close-circle' as const,
        };
      default:
        return {
          color: '#666',
          bgColor: '#F0F0F0',
          icon: 'help' as const,
        };
    }
  };

  const getTipoConfig = (tipo: string) => {
    return tipo === 'preventive'
        ? {
          color: '#00C7BE',
          bgColor: '#E6FFFE',
          icon: 'shield-checkmark' as const,
          label: 'Preventivo'
        }
        : {
          color: '#FF6B47',
          bgColor: '#FFF0ED',
          icon: 'warning' as const,
          label: 'Correctivo'
        };
  };

  const fetchMantenimientos = async (showLoading = true) => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }

      if (showLoading) setLoading(true);

      const data = await getMantenimientos(token);

      if (Array.isArray(data)) {
        const formattedData: MantenimientoListItem[] = data.map((item: any) => {
          // Manejar la nueva estructura con múltiples dispositivos
          const devices = Array.isArray(item.device) ? item.device : [item.device].filter(Boolean);
          const primaryDevice = devices[0] || { model: 'Equipo sin nombre', brand: '', serial: '', address: '' };
          
          return {
            id: item.id,
            type: item.type || 'preventive',
            status: item.status || 'pending',
            devices: devices,
            description: item.description || '',
            date_maintenance: item.date_maintenance,
            created_at: item.created_at || new Date().toISOString(),
            deviceCount: devices.length,
            primaryDevice: primaryDevice,
          };
        });

        setMantenimientos(formattedData);
      } else {
        console.warn('Datos no válidos recibidos:', data);
        setMantenimientos([]);
      }
    } catch (error) {
      console.error('Error al cargar mantenimientos:', error);
      showError(error, 'Error al cargar los mantenimientos');
      setMantenimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const eliminarMantenimiento = (id: number) => {
    Alert.alert(
        'Confirmar eliminación',
        '¿Estás seguro de que deseas eliminar este mantenimiento?',
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                if (!token) return;
                await deleteMantenimiento(id, token);

                setMantenimientos(prev => prev.filter(m => m.id !== id));

                Alert.alert('Éxito', 'Mantenimiento eliminado correctamente');
              } catch (error) {
                console.error('Error al eliminar:', error);
                showError(error, 'Error al eliminar el mantenimiento');
              }
            },
          },
        ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMantenimientos(false);
    } catch (error) {
      console.error('Error al actualizar:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  // Recargar cuando la pantalla recibe foco
  useFocusEffect(
      useCallback(() => {
        fetchMantenimientos();
      }, [token])
  );

  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Fecha no válida';
    }
  };

  const renderItem = ({ item }: { item: MantenimientoListItem }) => {
    return (
      <MantenimientoCard
        item={item}
        onPress={() => navigate('DetalleMantenimiento', { id: item.id })}
        onDelete={() => eliminarMantenimiento(item.id)}
      />
    );
  };

  const renderHeader = () => (
      <View style={styles.header}>
        <BackButton style={{ marginBottom: 10 }} color="#000" size={24} />
        <View style={styles.titleSection}>
          <Text style={styles.title}>Mantenimientos</Text>
          <Text style={styles.subtitle}>Gestiona tus equipos industriales</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{mantenimientos.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {mantenimientos.filter(m => traducirEstado(m.status) === 'Pendiente').length}
            </Text>
            <Text style={styles.statLabel}>Pendiente</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {mantenimientos.filter(m => traducirEstado(m.status) === 'Completado').length}
            </Text>
            <Text style={styles.statLabel}>Completado</Text>
          </View>
        </View>
      </View>
  );

  const renderEmptyState = () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="construct-outline" size={64} color="#C0C0C0" />
        </View>
        <Text style={styles.emptyTitle}>No hay mantenimientos</Text>
        <Text style={styles.emptySubtitle}>
          Crea tu primer mantenimiento para comenzar a gestionar tus equipos
        </Text>
        <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigate('CrearMantenimiento')}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.emptyButtonText}>Crear mantenimiento</Text>
        </TouchableOpacity>
      </View>
  );

  const renderLoadingState = () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando mantenimientos...</Text>
      </View>
  );

  if (loading) {
    return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
          {renderHeader()}
          <View style={{ flex: 1 }}>
            {renderLoadingState()}
          </View>
        </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        
        {/* Header fijo */}
        {renderHeader()}

        {mantenimientos.length === 0 ? (
            renderEmptyState()
        ) : (
            <>
              <FlatList
                  data={mantenimientos}
                  renderItem={renderItem}
                  keyExtractor={(item) => `mantenimiento_${item.id}`}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#007AFF"
                        colors={['#007AFF']}
                    />
                  }
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={8}
              />

              {/* Botón flotante para crear nuevo mantenimiento */}
              <TouchableOpacity
                  style={styles.fab}
                  onPress={() => navigate('CrearMantenimiento')}
                  activeOpacity={0.9}
              >
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </>
        )}
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#F8F9FA',
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 17,
    color: '#666',
    fontWeight: '500',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  statusIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    marginBottom: 16,
  },
  equipoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipoIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  equipoInfo: {
    flex: 1,
  },
  equipoNombre: {
    fontSize: 19,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  tipoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tipoText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fechaText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  estadoText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
  },
  deleteText: {
    marginLeft: 6,
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '600',
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 17,
    color: '#666',
    fontWeight: '500',
  },
});