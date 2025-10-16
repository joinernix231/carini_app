# 🚀 Guía: Configuración de Development Build

## 🎯 **¿Por qué necesitamos un Development Build?**

- ✅ **Notificaciones Push**: Funcionan correctamente
- ✅ **Plugins Nativos**: Acceso completo a funcionalidades nativas
- ✅ **Experiencia Real**: Más cercana a la app de producción
- ✅ **Debugging Avanzado**: Mejor debugging de funcionalidades nativas

## 📱 **Opción 1: Usar tu Dispositivo Android Físico (Recomendado)**

### **Paso 1: Habilitar USB Debugging**
1. Ve a `Configuración` → `Acerca del teléfono`
2. Toca `Número de compilación` **7 veces** para activar opciones de desarrollador
3. Ve a `Configuración` → `Opciones de desarrollador`
4. Activa `Depuración USB`
5. Activa `Instalar vía USB` (si está disponible)

### **Paso 2: Conectar Dispositivo**
1. Conecta tu dispositivo Android con cable USB
2. Acepta la autorización de depuración USB cuando aparezca
3. Verifica que aparezca "Depuración USB autorizada"

### **Paso 3: Crear Development Build**
```bash
# Verificar que el dispositivo esté conectado
npx expo run:android --device

# O si quieres especificar el dispositivo
npx expo run:android --device-id [ID_DEL_DISPOSITIVO]
```

## 🖥️ **Opción 2: Usar Emulador Android**

### **Paso 1: Instalar Android Studio**
1. Descarga Android Studio desde: https://developer.android.com/studio
2. Instala Android Studio con las configuraciones por defecto
3. Abre Android Studio y ve a `Tools` → `AVD Manager`

### **Paso 2: Crear Emulador**
1. Haz clic en `Create Virtual Device`
2. Selecciona un dispositivo (ej: Pixel 6)
3. Descarga una imagen del sistema (ej: Android 13)
4. Configura el AVD y haz clic en `Finish`

### **Paso 3: Iniciar Emulador**
1. Inicia el emulador desde AVD Manager
2. Espera a que termine de cargar
3. Ejecuta el development build

### **Paso 4: Crear Development Build**
```bash
# Crear development build en el emulador
npx expo run:android
```

## ☁️ **Opción 3: EAS Build (Cloud)**

### **Paso 1: Configurar EAS CLI**
```bash
# Instalar EAS CLI globalmente
npm install -g @expo/eas-cli

# Iniciar sesión en EAS
eas login
```

### **Paso 2: Crear Development Build**
```bash
# Crear development build para Android
eas build --profile development --platform android

# Crear development build para iOS
eas build --profile development --platform ios
```

### **Paso 3: Descargar e Instalar**
1. EAS te dará un enlace para descargar el APK
2. Descarga el APK en tu dispositivo
3. Instala el APK (permite instalación de fuentes desconocidas)

## 🔧 **Configuración Adicional**

### **Variables de Entorno**
Asegúrate de que tu archivo `.env` esté configurado:
```env
API_URL=http://192.168.2.14:8500
API_TIMEOUT=10000
```

### **Configuración de Red**
- ✅ **WiFi**: Asegúrate de que tu dispositivo y computadora estén en la misma red
- ✅ **Firewall**: Permite conexiones en el puerto 8081
- ✅ **IP**: Verifica que la IP en `.env` sea correcta

## 🚀 **Comandos Útiles**

### **Verificar Dispositivos Conectados**
```bash
# Ver dispositivos Android conectados
adb devices

# Ver emuladores disponibles
emulator -list-avds
```

### **Limpiar y Reinstalar**
```bash
# Limpiar cache de Expo
npx expo start --clear

# Limpiar build de Android
cd android && ./gradlew clean && cd ..
```

### **Debugging**
```bash
# Ver logs de Android
adb logcat

# Ver logs específicos de tu app
adb logcat | grep "Expo"
```

## 📱 **Después del Development Build**

### **Ventajas que Obtienes**
- ✅ **Notificaciones Push**: Funcionan correctamente
- ✅ **Mejor Performance**: Más rápido que Expo Go
- ✅ **Plugins Nativos**: Acceso completo
- ✅ **Debugging Avanzado**: Mejor debugging

### **Cómo Usar**
1. **Instala el development build** en tu dispositivo
2. **Ejecuta tu app** desde el development build
3. **Las notificaciones push** funcionarán correctamente
4. **Hot reload** sigue funcionando para desarrollo

## 🎉 **Resultado Final**

Con el development build tendrás:
- ✅ **Notificaciones push funcionando**
- ✅ **Experiencia de desarrollo completa**
- ✅ **Sin errores de Expo Go**
- ✅ **Preparado para producción**

## 🆘 **Solución de Problemas**

### **Error: "No Android connected device"**
- Verifica que USB debugging esté habilitado
- Acepta la autorización de depuración USB
- Prueba con otro cable USB

### **Error: "Build failed"**
- Verifica que Android Studio esté instalado
- Asegúrate de tener las SDK tools correctas
- Limpia el cache: `npx expo start --clear`

### **Error: "Network request failed"**
- Verifica que la IP en `.env` sea correcta
- Asegúrate de que el servidor esté corriendo
- Verifica la conexión de red

¡Con cualquiera de estas opciones tendrás un development build funcionando y podrás probar las notificaciones push!




