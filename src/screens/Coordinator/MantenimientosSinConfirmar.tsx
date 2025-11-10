// src/screens/Coordinator/MantenimientosSinConfirmar.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BackButton from '../../components/BackButton';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import MantenimientoConfirmationService, { UnconfirmedMaintenance } from '../../services/MantenimientoConfirmationService';

type RootStackParamList = {
  MantenimientosSinConfirmar: undefined;
  DetalleMantenimiento: { maintenanceId: number };
};

export default function MantenimientosSinConfirmar() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuth();
  const { showError } = useError();

  const [maintenances, setMaintenances] = useState<UnconfirmedMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAsCalled, setMarkingAsCalled] = useState<number | null>(null);

  const loadMaintenances = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await MantenimientoConfirmationService.getUnconfirmedMaintenances(token, {
        unpaginated: true,
      });
      setMaintenances(data);
    } catch (error: any) {
      console.error('Error cargando mantenimientos sin confirmar:', error);
      showError(error, 'Error al cargar mantenimientos sin confirmar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, showError]);

  useFocusEffect(
    useCallback(() => {
      loadMaintenances();
    }, [loadMaintenances])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMaintenances();
  }, [loadMaintenances]);

  const handleCallClient = useCallback((phone: string, clientName: string) => {
    Alert.alert(
      'Llamar al Cliente',
      `¿Deseas llamar a ${clientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Llamar',
          onPress: () => {
            Linking.openURL(`tel:${phone}`).catch(() => {
              Alert.alert('Error', 'No se pudo realizar la llamada');
            });
          },
        },
      ]
    );
  }, []);

  const handleMarkAsCalled = useCallback(async (maintenanceId: number) => {
    if (!token) return;

    Alert.alert(
      'Marcar como Llamado',
      '¿Deseas marcar este mantenimiento como "llamado"?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar',
          onPress: async () => {
            try {
              setMarkingAsCalled(maintenanceId);
              await MantenimientoConfirmationService.markAsCalled(maintenanceId, token);
              await loadMaintenances();
            } catch (error: any) {
              showError(error, 'Error al marcar como llamado');
            } finally {
              setMarkingAsCalled(null);
            }
          },
        },
      ]
    );
  }, [token, showError, loadMaintenances]);

  const handleViewDetail = useCallback((maintenanceId: number) => {
    navigation.navigate('DetalleMantenimiento', { maintenanceId });
  }, [navigation]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Hace ${hours}h ${minutes}m`;
    }
    return `Hace ${minutes}m`;
  };

  const renderMaintenanceItem = useCallback(({ item }: { item: UnconfirmedMaintenance }) => {
    const deadline = item.confirmation_deadline ? new Date(item.confirmation_deadline) : null;
    const isOverdue = deadline && deadline < new Date();

    return (
      <View style={styles.maintenanceCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.statusBadge, isOverdue && styles.statusBadgeOverdue]}>
              <Ionicons 
                name={isOverdue ? "warning" : "time-outline"} 
                size={16} 
                color={isOverdue ? "#EF4444" : "#F59E0B"} 
              />
              <Text style={[styles.statusBadgeText, isOverdue && styles.statusBadgeTextOverdue]}>
                {isOverdue ? 'Vencido' : 'Pendiente'}
              </Text>
            </View>
            <Text style={styles.maintenanceId}>#{item.id}</Text>
          </View>
          {item.coordinator_notified && item.coordinator_notified_at && (
            <Text style={styles.notifiedText}>
              Notificado {formatTimeSince(item.coordinator_notified_at)}
            </Text>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.clientInfo}>
            <MaterialIcons name="person" size={20} color="#0077b6" />
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
              Programado: {formatDate(item.date_maintenance)} ({item.shift === 'AM' ? 'Mañana' : 'Tarde'})
            </Text>
          </View>

          {deadline && (
            <View style={styles.deadlineInfo}>
              <MaterialIcons 
                name="schedule" 
                size={20} 
                color={isOverdue ? "#EF4444" : "#F59E0B"} 
              />
              <Text style={[styles.deadlineText, isOverdue && styles.deadlineTextOverdue]}>
                {isOverdue 
                  ? `Vencido el ${deadline.toLocaleDateString('es-CO')} ${deadline.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
                  : `Vence: ${deadline.toLocaleDateString('es-CO')} ${deadline.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCallClient(item.client.phone, item.client.name)}
          >
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.callButtonText}>Llamar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.markCalledButton, item.coordinator_called && styles.markCalledButtonActive]}
            onPress={() => handleMarkAsCalled(item.id)}
            disabled={markingAsCalled === item.id || item.coordinator_called}
          >
            {markingAsCalled === item.id ? (
              <ActivityIndicator size="small" color="#0077b6" />
            ) : (
              <>
                <Ionicons 
                  name={item.coordinator_called ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={18} 
                  color={item.coordinator_called ? "#10B981" : "#0077b6"} 
                />
                <Text style={[styles.markCalledButtonText, item.coordinator_called && styles.markCalledButtonTextActive]}>
                  {item.coordinator_called ? 'Llamado' : 'Marcar como Llamado'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewDetailButton}
            onPress={() => handleViewDetail(item.id)}
          >
            <Ionicons name="eye" size={18} color="#0077b6" />
            <Text style={styles.viewDetailButtonText}>Ver Detalle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleCallClient, handleMarkAsCalled, handleViewDetail, markingAsCalled]);

  if (loading && !refreshing && maintenances.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <BackButton color="#000" />
          <Text style={styles.headerTitle}>Mantenimientos Sin Confirmar</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0077b6" />
          <Text style={styles.loadingText}>Cargando mantenimientos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <BackButton color="#000" />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mantenimientos Sin Confirmar</Text>
          <Text style={styles.headerSubtitle}>
            {maintenances.length} mantenimiento{maintenances.length !== 1 ? 's' : ''} pendiente{maintenances.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {maintenances.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.emptyTitle}>¡Excelente!</Text>
          <Text style={styles.emptyText}>
            No hay mantenimientos pendientes de confirmación.
          </Text>
        </View>
      ) : (
        <FlatList
          data={maintenances}
          keyExtractor={(item) => `maintenance_${item.id}`}
          renderItem={renderMaintenanceItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0077b6']}
              tintColor="#0077b6"
            />
          }
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  maintenanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  statusBadgeOverdue: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  statusBadgeTextOverdue: {
    color: '#EF4444',
  },
  maintenanceId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  notifiedText: {
    fontSize: 12,
    color: '#6B7280',
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
  deadlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deadlineText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  deadlineTextOverdue: {
    color: '#EF4444',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  callButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  markCalledButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    minWidth: 100,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0077b6',
  },
  markCalledButtonActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  markCalledButtonText: {
    color: '#0077b6',
    fontSize: 14,
    fontWeight: '600',
  },
  markCalledButtonTextActive: {
    color: '#10B981',
  },
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  viewDetailButtonText: {
    color: '#0077b6',
    fontSize: 14,
    fontWeight: '600',
  },
});


