import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    (navigationRef as any).navigate(name, params);
  } else {
    console.warn('⚠️ Navegación no está lista aún. Reintentando...');
    setTimeout(() => {
      if (navigationRef.isReady()) {
        (navigationRef as any).navigate(name, params);
      }
    }, 500);
  }
}


