# 🚀 Migrar a EAS Build - Guía Completa

## ✅ Ventajas de usar EAS Build

- ✅ Expo maneja automáticamente `google-services.json`
- ✅ No necesitas configurar Gradle manualmente
- ✅ Builds más confiables y consistentes
- ✅ Manejo automático de credenciales
- ✅ Notificaciones funcionan sin configuración adicional

---

## 📋 Paso 1: Verificar que tienes EAS CLI instalado

```bash
npm install -g eas-cli
```

O verificar si ya lo tienes:

```bash
eas --version
```

Si no está instalado:

```bash
npm install -g eas-cli
```

---

## 📋 Paso 2: Iniciar sesión en Expo

```bash
eas login
```

Ingresa tus credenciales de Expo (tu cuenta es `joinernix2` según `app.json`).

---

## 📋 Paso 3: Subir Credenciales de Firebase a EAS

Este es el paso **MÁS IMPORTANTE** para que las notificaciones funcionen:

```bash
npx eas credentials
```

**Sigue estos pasos:**

1. Selecciona **Android**
2. Selecciona **Push Notifications (FCM)**
3. Selecciona **Upload google-services.json**
4. Selecciona el archivo `google-services.json` de tu proyecto (está en la raíz)
5. Confirma la subida

**✅ Una vez subido, EAS lo usará automáticamente en todos los builds.**

---

## 📋 Paso 4: Verificar Configuración de EAS

Tu `eas.json` ya está configurado correctamente:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"  // ✅ Perfecto para testing
      }
    }
  }
}
```

**No necesitas cambiar nada** en `eas.json`.

---

## 📋 Paso 5: Hacer el Build con EAS

### **Opción 1: Build Preview (Recomendado para testing)**

```bash
eas build -p android --profile preview
```

Este comando:
- ✅ Genera una APK
- ✅ Usa el perfil `preview` (más rápido)
- ✅ Distribución interna (solo para ti)

### **Opción 2: Build de Producción**

```bash
eas build -p android --profile production
```

Este comando:
- ✅ Genera un App Bundle (AAB)
- ✅ Listo para Play Store
- ✅ Optimizado para producción

---

## 📋 Paso 6: Descargar la APK

Una vez que el build termine:

1. EAS te dará un link para descargar la APK
2. O puedes verlo en: https://expo.dev/accounts/joinernix2/projects/carini/builds
3. Descarga la APK y instálala en tu dispositivo

---

## 🔄 Cambios Necesarios (Opcional)

### **Puedes eliminar archivos que ya no necesitas:**

```bash
# Estos archivos ya no son necesarios con EAS Build
# (Pero puedes mantenerlos como respaldo)
# - android/app/google-services.json (EAS lo maneja automáticamente)
# - build-apk.bat (ya no lo necesitas)
```

**⚠️ NO elimines:**
- ✅ `google-services.json` de la raíz (lo necesitas para subir credenciales)
- ✅ `eas.json` (configuración de EAS)
- ✅ `app.json` (configuración de Expo)

---

## 📝 Script de Build Actualizado (Opcional)

Puedes actualizar `package.json` para tener un comando fácil:

```json
{
  "scripts": {
    "build:apk": "eas build -p android --profile preview",
    "build:production": "eas build -p android --profile production"
  }
}
```

Luego puedes usar:

```bash
npm run build:apk
```

---

## ✅ Verificación

Después de instalar la APK generada por EAS:

1. **Abre la app**
2. **Inicia sesión**
3. **Revisa los logs:**

```bash
adb logcat | grep -i "ReactNativeJS\|🔔\|📱\|✅\|token"
```

Deberías ver:
```
✅ Token obtenido exitosamente
✅ Token registrado exitosamente en el servidor
```

---

## 🆚 Comparación: Local vs EAS Build

| Aspecto | Build Local | EAS Build |
|---------|-------------|-----------|
| Configuración | Manual (Gradle, google-services.json) | Automática |
| Tiempo | Depende de tu PC | ~15-20 minutos |
| Confiabilidad | Puede tener problemas | Muy confiable |
| Credenciales | Manuales | Automáticas |
| Notificaciones | Requiere configuración | Funciona automáticamente |

---

## 🎯 Resumen de Pasos

1. ✅ Instalar EAS CLI: `npm install -g eas-cli`
2. ✅ Iniciar sesión: `eas login`
3. ✅ Subir credenciales: `npx eas credentials` → Android → Push Notifications → Upload `google-services.json`
4. ✅ Hacer build: `eas build -p android --profile preview`
5. ✅ Descargar e instalar APK

---

## 📚 Documentación Oficial

- EAS Build: https://docs.expo.dev/build/introduction/
- Credenciales FCM: https://docs.expo.dev/push-notifications/fcm-credentials/
- EAS CLI: https://docs.expo.dev/eas-cli/

---

## 🆘 Troubleshooting

### **Error: "Not authenticated"**

```bash
eas login
```

### **Error: "No credentials found"**

```bash
npx eas credentials
# Sube el google-services.json
```

### **Error: "Build failed"**

- Revisa los logs en https://expo.dev
- Verifica que el `projectId` en `app.json` sea correcto
- Verifica que las credenciales estén subidas

---

**✨ Con EAS Build, todo es más simple y confiable. Las notificaciones funcionarán automáticamente.**

