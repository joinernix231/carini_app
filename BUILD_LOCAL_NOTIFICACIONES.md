# 🔧 Configuración de Build Local para Notificaciones

## Problema Resuelto

Las notificaciones funcionaban localmente con el servidor de desarrollo, pero no funcionaban en builds de APK porque faltaba la configuración de Google Services (Firebase) en los archivos de Gradle.

## Solución Implementada

Se ha configurado el proyecto para hacer builds locales con soporte completo de notificaciones push usando Firebase Cloud Messaging (FCM).

### Cambios Realizados

1. **Plugin de Google Services agregado** (`android/build.gradle`)
   - Se agregó el plugin `com.google.gms:google-services:4.4.0` a las dependencias del buildscript

2. **Plugin aplicado en la app** (`android/app/build.gradle`)
   - Se aplicó el plugin `com.google.gms.google-services` en el módulo de la app

3. **Archivo google-services.json**
   - El archivo `google-services.json` debe estar en `android/app/` para que el plugin lo encuentre
   - El script `build-apk.bat` ahora copia automáticamente este archivo antes del build

## Cómo Hacer el Build Local

### Opción 1: Usar el script automatizado (Recomendado)

```bash
npm run build:apk
```

O directamente:

```bash
build-apk.bat
```

El script automáticamente:
1. Limpia el cache de Gradle
2. Copia `google-services.json` a `android/app/`
3. Ejecuta `expo prebuild` para regenerar el proyecto nativo
4. Vuelve a copiar `google-services.json` (porque prebuild puede sobrescribirlo)
5. Compila la APK

### Opción 2: Manual

Si prefieres hacerlo manual:

```bash
# 1. Copiar google-services.json
cp google-services.json android/app/google-services.json

# 2. Regenerar proyecto nativo
npx expo prebuild --platform android --clean

# 3. Copiar google-services.json nuevamente (prebuild puede sobrescribirlo)
cp google-services.json android/app/google-services.json

# 4. Compilar APK
cd android
./gradlew assembleDebug
```

La APK se generará en: `android/app/build/outputs/apk/debug/app-debug.apk`

## Verificación

Después de instalar la APK, verifica que las notificaciones funcionen:

1. Abre la app y verifica en los logs que se obtiene el token de notificaciones
2. Deberías ver un mensaje como: `✅ Token obtenido exitosamente: ExponentPushToken[...]`
3. No deberías ver errores de Firebase como: `Default FirebaseApp is not initialized`

## Importante

- El archivo `google-services.json` debe estar en la raíz del proyecto
- El script `build-apk.bat` lo copiará automáticamente a `android/app/` antes del build
- Si haces cambios en `expo prebuild`, asegúrate de que el archivo se copie después de prebuild
- El `google-services.json` debe estar configurado con el package name correcto: `com.carini.app`

## Notas Técnicas

- El plugin de Google Services procesa el `google-services.json` durante el build y genera los archivos necesarios para inicializar Firebase
- No necesitas inicializar Firebase manualmente en el código Kotlin/Java, Expo lo maneja automáticamente
- Las notificaciones usan `expo-notifications` que internamente usa FCM en Android

## Troubleshooting

### Error: "Default FirebaseApp is not initialized"

**Solución:** Asegúrate de que:
1. El `google-services.json` está en `android/app/` antes del build
2. El plugin de Google Services está aplicado en `android/app/build.gradle`
3. El package name en `google-services.json` coincide con `com.carini.app`

### Error: "File google-services.json is missing"

**Solución:** 
1. Verifica que el archivo existe en la raíz del proyecto
2. Ejecuta manualmente: `cp google-services.json android/app/google-services.json`
3. Vuelve a ejecutar el build

### Error: "Plugin with id 'com.google.gms.google-services' not found"

**Solución:**
1. Verifica que el plugin está en `android/build.gradle` en el buildscript dependencies
2. Verifica que `apply plugin: "com.google.gms.google-services"` está en `android/app/build.gradle`

### Error: "Task failed: configureCMakeRelWithDebInfo[arm64-v8a]" o problemas con CMake

**Problema:** Este error ocurre cuando `react-native-screens` intenta compilar código nativo con CMake y falta CMake o hay problemas con NDK en Windows.

**Solución implementada:**
1. Se limitó la arquitectura a solo `arm64-v8a` (la más común para dispositivos Android modernos)
2. Se agregó configuración de NDK en `android/app/build.gradle` para filtrar solo esta arquitectura
3. Esto evita la compilación de múltiples arquitecturas que pueden causar problemas con CMake

**Si el problema persiste:**
1. Instala CMake desde: https://cmake.org/download/ (o a través de Android Studio SDK Manager)
2. Asegúrate de tener NDK instalado en Android Studio
3. Como alternativa temporal, puedes usar `assembleDebug` en lugar de `assembleRelease` si solo necesitas probar

**Nota:** La limitación a `arm64-v8a` significa que la APK solo funcionará en dispositivos con arquitectura ARM64 (la mayoría de los dispositivos Android modernos). Si necesitas soporte para dispositivos más antiguos (ARMv7), necesitarás instalar CMake y NDK correctamente.

