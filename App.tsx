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

function AppContent() {
  const { isLoading, isInitialized, user, token } = useAuth();
  const { initialize, registerToken } = usePushNotifications();

  // Inicializar notificaciones push
  React.useEffect(() => {
    if (isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Registrar token cuando el usuario se autentica
  React.useEffect(() => {
    if (user && token && isInitialized) {
      registerToken();
    }
  }, [user, token, isInitialized, registerToken]);

  // Mostrar pantalla de carga mientras se inicializa la autenticación
  if (!isInitialized || isLoading) {
    return <AuthLoadingScreen message="Inicializando aplicación..." />;
  }

  return (
    <NavigationContainer>
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


