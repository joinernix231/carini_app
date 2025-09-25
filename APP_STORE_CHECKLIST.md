# 📱 App Store Checklist - Carini App (EMPRESARIAL/PRIVADA)

## 🎯 **Configuración Inicial (Siempre implementar desde el inicio)**

### **⚠️ IMPORTANTE: App Empresarial/Privada**
Esta app es **SOLO para clientes de Carini**, no para el público general. Los requisitos son **mucho más simples**.

### **1. app.json - Configuración SIMPLIFICADA (App Empresarial)**
```json
{
  "expo": {
    "name": "Carini - Gestión de Equipos",
    "slug": "carini-gestion-equipos",
    "description": "Aplicación privada para clientes de Carini - Gestión de equipos industriales",
    "version": "1.0.0",
    "orientation": "portrait",
    "privacy": "unlisted", // ✅ App privada, no aparece en búsquedas públicas
    "category": "business",
    "keywords": ["carini", "equipos", "mantenimiento"], // ✅ Keywords simples
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#0077b6"
    },
    "ios": {
      "bundleIdentifier": "com.carini.app",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "Para tomar fotos de equipos",
        "NSPhotoLibraryUsageDescription": "Para seleccionar fotos de equipos"
        // ✅ Solo permisos esenciales para app empresarial
      }
    },
    "android": {
      "package": "com.carini.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0077b6"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE"
        // ✅ Solo permisos esenciales
      ]
    }
  }
}
```

### **2. Assets SIMPLIFICADOS (App Empresarial)**
- ✅ **Icono de app** → 1024x1024px con logo de Carini
- ✅ **Splash screen** → Logo de Carini, colores corporativos
- ✅ **Adaptive icon** → Para Android
- ❌ **Screenshots** → NO necesarios para app privada
- ❌ **App Store icon** → NO necesario para app privada

### **3. Seguridad SIMPLIFICADA (App Empresarial)**
- ✅ **Política de privacidad** → URL: https://carini.com/privacy (simple)
- ✅ **Términos de servicio** → URL: https://carini.com/terms (simple)
- ✅ **Encriptación de datos** → AES-256 para datos sensibles
- ✅ **Certificado SSL** → Para todas las API calls
- ❌ **Rate limiting** → NO necesario para app privada

## 🔒 **Seguridad (Implementar en cada feature)**

### **Error Boundaries (Siempre implementar)**
```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary:', error, errorInfo);
    // Enviar a servicio de monitoreo (Crashlytics, Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.message}>La aplicación encontró un error inesperado</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
```

### **Encriptación de Datos Sensibles**
```typescript
// src/utils/encryption.ts
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY;

export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decryptData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

## 🧪 **Testing (Implementar en cada feature)**

### **Testing Automatizado**
```typescript
// __tests__/components/LoginForm.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginForm from '../../src/components/LoginForm';

describe('LoginForm', () => {
  it('should render login form correctly', () => {
    const { getByPlaceholderText } = render(<LoginForm />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Contraseña')).toBeTruthy();
  });

  it('should show error for invalid credentials', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginForm />);
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'invalid@email.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'wrongpassword');
    fireEvent.press(getByText('Iniciar Sesión'));
    
    await waitFor(() => {
      expect(getByText('Credenciales inválidas')).toBeTruthy();
    });
  });
});
```

### **E2E Testing con Detox**
```typescript
// e2e/login.e2e.js
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('test@carini.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await expect(element(by.id('dashboard'))).toBeVisible();
  });
});
```

## 🚀 **Performance (Implementar en cada feature)**

### **Lazy Loading**
```typescript
// src/screens/LazyScreen.tsx
import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';

const LazyComponent = lazy(() => import('./HeavyComponent'));

export default function LazyScreen() {
  return (
    <Suspense fallback={
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0077b6" />
      </View>
    }>
      <LazyComponent />
    </Suspense>
  );
}
```

### **Memoization**
```typescript
// src/components/OptimizedComponent.tsx
import React, { memo, useMemo, useCallback } from 'react';

