# 🔍 Verificación: Notificaciones No Llegan

## ✅ Lo que SÍ funciona:
- ✅ Token se obtiene correctamente: `ExponentPushToken[oLOFPvKxyhYlmcuAlCv880]`
- ✅ Token se registra en el servidor: `status: 200, success: true`
- ✅ Permisos concedidos
- ✅ Canal configurado

## ❌ Lo que NO funciona:
- ❌ Cuando el backend envía notificación, no llega al dispositivo

---

## 🔍 Diagnóstico: ¿Dónde está el problema?

### **Paso 1: Verificar que el Backend envía correctamente**

En el backend Laravel, verifica que el `ExpoPushService` esté enviando correctamente:

```php
// En ExpoPushService.php, busca el método send()
public function send(array $messages): array
{
    try {
        $response = Http::withHeaders([
            'Accept' => 'application/json',
            'Accept-Encoding' => 'gzip, deflate',
            'Content-Type' => 'application/json',
        ])->post($this->apiUrl, $messages);

        // ⚠️ IMPORTANTE: Agregar logs aquí
        Log::info('Expo Push API Response', [
            'status' => $response->status(),
            'body' => $response->body(),
            'json' => $response->json(),
        ]);
        
        // ... resto del código
    }
}
```

**Qué buscar en los logs del backend:**
- ✅ Status 200 de Expo API
- ✅ Response con `status: 'ok'` para cada token
- ❌ Si hay errores como `DeviceNotRegistered` o `InvalidCredentials`

### **Paso 2: Verificar el formato del mensaje**

El backend debe enviar el mensaje con este formato EXACTO:

```php
$messages[] = [
    'to' => 'ExponentPushToken[oLOFPvKxyhYlmcuAlCv880]', // ← Token exacto
    'sound' => 'default',
    'title' => 'Título de prueba',
    'body' => 'Mensaje de prueba',
    'data' => [
        'type' => 'test',
        'id' => 123
    ],
    'priority' => 'high',
    'channelId' => 'default', // ← IMPORTANTE: Debe coincidir con el canal configurado
];
```

**⚠️ Puntos críticos:**
1. El `channelId` debe ser `'default'` (igual que en el frontend)
2. El token debe ser exactamente como está en la BD
3. El `priority` debe ser `'high'` o `'normal'`

### **Paso 3: Verificar respuesta de Expo API**

Cuando el backend envía, Expo API responde con algo como:

```json
{
  "data": [
    {
      "status": "ok",
      "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  ]
}
```

**Si ves `status: 'error'`:**
- El token es inválido
- El token expiró
- Hay problema con Expo

**Si ves `status: 'ok'`:**
- Expo recibió la notificación
- Debe llegar al dispositivo

---

## 🧪 Prueba Manual desde el Backend

### **Opción 1: Usar tinker de Laravel**

```bash
php artisan tinker
```

```php
$service = app(\App\Services\ExpoPushService::class);
$result = $service->sendToTokens(
    ['ExponentPushToken[oLOFPvKxyhYlmcuAlCv880]'], // Tu token real
    'Test Notification',
    'Esta es una notificación de prueba desde el backend'
);
dd($result);
```

### **Opción 2: Usar curl directamente a Expo API**

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '[
    {
      "to": "ExponentPushToken[oLOFPvKxyhYlmcuAlCv880]",
      "title": "Test desde curl",
      "body": "Prueba directa a Expo API",
      "sound": "default",
      "priority": "high",
      "channelId": "default",
      "data": {
        "type": "test"
      }
    }
  ]'
```

**Si esto funciona:**
- ✅ El problema está en el backend Laravel
- Revisa `ExpoPushService.php`

**Si esto NO funciona:**
- ❌ El problema está en Expo o el token
- Verifica que el token sea correcto

---

## 🔍 Verificar en el Dispositivo

### **1. Con la app en FOREGROUND (abierta):**

Cuando envíes una notificación, deberías ver en los logs:

```
🔔 ============================================
🔔 NOTIFICATION HANDLER - Notificación recibida
🔔 ============================================
🔔 Título: ...
🔔 Cuerpo: ...
```

**Si NO ves esto:**
- La notificación no está llegando al dispositivo
- Problema en Expo o en el backend

### **2. Con la app en BACKGROUND (minimizada):**

La notificación debe aparecer en el sistema de notificaciones de Android.

**Si NO aparece:**
- Verifica permisos: Configuración → Apps → Carini → Notificaciones
- Verifica que el canal esté activo

### **3. Con la app CERRADA:**

La notificación debe aparecer igual.

---

## 🐛 Problemas Comunes

### **Problema 1: Token no coincide**

**Síntoma:** Backend envía pero Expo responde con error

**Solución:**
```php
// En el backend, verifica que el token sea exacto
$token = NotificationToken::where('user_id', $userId)
    ->where('is_active', true)
    ->first()
    ->token;

// Debe ser: ExponentPushToken[...]
// NO debe tener espacios ni caracteres extra
```

### **Problema 2: Canal no coincide**

**Síntoma:** Backend envía pero no llega

**Solución:**
- Frontend usa: `channelId: 'default'`
- Backend debe enviar: `channelId: 'default'`
- Ambos deben ser exactamente iguales

### **Problema 3: Expo API rechaza la notificación**

**Síntoma:** Backend recibe error de Expo

**Solución:**
- Verifica que el token esté activo en Expo
- Algunos tokens expiran después de un tiempo
- El usuario debe volver a iniciar sesión para obtener nuevo token

### **Problema 4: Notificación llega pero no se muestra**

**Síntoma:** Los logs muestran que llegó pero no se ve

**Solución:**
- Verifica permisos del sistema
- Verifica que el canal esté activo
- Verifica que no esté en modo "No molestar"

---

## 📋 Checklist de Verificación Backend

- [ ] El token en la BD es exactamente `ExponentPushToken[...]`
- [ ] El backend envía a `https://exp.host/--/api/v2/push/send`
- [ ] El `channelId` es `'default'`
- [ ] El formato del mensaje es correcto
- [ ] Expo API responde con `status: 'ok'`
- [ ] Los logs del backend muestran respuesta exitosa

---

## 🚀 Próximos Pasos

1. **Reconstruir APK con los nuevos logs:**
   ```bash
   npm run build:apk
   ```

2. **Instalar y probar:**
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

3. **Enviar notificación desde el backend**

4. **Ver logs en tiempo real:**
   ```bash
   adb logcat | grep -i "ReactNativeJS\|🔔\|📱\|👆"
   ```

5. **Si ves los logs de notificación recibida:**
   - ✅ Funciona, solo necesitas verificar por qué no se muestra

6. **Si NO ves los logs:**
   - ❌ La notificación no está llegando
   - Verifica el backend (formato, token, Expo API)

---

**Con los nuevos logs mejorados, podrás ver exactamente si las notificaciones están llegando al dispositivo.**

