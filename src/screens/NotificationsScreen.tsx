import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  created_at?: string;
  receivedAt?: Date;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    isInitialized,
  } = usePushNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      await getUserNotifications();
    } catch (error) {
      // Error log removed
      Alert.alert('Error', 'No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      // Error log removed
      Alert.alert('Error', 'No se pudo marcar la notificación como leída');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      // Error log removed
      Alert.alert('Error', 'No se pudieron marcar todas las notificaciones como leídas');
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navegar según el tipo de notificación
    if (notification.data?.type === 'spare_part_suggestion_created' && notification.data?.maintenance_id) {
      // Navegar a detalle de mantenimiento cuando hay sugerencia de repuesto
      const screenParams: any = {};
      if (user?.role === 'tecnico') {
        screenParams.maintenanceId = notification.data.maintenance_id;
      } else if (user?.role === 'coordinador') {
        screenParams.mantenimientoId = notification.data.maintenance_id;
      } else {
        screenParams.id = notification.data.maintenance_id;
      }
      (navigation as any).navigate('DetalleMantenimiento', screenParams);
    } else if (notification.data?.type === 'maintenance_assigned' && notification.data?.maintenance_id) {
      // Navegar a detalle de mantenimiento cuando se asigna a técnico
      const screenParams: any = {};
      if (user?.role === 'tecnico') {
        screenParams.maintenanceId = notification.data.maintenance_id;
      } else if (user?.role === 'coordinador') {
        screenParams.mantenimientoId = notification.data.maintenance_id;
      } else if (user?.role === 'cliente') {
        screenParams.id = notification.data.maintenance_id;
      } else {
        screenParams.id = notification.data.maintenance_id;
      }
      (navigation as any).navigate('DetalleMantenimiento', screenParams);
    } else if (notification.data?.screen) {
      // Navegar a la pantalla específica
      const screenParams: any = {};
      if (notification.data.maintenance_id) {
        // Si el screen es 'MantenimientoDetail' o 'DetalleMantenimiento', usar el parámetro correcto según el rol
        if ((notification.data.screen === 'MantenimientoDetail' || notification.data.screen === 'DetalleMantenimiento')) {
          if (user?.role === 'tecnico') {
            screenParams.maintenanceId = notification.data.maintenance_id;
          } else if (user?.role === 'coordinador') {
            screenParams.mantenimientoId = notification.data.maintenance_id;
          } else if (user?.role === 'cliente') {
            screenParams.id = notification.data.maintenance_id;
          } else {
            screenParams.id = notification.data.maintenance_id;
          }
        } else {
          screenParams.id = notification.data.maintenance_id;
        }
      }
      // Mapear 'MantenimientoDetail' a 'DetalleMantenimiento' si es necesario
      const screenName = notification.data.screen === 'MantenimientoDetail' ? 'DetalleMantenimiento' : notification.data.screen;
      (navigation as any).navigate(screenName, screenParams);
    } else if (notification.data?.type === 'maintenance' && notification.data?.id) {
      // Navegar a detalles de mantenimiento
      const screenParams: any = {};
      if (user?.role === 'tecnico') {
        screenParams.maintenanceId = notification.data.id;
      } else if (user?.role === 'coordinador') {
        screenParams.mantenimientoId = notification.data.id;
      } else {
        screenParams.id = notification.data.id;
      }
      (navigation as any).navigate('DetalleMantenimiento', screenParams);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} horas`;
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.data?.type === 'spare_part_suggestion_created') {
      return 'build-outline';
    } else if (notification.data?.type === 'maintenance_assigned') {
      return 'person-add-outline';
    } else if (notification.data?.type === 'maintenance') {
      return 'build-outline';
    } else if (notification.data?.type === 'assignment') {
      return 'person-add-outline';
    } else if (notification.data?.type === 'alert') {
      return 'warning-outline';
    } else {
      return 'notifications-outline';
    }
  };

  const getNotificationColor = (notification: Notification) => {
    if (notification.data?.type === 'spare_part_suggestion_created') {
      return '#FF9500';
    } else if (notification.data?.type === 'maintenance_assigned') {
      return '#3B82F6';
    } else if (notification.data?.type === 'alert') {
      return '#FF6B6B';
    } else if (notification.data?.type === 'assignment') {
      return '#4ECDC4';
    } else if (notification.data?.type === 'maintenance') {
      return '#45B7D1';
    } else {
      return '#95A5A6';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIconContainer}>
            <Ionicons
              name={getNotificationIcon(item)}
              size={20}
              color={getNotificationColor(item)}
            />
          </View>
          <View style={styles.notificationTextContainer}>
            <Text style={[styles.notificationTitle, !item.read && styles.unreadText]}>
              {item.title}
            </Text>
            <Text style={styles.notificationBody}>{item.body}</Text>
            <Text style={styles.notificationDate}>
              {formatDate(item.created_at || (item.receivedAt ? item.receivedAt.toISOString() : ''))}
            </Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#BDC3C7" />
      <Text style={styles.emptyTitle}>No hay notificaciones</Text>
      <Text style={styles.emptySubtitle}>
        Te notificaremos cuando tengas nuevas actualizaciones
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando notificaciones...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllButton}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
          </Text>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={notifications.length === 0 ? styles.emptyListContainer : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    color: '#6C757D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  markAllButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  unreadBanner: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  unreadBannerText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationBody: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginTop: 4,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6C757D',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#ADB5BD',
    textAlign: 'center',
    lineHeight: 24,
  },
});


