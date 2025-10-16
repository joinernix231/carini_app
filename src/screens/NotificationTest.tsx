import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { usePushNotifications } from '../hooks/usePushNotifications';
import BackButton from '../components/BackButton';

export default function NotificationTest() {
  const {
    isInitialized,
    unreadCount,
    notifications,
    sendLocalNotification,
    checkPermissions,
    registerToken,
    unregisterToken,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
  } = usePushNotifications();

  const handleSendTestNotification = async () => {
    try {
      await sendLocalNotification(
        '🔔 Notificación de Prueba',
        'Esta es una notificación de prueba del sistema de mantenimiento.',
        { type: 'test', screen: 'NotificationTest' }
      );
      Alert.alert('✅ Éxito', 'Notificación de prueba enviada');
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo enviar la notificación');
    }
  };

  const handleCheckPermissions = async () => {
    const enabled = await checkPermissions();
    Alert.alert(
      '🔔 Permisos',
      enabled ? 'Las notificaciones están habilitadas' : 'Las notificaciones están deshabilitadas'
    );
  };

  const handleRegisterToken = async () => {
    const success = await registerToken();
    Alert.alert(
      '📱 Token',
      success ? 'Token registrado correctamente' : 'No se pudo registrar el token'
    );
  };

  const handleUnregisterToken = async () => {
    const success = await unregisterToken();
    Alert.alert(
      '📱 Token',
      success ? 'Token desregistrado correctamente' : 'Error desregistrando token'
    );
  };

  const handleGetUserNotifications = async () => {
    try {
      await getUserNotifications();
      Alert.alert(
        '📱 Notificaciones',
        `Se cargaron ${notifications.length} notificaciones del servidor`
      );
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudieron cargar las notificaciones');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      Alert.alert('✅ Éxito', 'Todas las notificaciones marcadas como leídas');
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudieron marcar todas como leídas');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton style={styles.backButton} color="#000" size={24} />
        <Text style={styles.title}>Pruebas de Notificaciones</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Estado del Sistema</Text>
          <View style={styles.statusRow}>
            <MaterialIcons 
              name={isInitialized ? 'check-circle' : 'error'} 
              size={20} 
              color={isInitialized ? '#4CAF50' : '#F44336'} 
            />
            <Text style={styles.statusText}>
              {isInitialized ? 'Inicializado' : 'No inicializado'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <MaterialIcons name="notifications" size={20} color="#0077b6" />
            <Text style={styles.statusText}>
              Notificaciones no leídas: {unreadCount}
            </Text>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Acciones de Prueba</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSendTestNotification}
          >
            <MaterialIcons name="send" size={24} color="#fff" />
            <Text style={styles.actionText}>Enviar Notificación de Prueba</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleCheckPermissions}
          >
            <MaterialIcons name="security" size={24} color="#0077b6" />
            <Text style={[styles.actionText, styles.secondaryText]}>
              Verificar Permisos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleRegisterToken}
          >
            <MaterialIcons name="add-circle" size={24} color="#0077b6" />
            <Text style={[styles.actionText, styles.secondaryText]}>
              Registrar Token
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleUnregisterToken}
          >
            <MaterialIcons name="remove-circle" size={24} color="#0077b6" />
            <Text style={[styles.actionText, styles.secondaryText]}>
              Desregistrar Token
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleGetUserNotifications}
          >
            <MaterialIcons name="download" size={24} color="#0077b6" />
            <Text style={[styles.actionText, styles.secondaryText]}>
              Cargar Notificaciones
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleMarkAllAsRead}
          >
            <MaterialIcons name="done-all" size={24} color="#0077b6" />
            <Text style={[styles.actionText, styles.secondaryText]}>
              Marcar Todas como Leídas
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Información</Text>
          <Text style={styles.infoText}>
            • Las notificaciones push solo funcionan en dispositivos físicos
          </Text>
          <Text style={styles.infoText}>
            • Asegúrate de tener permisos de notificación habilitados
          </Text>
          <Text style={styles.infoText}>
            • El token se registra automáticamente al iniciar sesión
          </Text>
          <Text style={styles.infoText}>
            • Usa "Cargar Notificaciones" para obtener notificaciones del servidor
          </Text>
          <Text style={styles.infoText}>
            • Las notificaciones se sincronizan automáticamente con el backend
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0077b6',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#f0f8ff',
  },
  actionText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryText: {
    color: '#0077b6',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});
