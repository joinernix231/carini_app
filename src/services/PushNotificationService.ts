import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import API from './api';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('🔔 Notificación recibida en primer plano:', notification);
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      // Configuración adicional para mejor visualización
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: true,
    };
  },
});

export interface PushToken {
  token: string;
  device_id: string;
  platform: string;
  user_id?: number;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private pushToken: string | null = null;

  private constructor() {}

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Inicializar el servicio de notificaciones
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Inicializando servicio de notificaciones...');
      
      // Verificar si es un dispositivo físico
      if (!Device.isDevice) {
        // Warning log removed
        return false;
      }

      // Solicitar permisos
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        // Error log removed
        return false;
      }

      // Obtener token de push
      const token = await this.getPushToken();
      if (!token) {
        // Error log removed
        return false;
      }

      this.pushToken = token;
      // Log removed
      return true;
    } catch (error) {
      // Error log removed
      return false;
    }
  }

  /**
   * Solicitar permisos de notificación
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      // Error log removed
      return false;
    }
  }

  /**
   * Obtener token de push notifications
   */
  private async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      return token.data;
    } catch (error) {
      // Error log removed
      return null;
    }
  }

  /**
   * Registrar token en el servidor
   */
  public async registerToken(userId: number, authToken: string): Promise<boolean> {
    try {
      if (!this.pushToken) {
        return false;
      }

      const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown-device';
      const platform = Platform.OS;

      const tokenData = {
        token: this.pushToken,
        device_id: deviceId,
        platform,
        user_id: userId,
      };

      console.log('📤 Registrando token en servidor:', tokenData);

      const response = await API.post('/api/notifications/register-token', tokenData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        // Log removed
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Desregistrar token del servidor
   */
  public async unregisterToken(authToken: string): Promise<boolean> {
    try {
      if (!this.pushToken) {
        return true; // No hay token que desregistrar
      }

      console.log('📤 Desregistrando token del servidor');

      const response = await API.delete('/api/notifications/unregister-token', {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { token: this.pushToken }
      });

      if (response.data.success) {
        // Log removed
        return true;
      } else {
        // Error log removed
        return false;
      }
    } catch (error) {
      // Error log removed
      return false;
    }
  }

  /**
   * Obtener tokens del usuario
   */
  public async getUserTokens(authToken: string): Promise<any[]> {
    try {
      console.log('📤 Obteniendo tokens del usuario');

      const response = await API.get('/api/notifications/user-tokens', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        // Log removed
        return response.data.data.tokens;
      } else {
        // Error log removed
        return [];
      }
    } catch (error) {
      // Error log removed
      return [];
    }
  }

  /**
   * Obtener notificaciones del usuario
   */
  public async getUserNotifications(authToken: string): Promise<any[]> {
    try {
      console.log('📤 Obteniendo notificaciones del usuario');

      const response = await API.get('/api/notifications/user-notifications', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        // Log removed
        return response.data.data.notifications;
      } else {
        // Error log removed
        return [];
      }
    } catch (error) {
      // Error log removed
      return [];
    }
  }

  /**
   * Marcar notificación como leída
   */
  public async markAsRead(notificationId: string, authToken: string): Promise<boolean> {
    try {
      console.log('📤 Marcando notificación como leída:', notificationId);

      const response = await API.put(`/api/notifications/mark-as-read/${notificationId}`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        // Log removed
        return true;
      } else {
        // Error log removed
        return false;
      }
    } catch (error) {
      // Error log removed
      return false;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  public async markAllAsRead(authToken: string): Promise<boolean> {
    try {
      console.log('📤 Marcando todas las notificaciones como leídas');

      const response = await API.put('/api/notifications/mark-all-as-read', {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        // Log removed
        return true;
      } else {
        // Error log removed
        return false;
      }
    } catch (error) {
      // Error log removed
      return false;
    }
  }

  /**
   * Configurar listeners de notificaciones
   */
  public setupNotificationListeners() {
    // Listener para notificaciones recibidas
    Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notificación recibida:', notification);
      // Solo log, no mostrar notificación adicional para evitar duplicados
    });

    // Listener para notificaciones tocadas
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notificación tocada:', response);
      
      // Aquí puedes manejar la navegación cuando el usuario toca la notificación
      const data = response.notification.request.content.data;
      if (data && data.screen) {
        // Navegar a la pantalla específica si está definida en los datos
        console.log('🧭 Navegando a:', data.screen);
      }
    });
  }

  /**
   * Mostrar notificación mejorada
   */
  private async showEnhancedNotification(title: string, body: string, data?: any) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔔 ${title}`,
          body: body,
          data: data,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Mostrar inmediatamente
      });
    } catch (error) {
      // Error log removed
    }
  }

  /**
   * Enviar notificación local (para testing)
   */
  public async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Enviar inmediatamente
      });
      // Log removed
    } catch (error) {
      // Error log removed
    }
  }

  /**
   * Obtener el token actual
   */
  public getCurrentToken(): string | null {
    return this.pushToken;
  }

  /**
   * Verificar si las notificaciones están habilitadas
   */
  public async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      // Error log removed
      return false;
    }
  }
}

// Exportar instancia singleton
export const pushNotificationService = PushNotificationService.getInstance();