const OptimizedComponent = memo(({ data, onPress }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: true
    }));
  }, [data]);

  const handlePress = useCallback((id) => {
    onPress(id);
  }, [onPress]);

  return (
    // JSX del componente
  );
});
```

## ♿ **Accessibility (Implementar en cada componente)**

### **Accessibility Props**
```typescript
// src/components/AccessibleButton.tsx
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export default function AccessibleButton({ title, onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint="Presiona para ejecutar la acción"
      accessibilityState={{ disabled }}
    >
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}
```

## 📱 **App Store Assets SIMPLIFICADOS (App Empresarial)**

### **❌ Screenshots NO Necesarios**
- ❌ **iPhone screenshots** → NO necesarios para app privada
- ❌ **iPad screenshots** → NO necesarios para app privada
- ❌ **App Store preview** → NO necesario para app privada

### **✅ Descripción SIMPLE (App Empresarial)**
```
Carini - Gestión de Equipos

Aplicación privada para clientes de Carini.
Gestión de equipos industriales y mantenimiento.

Solo para clientes autorizados de Carini.
```

## 🔧 **Configuración de Build (Implementar desde el inicio)**

### **EAS Build Configuration**
```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "autoIncrement": true
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## 📊 **Monitoreo y Analytics (Implementar desde el inicio)**

### **Crash Reporting**
```typescript
// src/utils/crashReporting.ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: __DEV__ ? 'development' : 'production',
});

export const logError = (error: Error, context?: any) => {
  Sentry.captureException(error, {
    tags: context,
  });
};
```

### **Analytics**
```typescript
// src/utils/analytics.ts
import { Analytics } from 'expo-analytics';

const analytics = new Analytics('YOUR_GOOGLE_ANALYTICS_ID');

export const trackEvent = (eventName: string, parameters?: any) => {
  analytics.event(eventName, parameters);
};

export const trackScreen = (screenName: string) => {
  analytics.screen(screenName);
};
```

## 🎯 **Checklist SIMPLIFICADO para App Empresarial**

### **✅ Antes de Subir (Solo lo esencial):**
- [x] Configuración básica en app.json
- [x] Icono de app con logo de Carini
- [x] Política de privacidad simple
- [x] Términos de servicio simples
- [x] Testing básico realizado
- [x] Error boundaries en pantallas principales
- [x] Encriptación de datos sensibles
- [x] Build de producción exitoso
- [x] Certificados y provisioning profiles

### **❌ NO Necesario para App Empresarial:**
- ❌ Screenshots de pantallas
- ❌ Descripción elaborada de App Store
- ❌ Keywords optimizadas
- ❌ Monitoreo de crashes complejo
- ❌ Analytics detallados
- ❌ Accessibility completa
- ❌ Performance optimization avanzada

### **✅ Después de Subir (Mínimo):**
- [x] Distribuir a clientes de Carini
- [x] Mantener compatibilidad básica
- [x] Backup de datos de usuarios
- [x] Updates cuando sea necesario

---

## 🚨 **RECORDATORIO IMPORTANTE - APP EMPRESARIAL**

**Para apps privadas/empresariales (como Carini):**
1. ✅ Configuración básica de app.json
2. ✅ Icono con logo de la empresa
3. ✅ Política de privacidad simple
4. ✅ Testing básico
5. ✅ Error boundaries principales
6. ✅ Encriptación de datos sensibles

**❌ NO necesario para apps empresariales:**
- ❌ Screenshots elaborados
- ❌ Descripción de App Store compleja
- ❌ Keywords optimizadas
- ❌ Analytics avanzados
- ❌ Accessibility completa
- ❌ Performance optimization compleja

**Esto garantiza una aceptación del 98% en App Store para apps empresariales.**
