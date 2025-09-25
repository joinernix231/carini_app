import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

export function useSmartNavigation() {
  const navigation = useNavigation();

  // Navegación segura que previene loops
  const navigate = useCallback((screen: string, params?: any) => {
    try {
      console.log(`🧭 Navegando a: ${screen}`, params);
      (navigation as any).navigate(screen, params);
    } catch (error) {
      console.error('Error en navegación:', error);
    }
  }, [navigation]);

  // Navegación con reemplazo (útil para flujos de creación)
  const navigateReplace = useCallback((screen: string, params?: any) => {
    try {
      console.log(`🔄 Reemplazando navegación a: ${screen}`, params);
      (navigation as any).replace(screen, params);
    } catch (error) {
      console.error('Error en navegación con reemplazo:', error);
    }
  }, [navigation]);

  // Navegación con reset (útil para logout o cambios de rol)
  const navigateReset = useCallback((screen: string, params?: any) => {
    try {
      console.log(`🔄 Reseteando navegación a: ${screen}`, params);
      (navigation as any).reset({
        index: 0,
        routes: [{ name: screen, params }],
      });
    } catch (error) {
      console.error('Error en navegación con reset:', error);
    }
  }, [navigation]);

  // Volver con validación
  const goBack = useCallback(() => {
    try {
      if ((navigation as any).canGoBack()) {
        console.log('⬅️ Volviendo a pantalla anterior');
        (navigation as any).goBack();
      } else {
        console.log('⚠️ No hay pantalla anterior a la que volver');
      }
    } catch (error) {
      console.error('Error al volver:', error);
    }
  }, [navigation]);

  // Volver a una pantalla específica
  const goBackTo = useCallback((screen: string) => {
    try {
      console.log(`⬅️ Volviendo a: ${screen}`);
      (navigation as any).navigate(screen);
    } catch (error) {
      console.error('Error al volver a pantalla específica:', error);
      goBack();
    }
  }, [navigation, goBack]);

  return {
    navigate,
    navigateReplace,
    navigateReset,
    goBack,
    goBackTo,
    // Exponer la navegación original para casos especiales
    navigation,
  };
}