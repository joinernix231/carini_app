import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

const { width } = Dimensions.get('window');

interface NotificationBannerProps {
  onPress?: () => void;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  onPress,
  onDismiss,
  autoHide = true,
  duration = 5000,
}) => {
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [visible, setVisible] = useState(false);
  const slideAnim = new Animated.Value(-100);

  useEffect(() => {
    // Listener para notificaciones recibidas
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Banner - Notificación recibida:', notification);
      setNotification(notification);
      showBanner();
    });

    return () => subscription.remove();
  }, []);

  const showBanner = () => {
    setVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (autoHide) {
      setTimeout(() => {
        hideBanner();
      }, duration);
    }
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setNotification(null);
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
    hideBanner();
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
    hideBanner();
  };

  if (!visible || !notification) {
    return null;
  }

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'maintenance':
        return 'build';
      case 'assignment':
        return 'assignment';
      case 'alert':
        return 'warning';
      case 'success':
        return 'check-circle';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type?: string) => {
    switch (type) {
      case 'maintenance':
        return '#FF7043';
      case 'assignment':
        return '#2196F3';
      case 'alert':
        return '#F44336';
      case 'success':
        return '#4CAF50';
      default:
        return '#0077b6';
    }
  };

  const notificationType = notification.request.content.data?.type;
  const icon = getNotificationIcon(notificationType);
  const color = getNotificationColor(notificationType);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.banner, { borderLeftColor: color }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <MaterialIcons name={icon as any} size={24} color="#fff" />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.request.content.title}
            </Text>
            <Text style={styles.body} numberOfLines={2}>
              {notification.request.content.body}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
  },
  banner: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  body: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default NotificationBanner;


