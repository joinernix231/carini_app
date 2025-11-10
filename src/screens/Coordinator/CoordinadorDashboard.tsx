import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MantenimientosService } from '../../services/MantenimientosService';
import { CoordinadorMantenimientoService } from '../../services/CoordinadorMantenimientoService';
import MantenimientoConfirmationService from '../../services/MantenimientoConfirmationService';
import NotificationIcon from '../../components/NotificationIcon';

const { width } = Dimensions.get('window');

// Color principal de Carini
const CARINI_PRIMARY = '#0077b6';
const CARINI_SECONDARY = '#00b4d8';
const CARINI_DARK = '#023e8a';

type RootStackParamList = {
  VerMantenimientos: undefined;
  TecnicoList: undefined;
  EquipoList: undefined;
  AsignarEquipos: undefined;
  MantenimientosSinAsignar: undefined;
  MantenimientosAsignados: undefined;
  MantenimientosRechazados: undefined;
  MantenimientosSinConfirmar: undefined;
  AsignarTecnicoMain: undefined;
  MantenimientosMain: undefined;
  MantenimientosSinCotizacion: undefined;
  Mantenimientos: undefined;
};

interface DashboardStats {
  sinCotizacion: number;
  aprobados: number;
  asignados: number;
  sinConfirmar: number;
  pagosPendientes: number;
  pagosPorRevisar: number;
  enProgreso: number;
  completados: number;
}

interface QuickAction {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  screen: keyof RootStackParamList;
  color: string;
  badge?: number;
  urgent?: boolean;
  description: string;
}

