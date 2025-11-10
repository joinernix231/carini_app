# 🔧 Troubleshooting: Notificaciones No Funcionan en APK

## 🔍 Problemas Comunes y Soluciones

Si las notificaciones funcionan con `npx expo start` pero NO funcionan en la APK, sigue estos pasos:

---

## ✅ **Cambios Realizados (Ya Aplicados)**

1. ✅ **Canal de notificaciones configurado** - Ahora se configura automáticamente para Android
2. ✅ **ProjectId con fallback** - Si no se encuentra, usa el valor de `app.json`
3. ✅ **Logs detallados** - Ahora hay logs completos para debug

---

## 🔍 **Paso 1: Verificar Logs en la APK**

### **Cómo ver los logs:**

**Opción 1: Usando ADB (Recomendado)**
```bash
# Conectar tu dispositivo por USB
adb logcat | grep -i "notif\|expo\|push\|token"
```

**Opción 2: Usando React Native Debugger**
```bash
# Abre la app y agita el dispositivo
# Selecciona "Debug" → "Open React Native Debugger"
```

**Opción 3: Logcat completo**
```bash
adb logcat *:E | grep -i "carini\|notif\|expo"
```

### **Qué buscar en los logs:**

**✅ Logs que DEBES ver:**
```
🔔 Inicializando servicio de notificaciones...
📱 Platform: android
📱 Is Device: true
✅ Canal de notificaciones configurado para Android
🔐 Verificando permisos de notificación...
✅ Permisos de notificación concedidos
🔔 Obteniendo token de notificaciones
✅ Token obtenido exitosamente
✅ Token obtenido: ExponentPushToken[...]
✅ Servicio de notificaciones inicializado correctamente
```

**❌ Si ves estos errores:**

1. **"No es un dispositivo físico"**
   - ✅ Normal en emulador
   - ❌ Problema si es dispositivo real

2. **"Permisos de notificación denegados"**
   - Solución: Ir a Configuración → Apps → Carini → Notificaciones → Activar

3. **"No se encontró projectId"**
   - ✅ Ya está solucionado con fallback
   - Si aún falla, verifica `app.json`

4. **"Error obteniendo token de push"**
   - Verifica que `google-services.json` esté en `android/app/`
   - Verifica que el plugin de Google Services esté en `build.gradle`

---

## 🔍 **Paso 2: Verificar Configuración**

### **1. Verificar `google-services.json`**

```bash
# Verificar que existe
ls android/app/google-services.json

# Verificar contenido
cat android/app/google-services.json | grep "com.carini.app"
```

**Debe contener:**
```json
{
  "android_client_info": {
    "package_name": "com.carini.app"
  }
}
```

### **2. Verificar `build.gradle`**

**`android/build.gradle`:**
```gradle
dependencies {
  classpath('com.google.gms:google-services:4.4.0')  // ← Debe estar
}
```

**`android/app/build.gradle`:**
```gradle
apply plugin: "com.google.gms.google-services"  // ← Debe estar
```

### **3. Verificar `AndroidManifest.xml`**

**Debe tener:**
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

---

## 🔍 **Paso 3: Probar Manualmente**

### **1. Verificar que el token se obtiene:**

Después de instalar la APK, abre la app y revisa los logs. Debes ver:
```
✅ Token obtenido: ExponentPushToken[...]
📤 Registrando token en servidor
```

### **2. Verificar que el token se registra en el backend:**

Revisa los logs del backend Laravel. Debes ver:
```
Token registrado: ExponentPushToken[...]
```

### **3. Probar envío de notificación:**

Desde el backend, envía una notificación de prueba:
```php
$expoPushService->sendToUsers(
    [1], // Tu user_id
    'Test',
    'Notificación de prueba'
);
```

---

## 🔍 **Paso 4: Problemas Específicos**

### **Problema 1: Token no se obtiene**

**Síntomas:**
- Logs muestran: "❌ No se pudo obtener el token de push"
- No hay token en los logs

**Soluciones:**

1. **Verificar `google-services.json`:**
   ```bash
   # Asegúrate de que esté en android/app/
   cp google-services.json android/app/google-services.json
   ```

