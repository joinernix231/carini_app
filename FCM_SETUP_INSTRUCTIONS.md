# 🔥 Configuración de FCM para Notificaciones Push

## Problema
El error indica que Firebase no está inicializado en builds standalone:
```
Default FirebaseApp is not initialized in this process com.carini.app
```

## Solución: Configurar FCM en Firebase Console

### Paso 1: Crear/Configurar Proyecto Firebase

1. Ve a https://console.firebase.google.com/
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre sugerido: `carini-app` o `carini-notifications`

### Paso 2: Agregar App Android

1. En el dashboard de Firebase, haz clic en "Agregar app" → Android
2. **Package name**: `com.carini.app` (debe coincidir exactamente)
3. **App nickname** (opcional): `Carini App`
4. **SHA-1** (opcional para ahora): Puedes agregarlo después
5. Descarga el archivo `google-services.json`

### Paso 3: Subir Credenciales a EAS

Ejecuta en tu terminal:

```bash
npx eas credentials
```

Luego:
1. Selecciona **Android**
2. Selecciona **Push Notifications (FCM)**
3. Selecciona **Upload google-services.json**
4. Selecciona el archivo `google-services.json` que descargaste
5. Confirma la subida

### Paso 4: Reconstruir la APK

Después de subir las credenciales, reconstruye:

```bash
eas build -p android --profile preview
```

## Verificación

Una vez instalada la nueva APK, los logs deberían mostrar:
```
✅ Token obtenido exitosamente: ExponentPushToken[...]
```

En lugar del error de Firebase.

## Notas Importantes

- El `google-services.json` debe estar asociado al package `com.carini.app`
- Las credenciales se suben una vez y EAS las usa en todos los builds futuros
- No necesitas incluir `google-services.json` en tu repo local
- EAS maneja automáticamente la configuración de Firebase en el build

## Documentación Oficial

- Guía completa: https://docs.expo.dev/push-notifications/fcm-credentials/
- Firebase Console: https://console.firebase.google.com/



