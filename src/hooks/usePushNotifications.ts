import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { pushNotificationService } from '../services/PushNotificationService';
import * as Notifications from 'expo-notifications';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  receivedAt: Date;
  read: boolean;
}

export const usePushNotifications = () => {
  const { user, token } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Inicializar el servicio de notificaciones
   */
  const initialize = useCallback(async () => {
    try {
      console.log('🔔 Inicializando notificaciones push...');
      
      const success = await pushNotificationService.initialize();
      if (!success) {
        console.error('❌ Error inicializando notificaciones');
        return false;
      }

      // Configurar listeners
      pushNotificationService.setupNotificationListeners();

      // Registrar token si hay usuario autenticado
      if (user && token) {
        await registerToken();
      }

      setIsInitialized(true);
      console.log('✅ Notificaciones inicializadas correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando notificaciones:', error);
      return false;
    }
  }, [user, token]);

  /**
   * Registrar token en el servidor
   */
  const registerToken = useCallback(async () => {
    if (!user?.id || !token) {
      console.warn('⚠️ No hay usuario o token para registrar');
      return false;
    }

    try {
      const success = await pushNotificationService.registerToken(user.id, token);
      if (success) {
        console.log('✅ Token registrado correctamente');
      } else {
        console.error('❌ Error registrando token');
      }
      return success;
    } catch (error) {
      console.error('❌ Error registrando token:', error);
      return false;
    }
  }, [user?.id, token]);

  /**
   * Desregistrar token del servidor
   */
  const unregisterToken = useCallback(async () => {
    if (!token) {
      return false;
    }

    try {
      const success = await pushNotificationService.unregisterToken(token);
      if (success) {
        console.log('✅ Token desregistrado correctamente');
      } else {
        console.error('❌ Error desregistrando token');
      }
      return success;
    } catch (error) {
      console.error('❌ Error desregistrando token:', error);
      return false;
    }
  }, [token]);

  /**
   * Enviar notificación local (para testing)
   */
  const sendLocalNotification = useCallback(async (title: string, body: string, data?: any) => {
    try {
      await pushNotificationService.sendLocalNotification(title, body, data);
      console.log('✅ Notificación local enviada');
    } catch (error) {
      console.error('❌ Error enviando notificación local:', error);
    }
  }, []);

  /**
   * Verificar si las notificaciones están habilitadas
   */
  const checkPermissions = useCallback(async () => {
    try {
      const enabled = await pushNotificationService.areNotificationsEnabled();
      console.log('🔔 Notificaciones habilitadas:', enabled);
      return enabled;
    } catch (error) {
      console.error('❌ Error verificando permisos:', error);
      return false;
    }
  }, []);

  /**
   * Obtener notificaciones del usuario desde el backend
   */
  const getUserNotifications = useCallback(async () => {
    if (!token) {
      console.warn('⚠️ No hay token para obtener notificaciones');
      return [];
    }

    try {
      const userNotifications = await pushNotificationService.getUserNotifications(token);
      setNotifications(userNotifications);
      return userNotifications;
    } catch (error) {
      console.error('❌ Error obteniendo notificaciones:', error);
      return [];
    }
  }, [token]);

  /**
   * Marcar notificación como leída
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!token) {
      console.warn('⚠️ No hay token para marcar como leída');
      return false;
    }

    try {
      const success = await pushNotificationService.markAsRead(notificationId, token);
      if (success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
      }
      return success;
    } catch (error) {
      console.error('❌ Error marcando como leída:', error);
      return false;
    }
  }, [token]);

  /**
   * Marcar todas las notificaciones como leídas
   */
  const markAllAsRead = useCallback(async () => {
    if (!token) {
      console.warn('⚠️ No hay token para marcar todas como leídas');
      return false;
    }

    try {
      const success = await pushNotificationService.markAllAsRead(token);
      if (success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
      }
      return success;
    } catch (error) {
      console.error('❌ Error marcando todas como leídas:', error);
      return false;
    }
  }, [token]);

  /**
   * Limpiar notificaciones
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Inicializar automáticamente cuando hay usuario
  useEffect(() => {
    if (user && token && !isInitialized) {
      initialize();
    }
  }, [user, token, isInitialized, initialize]);

  // Actualizar contador de no leídas
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  return {
    isInitialized,
    notifications,
    unreadCount,
    initialize,
    registerToken,
    unregisterToken,
    sendLocalNotification,
    checkPermissions,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
};
