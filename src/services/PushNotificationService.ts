import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import API from './api';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
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
        console.warn('⚠️ Las notificaciones push solo funcionan en dispositivos físicos');
        return false;
      }

      // Solicitar permisos
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('❌ Permisos de notificación denegados');
        return false;
      }

      // Obtener token de push
      const token = await this.getPushToken();
      if (!token) {
        console.error('❌ No se pudo obtener el token de push');
        return false;
      }

      this.pushToken = token;
      console.log('✅ Servicio de notificaciones inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando notificaciones:', error);
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
      console.error('❌ Error solicitando permisos:', error);
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
      console.error('❌ Error obteniendo token:', error);
      return null;
    }
  }

  /**
   * Registrar token en el servidor
   */
  public async registerToken(userId: number, authToken: string): Promise<boolean> {
    try {
      if (!this.pushToken) {
        console.error('❌ No hay token de push disponible');
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
        console.log('✅ Token registrado correctamente');
        return true;
      } else {
        console.error('❌ Error registrando token:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error registrando token:', error);
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
        console.log('✅ Token desregistrado correctamente');
        return true;
      } else {
        console.error('❌ Error desregistrando token:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error desregistrando token:', error);
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
        console.log('✅ Tokens obtenidos correctamente');
        return response.data.data.tokens;
      } else {
        console.error('❌ Error obteniendo tokens:', response.data.message);
        return [];
      }
    } catch (error) {
      console.error('❌ Error obteniendo tokens:', error);
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
        console.log('✅ Notificaciones obtenidas correctamente');
        return response.data.data.notifications;
      } else {
        console.error('❌ Error obteniendo notificaciones:', response.data.message);
        return [];
      }
    } catch (error) {
      console.error('❌ Error obteniendo notificaciones:', error);
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
        console.log('✅ Notificación marcada como leída');
        return true;
      } else {
        console.error('❌ Error marcando como leída:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error marcando como leída:', error);
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
        console.log('✅ Todas las notificaciones marcadas como leídas');
        return true;
      } else {
        console.error('❌ Error marcando todas como leídas:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error marcando todas como leídas:', error);
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
      // Aquí puedes manejar la notificación recibida
    });

    // Listener para notificaciones tocadas
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notificación tocada:', response);
      // Aquí puedes manejar la navegación cuando el usuario toca la notificación
    });
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
      console.log('✅ Notificación local enviada');
    } catch (error) {
      console.error('❌ Error enviando notificación local:', error);
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
      console.error('❌ Error verificando permisos:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const pushNotificationService = PushNotificationService.getInstance();