2. **Limpiar y reconstruir:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run build:apk
   ```

3. **Verificar permisos de notificación:**
   - Configuración → Apps → Carini → Notificaciones → Activar

### **Problema 2: Token se obtiene pero no llegan notificaciones**

**Síntomas:**
- Logs muestran: "✅ Token obtenido"
- Token se registra en backend
- Pero no llegan notificaciones

**Soluciones:**

1. **Verificar que el backend envía correctamente:**
   ```php
   // En Laravel, verifica los logs
   Log::info('Enviando notificación', [
       'token' => $token,
       'title' => $title,
       'body' => $body
   ]);
   ```

2. **Verificar respuesta de Expo API:**
   - El backend debe recibir respuesta exitosa de `exp.host`
   - Revisa los logs del backend

3. **Verificar que el token está activo:**
   ```sql
   SELECT * FROM notification_tokens 
   WHERE token = 'ExponentPushToken[...]' 
   AND is_active = 1;
   ```

### **Problema 3: Notificaciones llegan pero no se muestran**

**Síntomas:**
- Token funciona
- Backend envía correctamente
- Pero no se muestra en el dispositivo

**Soluciones:**

1. **Verificar canal de notificaciones:**
   - Los logs deben mostrar: "✅ Canal de notificaciones configurado"
   - Si no aparece, el código nuevo lo configura automáticamente

2. **Verificar permisos del sistema:**
   - Configuración → Apps → Carini → Notificaciones
   - Asegúrate de que "Notificaciones" esté activado
   - Verifica que el canal "Notificaciones Carini" esté activado

3. **Verificar que la app no está en modo "No molestar":**
   - Configuración → Sonido → No molestar
   - Asegúrate de que la app no esté bloqueada

---

## 🧪 **Paso 5: Prueba Completa**

### **Test 1: Verificar Inicialización**

1. Instala la APK
2. Abre la app
3. Inicia sesión
4. Revisa logs con `adb logcat`
5. Debes ver: "✅ Servicio de notificaciones inicializado correctamente"

### **Test 2: Verificar Token**

1. Revisa los logs
2. Debes ver: "✅ Token obtenido: ExponentPushToken[...]"
3. Verifica en el backend que el token se registró

### **Test 3: Enviar Notificación de Prueba**

1. Desde el backend, envía una notificación
2. Debe llegar al dispositivo
3. Debe mostrarse en el sistema de notificaciones

---

## 📋 **Checklist de Verificación**

Antes de reportar un problema, verifica:

- [ ] `google-services.json` está en `android/app/`
- [ ] Plugin de Google Services está en `build.gradle`
- [ ] Permisos POST_NOTIFICATIONS está en AndroidManifest
- [ ] Permisos de notificación concedidos en el dispositivo
- [ ] Token se obtiene correctamente (revisa logs)
- [ ] Token se registra en el backend
- [ ] Backend envía correctamente a Expo API
- [ ] Canal de notificaciones está configurado (Android)
- [ ] App no está en modo "No molestar"

---

## 🆘 **Si Nada Funciona**

### **1. Reconstruir completamente:**

```bash
# Limpiar todo
cd android
./gradlew clean
rm -rf app/build
cd ..

# Limpiar cache de Expo
rm -rf .expo
rm -rf node_modules/.cache

# Reconstruir
npm run build:apk
```

### **2. Verificar versión de Expo:**

```bash
npx expo --version
# Debe ser compatible con expo-notifications
```

### **3. Verificar que el proyecto está actualizado:**

```bash
npx expo install expo-notifications expo-device expo-constants
```

### **4. Probar con un dispositivo diferente:**

- A veces problemas específicos del dispositivo
- Probar con Android 11+ (requerido para POST_NOTIFICATIONS)

---

## 📞 **Logs para Reportar Problema**

Si necesitas ayuda, proporciona estos logs:

```bash
# Logs completos de inicialización
adb logcat | grep -i "🔔\|📱\|✅\|❌\|notif\|expo\|push\|token" > logs.txt

# Logs del backend
# (Desde Laravel logs)
```

---

## ✅ **Solución Más Probable**

Basado en tu problema (funciona en desarrollo, no en APK), lo más probable es:

1. ✅ **Canal de notificaciones** - Ya está solucionado
2. ✅ **ProjectId** - Ya está solucionado con fallback
3. ⚠️ **Permisos** - Verifica en el dispositivo
4. ⚠️ **google-services.json** - Asegúrate de que esté en `android/app/`

**Sigue los pasos de verificación y revisa los logs. Los nuevos logs te dirán exactamente dónde está el problema.**

