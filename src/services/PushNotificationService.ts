import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import API from './api';
import { navigate as navigateRef } from '../utils/navigationRef';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('🔔 ============================================');
    console.log('🔔 NOTIFICATION HANDLER - Notificación recibida');
    console.log('🔔 ============================================');
    console.log('🔔 Título:', notification.request.content.title);
    console.log('🔔 Cuerpo:', notification.request.content.body);
    console.log('🔔 Datos:', JSON.stringify(notification.request.content.data, null, 2));
    console.log('🔔 Trigger:', notification.request.trigger);
    console.log('🔔 Estado app: Foreground (primer plano)');
    console.log('🔔 ============================================');
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
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
  private getUserCallback: (() => { role?: string } | null) | null = null;
  private tokenRegistered: boolean = false;
  private registeringToken: boolean = false;

  private constructor() {}

  /**
   * Configurar callback para obtener el usuario actual
   */
  public setUserCallback(callback: () => { role?: string } | null) {
    this.getUserCallback = callback;
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Configurar canal de notificaciones para Android
   * ⚠️ OBLIGATORIO: Debe ejecutarse antes de obtener el token
   */
  private async setupNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notificaciones Carini',
          description: 'Canal para todas las notificaciones de la aplicación',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          showBadge: true,
          enableVibrate: true,
          enableLights: true,
        });
        console.log('✅ Canal de notificaciones configurado para Android');
      } catch (error: any) {
        console.error('❌ Error configurando canal de notificaciones:', error);
        throw error;
      }
    }
  }

  /**
   * Inicializar el servicio de notificaciones
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Inicializando servicio de notificaciones...');
      console.log('📱 Platform:', Platform.OS);
      console.log('📱 Is Device:', Device.isDevice);
      
      // Verificar si es un dispositivo físico
      if (!Device.isDevice) {
        console.warn('⚠️ No es un dispositivo físico, las notificaciones push no funcionarán');
        return false;
      }

      // ⚠️ CRÍTICO: Configurar canal ANTES de solicitar permisos (Android)
      await this.setupNotificationChannel();

      // Solicitar permisos
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('❌ Permisos de notificación denegados');
        return false;
      }

      console.log('✅ Permisos de notificación concedidos');

      // Obtener token de push
      const token = await this.getPushToken();
      if (!token) {
        console.error('❌ No se pudo obtener el token de push');
        return false;
      }

      this.pushToken = token;
      console.log('✅ Servicio de notificaciones inicializado correctamente');
      console.log('✅ Token obtenido:', token.substring(0, 30) + '...');
      return true;
    } catch (error: any) {
      console.error('❌ Error inicializando servicio de notificaciones:', error);
      console.error('Error details:', error.message || error);
      return false;
    }
  }

  /**
   * Solicitar permisos de notificación
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      console.log('🔐 Verificando permisos de notificación...');
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📋 Estado actual de permisos:', existingStatus);
      
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('📋 Solicitando permisos de notificación...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📋 Nuevo estado de permisos:', finalStatus);
      }

      const hasPermission = finalStatus === 'granted';
      if (hasPermission) {
        console.log('✅ Permisos de notificación concedidos');
      } else {
        console.error('❌ Permisos de notificación denegados');
      }
      
      return hasPermission;
    } catch (error: any) {
      console.error('❌ Error solicitando permisos:', error);
      console.error('Error details:', error.message || error);
      return false;
    }
  }

  /**
   * Obtener token de push notifications
   */
  private async getPushToken(): Promise<string | null> {
    try {
      // Intentar obtener projectId de diferentes fuentes
      let projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      // Si no está en expoConfig, intentar desde app.json
      if (!projectId) {
        // En standalone builds, puede estar en Constants.manifest
        projectId = Constants.manifest?.extra?.eas?.projectId;
      }
      
      // Si aún no está, usar el valor hardcodeado de app.json como fallback
      if (!projectId) {
        projectId = '1f589531-42a1-4b68-90c0-6ef5c6a52c96';
        console.warn('⚠️ No se encontró projectId en configuración, usando fallback');
      }

      console.log('🔔 Obteniendo token de notificaciones');
      console.log('📋 ProjectId:', projectId);
      console.log('📋 Constants.expoConfig:', Constants.expoConfig ? 'Disponible' : 'No disponible');
      console.log('📋 Constants.manifest:', Constants.manifest ? 'Disponible' : 'No disponible');
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      
      if (!tokenData || !tokenData.data) {
        console.error('❌ Token vacío o inválido recibido de Expo');
        return null;
      }
      
      console.log('✅ Token obtenido exitosamente');
      console.log('📝 Token completo:', tokenData.data);
      console.log('📝 Tipo de token:', typeof tokenData.data);
      
      return tokenData.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo token de push:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Información adicional para debug
      console.log('📋 Constants disponibles:', {
        expoConfig: !!Constants.expoConfig,
        manifest: !!Constants.manifest,
        appOwnership: Constants.appOwnership,
        executionEnvironment: Constants.executionEnvironment,
      });
      
      return null;
    }
  }

  /**
   * Registrar token en el servidor
   */
  public async registerToken(userId: number, authToken: string): Promise<boolean> {
    try {
      if (!this.pushToken) {
        console.error('❌ No hay token para registrar');
        return false;
      }

      // Evitar registrar el token múltiples veces
      if (this.tokenRegistered) {
        console.log('🔔 Token ya registrado, omitiendo registro duplicado');
        return true;
      }

      // Evitar múltiples llamadas simultáneas
      if (this.registeringToken) {
        console.log('🔔 Registro de token en progreso, esperando...');
        // Esperar un poco y verificar de nuevo
        await new Promise(resolve => setTimeout(resolve, 500));
        if (this.tokenRegistered) {
          return true;
        }
      }

      this.registeringToken = true;

      const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown-device';
      const platform = Platform.OS;

      const tokenData = {
        token: this.pushToken,
        device_id: deviceId,
        platform,
        user_id: userId,
      };

      console.log('📤 Registrando token en servidor...');
      console.log('📋 Datos del token:', {
        token: this.pushToken.substring(0, 30) + '...',
        device_id: deviceId,
        platform,
        user_id: userId,
      });

      const response = await API.post('/api/notifications/register-token', tokenData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      console.log('📥 Respuesta del servidor:', {
        status: response.status,
        success: response.data?.success,
        message: response.data?.message,
      });

      if (response.data.success) {
        console.log('✅ Token registrado exitosamente en el servidor');
        this.tokenRegistered = true;
        this.registeringToken = false;
        return true;
      } else {
        console.error('❌ El servidor respondió con success: false');
        console.error('📋 Mensaje del servidor:', response.data?.message || 'Sin mensaje');
        this.registeringToken = false;
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error registrando token en servidor:', error);
      console.error('📋 Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      
      if (error.response) {
        console.error('📋 Respuesta del servidor:', {
          status: error.response.status,
          data: error.response.data,
        });
      }
      
      this.registeringToken = false;
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
        this.tokenRegistered = false; // Reset flag al desregistrar
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
    console.log('🔔 Configurando listeners de notificaciones...');
    
    // Listener para notificaciones recibidas (app en foreground)
    const receivedListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 ============================================');
      console.log('📱 NOTIFICACIÓN RECIBIDA (Foreground)');
      console.log('📱 ============================================');
      console.log('📱 Título:', notification.request.content.title);
      console.log('📱 Cuerpo:', notification.request.content.body);
      console.log('📱 Datos:', JSON.stringify(notification.request.content.data, null, 2));
      console.log('📱 Trigger:', notification.request.trigger);
      console.log('📱 ============================================');
    });

    // Listener para notificaciones tocadas
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 ============================================');
      console.log('👆 NOTIFICACIÓN TOCADA POR USUARIO');
      console.log('👆 ============================================');
      console.log('👆 Título:', response.notification.request.content.title);
      console.log('👆 Cuerpo:', response.notification.request.content.body);
      console.log('👆 Datos:', JSON.stringify(response.notification.request.content.data, null, 2));
      console.log('👆 ============================================');
      
      // Manejar navegación cuando el usuario toca la notificación
      const data = response.notification.request.content.data;
      if (!data) {
        console.warn('⚠️ No hay datos en la notificación');
        return;
      }

      const user = this.getUserCallback?.() || null;
      const userRole = user?.role;

      // Manejar sugerencia de repuesto creada
      if (data.type === 'spare_part_suggestion_created' && data.maintenance_id) {
        const mantenimientoId = data.maintenance_id;
        if (userRole === 'cliente') {
          console.log('🧭 Navegando a detalle de mantenimiento por sugerencia de repuesto:', mantenimientoId);
          navigateRef('DetalleMantenimiento', { id: mantenimientoId });
        }
        return;
      }

      // Manejar mantenimiento asignado (para técnicos)
      if (data.type === 'maintenance_assigned' && data.maintenance_id) {
        const mantenimientoId = data.maintenance_id;
        if (userRole === 'tecnico') {
          console.log('🧭 Navegando a detalle de mantenimiento asignado:', mantenimientoId);
          navigateRef('DetalleMantenimiento', { maintenanceId: mantenimientoId });
        }
        return;
      }

      // Manejar mantenimiento asignado - requiere confirmación (para clientes)
      if (data.type === 'maintenance_assigned_requires_confirmation' && data.maintenance_id) {
        const mantenimientoId = data.maintenance_id;
        if (userRole === 'cliente') {
          console.log('🧭 Navegando a detalle de mantenimiento que requiere confirmación:', mantenimientoId);
          navigateRef('DetalleMantenimiento', { id: mantenimientoId });
        }
        return;
      }

      // Manejar mantenimiento sin confirmar (para coordinadores)
      if (data.type === 'maintenance_unconfirmed' && data.maintenance_id) {
        const mantenimientoId = data.maintenance_id;
        if (userRole === 'coordinador' || userRole === 'administrador') {
          console.log('🧭 Navegando a mantenimientos sin confirmar o detalle:', mantenimientoId);
          // Navegar a la lista de mantenimientos sin confirmar
          // Si el usuario quiere ver el detalle específico, puede navegar desde ahí
          navigateRef('MantenimientosSinConfirmar');
        }
        return;
      }

      // Manejar mantenimiento confirmado por cliente (para coordinadores)
      if (data.type === 'maintenance_confirmed' && data.maintenance_id) {
        const mantenimientoId = data.maintenance_id;
        if (userRole === 'coordinador' || userRole === 'administrador') {
          console.log('🧭 Navegando a detalle de mantenimiento confirmado:', mantenimientoId);
          navigateRef('DetalleMantenimiento', { mantenimientoId: mantenimientoId });
        }
        return;
      }

      // Manejar mantenimiento confirmado por cliente (para técnicos)
      if (data.type === 'maintenance_confirmed_by_client' && data.maintenance_id) {
        const mantenimientoId = data.maintenance_id;
        if (userRole === 'tecnico') {
          console.log('🧭 Navegando a detalle de mantenimiento confirmado (técnico):', mantenimientoId);
          navigateRef('DetalleMantenimiento', { maintenanceId: mantenimientoId });
        }
        return;
      }

      // Manejar creación de mantenimiento
      if (data.type === 'maintenance_created' && data.maintenance_id) {
        const mantenimientoId = data.maintenance_id;
        console.log('🧭 Navegando al mantenimiento:', mantenimientoId, 'para rol:', userRole);
        
        if (userRole === 'cliente') {
          navigateRef('DetalleMantenimiento', { id: mantenimientoId });
        } else if (userRole === 'coordinador') {
          navigateRef('DetalleMantenimiento', { mantenimientoId: mantenimientoId });
        } else if (userRole === 'tecnico') {
          navigateRef('DetalleMantenimiento', { maintenanceId: mantenimientoId });
        }
        return;
      }

      // Manejar navegación genérica por screen
      if (data.screen) {
        const screenParams: any = {};
        
        if (data.maintenance_id) {
          // Si el screen es 'MantenimientoDetail' o 'DetalleMantenimiento', usar el parámetro correcto según el rol
          if (data.screen === 'MantenimientoDetail' || data.screen === 'DetalleMantenimiento') {
            if (userRole === 'cliente') {
              screenParams.id = data.maintenance_id;
            } else if (userRole === 'coordinador') {
              screenParams.mantenimientoId = data.maintenance_id;
            } else if (userRole === 'tecnico') {
              screenParams.maintenanceId = data.maintenance_id;
            } else {
              // Por defecto para otros roles
              screenParams.id = data.maintenance_id;
            }
          } else {
            screenParams.id = data.maintenance_id;
          }
        }
        
        if (data.mantenimientoId) {
          screenParams.mantenimientoId = data.mantenimientoId;
        }

        // Mapear 'MantenimientoDetail' a 'DetalleMantenimiento' si es necesario
        const screenName: string = data.screen === 'MantenimientoDetail' ? 'DetalleMantenimiento' : (data.screen as string);
        console.log('🧭 Navegando a:', screenName, 'con parámetros:', screenParams);
        
        // Solo pasar parámetros si hay alguno definido
        if (Object.keys(screenParams).length > 0) {
          navigateRef(screenName, screenParams);
        } else {
          navigateRef(screenName);
        }
        return;
      }

      console.warn('⚠️ No se encontró tipo de notificación o screen para navegar');
    });

    console.log('✅ Listeners de notificaciones configurados');
    console.log('📋 Listeners activos:', {
      received: !!receivedListener,
      response: !!responseListener,
    });

    return {
      received: receivedListener,
      response: responseListener,
    };
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
