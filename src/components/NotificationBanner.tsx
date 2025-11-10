import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

interface NotificationBannerProps {
  onPress?: () => void;
  onDismiss?: () => void;
}

const { width } = Dimensions.get('window');

export default function NotificationBanner({ onPress, onDismiss }: NotificationBannerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [notification, setNotification] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Listener para notificaciones recibidas
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Banner - Notificación recibida:', notification);
      
      // Evitar duplicados y procesamiento múltiple
      if (visible || isProcessingRef.current) {
        return;
      }
      
      isProcessingRef.current = true;
      setNotification(notification);
      setVisible(true);
      
      // Animar entrada más rápido
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200, // Más rápido
        useNativeDriver: true,
      }).start();

      // Auto-dismiss después de 4 segundos
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        dismissBanner();
      }, 4000);
    });

    return () => {
      subscription.remove();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [slideAnim, visible]);

  const dismissBanner = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200, // Más rápido
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setNotification(null);
      isProcessingRef.current = false;
      onDismiss?.();
    });
  };

  const handlePress = () => {
    // Navegar según el tipo de notificación y el rol del usuario
    if (notification?.request?.content?.data) {
      const data = notification.request.content.data;
      
      // Manejar sugerencia de repuesto creada
      if (data.type === 'spare_part_suggestion_created' && data.maintenance_id) {
        const mantenimientoId = data.maintenance_id;
        
        if (user?.role === 'cliente') {
          navigation.navigate('DetalleMantenimiento' as never, { 
            id: mantenimientoId 
          } as never);
          console.log('🧭 Navegando a detalle de mantenimiento por sugerencia de repuesto:', mantenimientoId);
        }
      }
      // Manejar mantenimiento asignado (para técnicos)
      else if (data.type === 'maintenance_assigned' && data.maintenance_id) {
        const mantenimientoId = data.maintenance_id;
        
        if (user?.role === 'tecnico') {
          navigation.navigate('DetalleMantenimiento' as never, { 
            maintenanceId: mantenimientoId 
          } as never);
          console.log('🧭 Navegando a detalle de mantenimiento asignado:', mantenimientoId);
        }
      }
      // Manejar creación de mantenimiento
      else if (data.type === 'maintenance_created' && data.maintenance_id) {
        // Navegar al detalle del mantenimiento según el rol
        const mantenimientoId = data.maintenance_id;
        
        if (user?.role === 'cliente') {
          navigation.navigate('DetalleMantenimiento' as never, { 
            id: mantenimientoId 
          } as never);
        } else if (user?.role === 'coordinador') {
          navigation.navigate('DetalleMantenimiento' as never, { 
            mantenimientoId: mantenimientoId 
          } as never);
        } else if (user?.role === 'tecnico') {
          navigation.navigate('DetalleMantenimiento' as never, { 
            mantenimientoId: mantenimientoId 
          } as never);
        }
        
        console.log('🧭 Navegando al mantenimiento:', mantenimientoId, 'para rol:', user?.role);
      }
      // Manejar navegación genérica por screen
      else if (data.screen) {
        const screenParams: any = {};
        if (data.maintenance_id) {
          // Si el screen es 'MantenimientoDetail' o 'DetalleMantenimiento', usar el parámetro correcto según el rol
          if ((data.screen === 'MantenimientoDetail' || data.screen === 'DetalleMantenimiento')) {
            if (user?.role === 'tecnico') {
              screenParams.maintenanceId = data.maintenance_id;
            } else if (user?.role === 'coordinador') {
              screenParams.mantenimientoId = data.maintenance_id;
            } else if (user?.role === 'cliente') {
              screenParams.id = data.maintenance_id;
            } else {
              // Por defecto para otros roles
              screenParams.id = data.maintenance_id;
            }
          } else {
            screenParams.id = data.maintenance_id;
          }
        }
        if (data.mantenimientoId) {
          screenParams.maintenanceId = data.mantenimientoId;
        }
        
        // Mapear 'MantenimientoDetail' a 'DetalleMantenimiento' si es necesario
        const screenName = data.screen === 'MantenimientoDetail' ? 'DetalleMantenimiento' : data.screen;
        navigation.navigate(screenName as never, screenParams as never);
      }
    }
    
    onPress?.();
    dismissBanner();
  };

  if (!visible || !notification) {
    return null;
  }

  const { title, body, data } = notification.request.content;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: isDark ? '#1F2937' : '#ffffff',
          borderColor: isDark ? '#374151' : '#E5E7EB',
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="notifications"
            size={24}
            color={isDark ? '#3B82F6' : '#3B82F6'}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text
            style={[styles.title, isDark && { color: '#ffffff' }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={[styles.body, isDark && { color: '#D1D5DB' }]}
            numberOfLines={2}
          >
            {body}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={dismissBanner}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="close"
            size={20}
            color={isDark ? '#9CA3AF' : '#6B7280'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Espacio para la barra de estado
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});