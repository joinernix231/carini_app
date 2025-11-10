import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [tokenRegistered, setTokenRegistered] = useState(false);
  const initializingRef = useRef(false);
  const tokenRegisteredRef = useRef(false);

  /**
   * Inicializar el servicio de notificaciones
   */
  const initialize = useCallback(async () => {
    // Evitar múltiples inicializaciones simultáneas
    if (initializingRef.current) {
      console.log('🔔 Inicialización ya en progreso, omitiendo...');
      return false;
    }

    try {
      initializingRef.current = true;
      console.log('🔔 Inicializando notificaciones push...');
      
      const success = await pushNotificationService.initialize();
      if (!success) {
        initializingRef.current = false;
        return false;
      }

      // Configurar listeners
      pushNotificationService.setupNotificationListeners();

      // Registrar token si hay usuario autenticado y no está ya registrado
      if (user?.id && token && !tokenRegisteredRef.current) {
        const registerSuccess = await pushNotificationService.registerToken(user.id, token);
        if (registerSuccess) {
          tokenRegisteredRef.current = true;
          setTokenRegistered(true);
        }
      }

      setIsInitialized(true);
      initializingRef.current = false;
      return true;
    } catch (error) {
      initializingRef.current = false;
      return false;
    }
  }, [user?.id, token]);

  /**
   * Registrar token en el servidor
   */
  const registerToken = useCallback(async () => {
    if (!user?.id || !token) {
      return false;
    }

    // Evitar registrar el token múltiples veces
    if (tokenRegisteredRef.current) {
      console.log('🔔 Token ya registrado, omitiendo registro duplicado');
      return true;
    }

    try {
      const success = await pushNotificationService.registerToken(user.id, token);
      if (success) {
        tokenRegisteredRef.current = true;
        setTokenRegistered(true);
      }
      return success;
    } catch (error) {
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
        // Log removed
      } else {
        // Error log removed
      }
      return success;
    } catch (error) {
      // Error log removed
      return false;
    }
  }, [token]);

  /**
   * Enviar notificación local (para testing)
   */
  const sendLocalNotification = useCallback(async (title: string, body: string, data?: any) => {
    try {
      await pushNotificationService.sendLocalNotification(title, body, data);
      // Log removed
    } catch (error) {
      // Error log removed
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
      // Error log removed
      return false;
    }
  }, []);

  /**
   * Obtener notificaciones del usuario desde el backend
   */
  const getUserNotifications = useCallback(async () => {
    if (!token) {
      // Warning log removed
      return [];
    }

    try {
      const userNotifications = await pushNotificationService.getUserNotifications(token);
      // Mapear las notificaciones del backend al formato esperado
      const mappedNotifications: NotificationData[] = userNotifications.map((notif: any) => ({
        id: String(notif.id),
        title: notif.title || '',
        body: notif.body || '',
        data: notif.data || {},
        receivedAt: notif.created_at ? new Date(notif.created_at) : new Date(),
        read: notif.read || false,
      }));
      setNotifications(mappedNotifications);
      return mappedNotifications;
    } catch (error) {
      // Error log removed
      return [];
    }
  }, [token]);

  /**
   * Marcar notificación como leída
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!token) {
      // Warning log removed
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
      // Error log removed
      return false;
    }
  }, [token]);

  /**
   * Marcar todas las notificaciones como leídas
   */
  const markAllAsRead = useCallback(async () => {
    if (!token) {
      // Warning log removed
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
      // Error log removed
      return false;
    }
  }, [token]);

  /**
   * Limpiar notificaciones
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Este useEffect se eliminó para evitar llamadas duplicadas
  // La inicialización se maneja desde App.tsx

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