export default function CoordinadorDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout, token } = useAuth();
  const { showError } = useError();
  
  const [stats, setStats] = useState<DashboardStats>({
    sinCotizacion: 0,
    aprobados: 0,
    asignados: 0,
    sinConfirmar: 0,
    pagosPendientes: 0,
    pagosPorRevisar: 0,
    enProgreso: 0,
    completados: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      
      // Cargar primero solo los datos esenciales para mostrar el dashboard rápidamente
      // Cargamos en dos fases: primero lo crítico, luego lo secundario
      const [
        pagos,
        sinConfirmar,
      ] = await Promise.all([
        // Prioridad 1: Pagos (más crítico)
        CoordinadorMantenimientoService.getMantenimientosByPaymentStatus(token).catch(() => ({ paid_pending_review: [], pending_payment: [] })),
        // Prioridad 1: Sin confirmar (urgente)
        MantenimientoConfirmationService.getUnconfirmedMaintenances(token, { unpaginated: true }).catch(() => []),
      ]);

      // Actualizar stats con datos críticos primero
      setStats(prev => ({
        ...prev,
        sinConfirmar: sinConfirmar.length || 0,
        pagosPendientes: pagos.pending_payment?.length || 0,
        pagosPorRevisar: pagos.paid_pending_review?.length || 0,
      }));

      // Cargar datos secundarios después (sin bloquear la UI)
      // Solo cargamos los conteos necesarios, no todos los datos completos
      Promise.all([
        CoordinadorMantenimientoService.getMantenimientosSinCotizacion(token).catch(() => []),
        CoordinadorMantenimientoService.getMantenimientosAprobados(token).catch(() => []),
        CoordinadorMantenimientoService.getMantenimientosAsignadosCoordinador(token).catch(() => []),
      ]).then(([sinCotizacion, aprobados, asignados]) => {
        setStats(prev => ({
          ...prev,
          sinCotizacion: sinCotizacion.length || 0,
          aprobados: aprobados.length || 0,
          asignados: asignados.length || 0,
          // enProgreso y completados no son críticos para el dashboard inicial
          // Se pueden cargar cuando se necesiten
        }));
      }).catch(() => {
        // Silently fail for secondary data
      });
    } catch (error: any) {
      showError(error, 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, showError]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, [loadStats]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, salir', style: 'destructive', onPress: logout },
      ]
    );
  }, [logout]);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const greeting = useMemo(() => getGreeting(), [getGreeting]);

  // Acciones rápidas organizadas por categorías
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'pagos',
      icon: 'payment',
      label: 'Pagos',
      screen: 'MantenimientosMain' as any,
      color: '#FF9800',
      badge: stats.pagosPendientes + stats.pagosPorRevisar,
      urgent: stats.pagosPorRevisar > 0,
      description: `${stats.pagosPorRevisar} por revisar`,
    },
    {
      id: 'cotizacion',
      icon: 'assignment',
      label: 'Sin Cotización',
      screen: 'MantenimientosSinCotizacion' as any,
      color: '#4ECDC4',
      badge: stats.sinCotizacion,
      urgent: stats.sinCotizacion > 0,
      description: `${stats.sinCotizacion} pendientes`,
    },
    {
      id: 'asignar',
      icon: 'engineering',
      label: 'Asignar Técnicos',
      screen: 'AsignarTecnicoMain' as any,
      color: CARINI_PRIMARY,
      badge: stats.aprobados + stats.sinConfirmar,
      urgent: stats.sinConfirmar > 0,
      description: `${stats.aprobados} aprobados`,
    },
    {
      id: 'mantenimientos',
      icon: 'list-alt',
      label: 'Todos',
      screen: 'Mantenimientos' as any,
      color: '#9C27B0',
      description: 'Ver todos',
    },
  ], [stats]);

  const configActions: QuickAction[] = useMemo(() => [
    {
      id: 'tecnicos',
      icon: 'people',
      label: 'Técnicos',
      screen: 'TecnicoList',
      color: CARINI_SECONDARY,
      description: 'Gestionar',
    },
    {
      id: 'equipos',
      icon: 'devices',
      label: 'Equipos',
      screen: 'EquipoList',
      color: CARINI_PRIMARY,
      description: 'Editar',
    },
  ], []);

  const renderQuickAction = useCallback((action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.quickActionCard, { borderLeftColor: action.color }]}
      onPress={() => navigation.navigate(action.screen)}
      activeOpacity={0.8}
    >
      <View style={styles.quickActionContent}>
        <View style={[styles.quickActionIconContainer, { backgroundColor: action.color }]}>
          <MaterialIcons name={action.icon} size={32} color="#fff" />
          {action.badge !== undefined && action.badge > 0 && (
            <View style={[styles.quickActionBadge, action.urgent && styles.quickActionBadgeUrgent]}>
              <Text style={styles.quickActionBadgeText}>
                {action.badge > 99 ? '99+' : action.badge}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.quickActionTextContainer}>
          <Text style={styles.quickActionLabel}>{action.label}</Text>
          <Text style={styles.quickActionDescription}>{action.description}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#999" />
      </View>
    </TouchableOpacity>
  ), [navigation]);

  const renderConfigAction = useCallback((action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.configCard, { backgroundColor: action.color }]}
      onPress={() => navigation.navigate(action.screen)}
      activeOpacity={0.8}
    >
      <MaterialIcons name={action.icon} size={28} color="#fff" />
      <Text style={styles.configLabel}>{action.label}</Text>
      <Text style={styles.configDescription}>{action.description}</Text>
    </TouchableOpacity>
  ), [navigation]);

  const renderStatCard = useCallback((
    icon: string,
    label: string,
    value: number,
    color: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color }]}>
        <MaterialIcons name={icon as any} size={24} color="#fff" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  ), []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={CARINI_PRIMARY} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[CARINI_PRIMARY]}
            tintColor={CARINI_PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: CARINI_PRIMARY }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                <MaterialIcons name="admin-panel-settings" size={32} color={CARINI_PRIMARY} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.greeting}>{greeting}</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name ?? 'Coordinador'}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <NotificationIcon color="#fff" size={24} />
              <TouchableOpacity
                style={styles.logoutButtonHeader}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <MaterialIcons name="logout" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Estadísticas Rápidas */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          {loading ? (
            <View style={styles.loadingStats}>
              <ActivityIndicator size="small" color={CARINI_PRIMARY} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsScroll}
            >
              {renderStatCard(
                'assignment',
                'Sin Cotizar',
                stats.sinCotizacion,
                '#4ECDC4',
                () => navigation.navigate('MantenimientosSinCotizacion')
              )}
              {renderStatCard(
                'check-circle',
                'Aprobados',
                stats.aprobados,
                '#43E97B',
                () => navigation.navigate('AsignarTecnicoMain')
              )}
              {renderStatCard(
                'schedule',
                'Sin Confirmar',
                stats.sinConfirmar,
                '#F59E0B',
                () => navigation.navigate('AsignarTecnicoMain')
              )}
              {renderStatCard(
                'payment',
                'Pagos',
                stats.pagosPendientes + stats.pagosPorRevisar,
                '#FF9800',
                () => navigation.navigate('MantenimientosMain')
              )}
            </ScrollView>
          )}
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Configuración */}
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          <View style={styles.configContainer}>
            {configActions.map(renderConfigAction)}
          </View>
        </View>

        {/* Espacio final */}
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButtonHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  loadingStats: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  statsScroll: {
    paddingRight: 20,
  },
  statCard: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  quickActionsContainer: {
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  quickActionBadgeUrgent: {
    backgroundColor: '#F59E0B',
  },
  quickActionBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  quickActionTextContainer: {
    flex: 1,
  },
  quickActionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  configSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  configContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  configCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  configDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  footerSpace: {
    height: 20,
  },
});
