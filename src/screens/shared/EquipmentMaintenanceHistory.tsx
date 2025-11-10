import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import BackButton from '../../components/BackButton';
import MaintenanceHistoryList, { MaintenanceItem } from '../../components/MaintenanceHistoryList';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { getMantenimientosEquipoVinculado } from '../../services/EquipoClienteService';
import { ClientDeviceService } from '../../services/ClientDeviceService';

type RouteParams = {
  deviceId: number;
  deviceName?: string;
  deviceBrand?: string;
  deviceModel?: string;
  clientDeviceId?: number; // Para administradores
  isAdmin?: boolean; // Indica si es vista de administrador
};

export default function EquipmentMaintenanceHistory() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { showError } = useError();
  const { deviceId, deviceName, deviceBrand, deviceModel, clientDeviceId, isAdmin } = route.params as RouteParams;

  const [maintenances, setMaintenances] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMaintenances = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      let data: MaintenanceItem[] = [];

      if (isAdmin && clientDeviceId) {
        // Para administradores, usar el servicio de administrador
        data = await ClientDeviceService.getClientDeviceMaintenances(
          clientDeviceId,
          token,
          { unpaginated: true }
        );
      } else {
        // Para clientes, usar el servicio de equipos vinculados
        data = await getMantenimientosEquipoVinculado(token, deviceId, { per_page: 50 });
      }

      setMaintenances(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceId, clientDeviceId, token, isAdmin, showError]);

  useEffect(() => {
    loadMaintenances();
  }, [loadMaintenances]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMaintenances();
  }, [loadMaintenances]);

  const handleMaintenancePress = (maintenanceId: number) => {
    if (isAdmin) {
      navigation.navigate('DetalleMantenimientoEquipo' as never, { maintenanceId } as never);
    } else {
      navigation.navigate('DetalleMantenimiento' as never, { id: maintenanceId } as never);
    }
  };

  const displayName = deviceName || `${deviceBrand || ''} ${deviceModel || ''}`.trim() || 'Equipo';

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>Cargando mantenimientos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />

      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={['#0EA5E9', '#0284C7', '#0369A1']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerRow}>
            <BackButton color="#ffffff" />
            <View style={styles.headerCenter}>
              <View style={styles.avatar}>
                <Ionicons name="hardware-chip-outline" size={44} color="#0EA5E9" />
              </View>
              <Text style={styles.title}>{displayName}</Text>
              <Text style={styles.subtitle}>Historial de Mantenimientos</Text>
            </View>
            <View style={styles.headerActions} />
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Estadística rápida */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <MaterialIcons name="build-circle" size={24} color="#0EA5E9" />
            <Text style={styles.statsLabel}>Total de Mantenimientos</Text>
            <Text style={styles.statsValue}>{maintenances.length}</Text>
          </View>
        </View>

        {/* Lista de mantenimientos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Mantenimientos</Text>
          <MaintenanceHistoryList
            maintenances={maintenances}
            onMaintenancePress={handleMaintenancePress}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  headerWrapper: {
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerActions: {
    width: 44,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});

