import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ErrorProvider } from './src/context/ErrorContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AuthLoadingScreen from './src/components/AuthLoadingScreen';
import NotificationBanner from './src/components/NotificationBanner';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { navigationRef } from './src/utils/navigationRef';
import { pushNotificationService } from './src/services/PushNotificationService';

function AppContent() {
  const { isLoading, isInitialized, user, token } = useAuth();
  const { initialize } = usePushNotifications();

  // Configurar callback para obtener usuario en el servicio de notificaciones
  React.useEffect(() => {
    pushNotificationService.setUserCallback(() => user);
  }, [user]);

  // Inicializar notificaciones push (esto ya incluye el registro del token)
  React.useEffect(() => {
    if (isInitialized && user && token) {
      initialize();
    }
  }, [isInitialized, user, token, initialize]);

  // Mostrar pantalla de carga mientras se inicializa la autenticación
  if (!isInitialized || isLoading) {
    return <AuthLoadingScreen message="Inicializando aplicación..." />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
      <NotificationBanner />
      <StatusBar style="dark" backgroundColor="#ffffff" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ErrorProvider>
    </ThemeProvider>
  );
}


