# 🔔 Guía de Notificaciones Push para Builds Locales

## 📋 Resumen

Aunque estés haciendo builds locales (sin usar EAS Build de Expo), **el backend sigue funcionando igual** porque el frontend continúa usando `expo-notifications`, que genera tokens de Expo (`ExponentPushToken[...]`).

Esta guía explica cómo configurar el backend para enviar notificaciones push cuando usas builds locales standalone.

---

## 🎯 Situación Actual

### ✅ **Lo que NO cambia:**
- El frontend sigue usando `expo-notifications`
- Los tokens siguen siendo `ExponentPushToken[...]`
- El backend sigue usando **Expo Push Notifications API**
- Expo sigue funcionando como intermediario con FCM (Android) y APNs (iOS)

### 📱 **Lo que SÍ cambia:**
- Ya no dependes de EAS Build para generar la APK
- Haces el build localmente con Gradle
- El `google-services.json` debe estar en `android/app/` para que Firebase funcione

### 🔥 **IMPORTANTE: ¿Por qué necesito Firebase si uso Expo?**

**Respuesta corta:** No necesitas cambiar nada. `google-services.json` es necesario porque `expo-notifications` usa Firebase internamente en Android, pero Expo maneja todo automáticamente.

**Cómo funciona:**
1. `expo-notifications` usa `google-services.json` para conectarse a Firebase
2. Obtiene un token FCM de Firebase
3. Expo lo convierte a un token unificado: `ExponentPushToken[...]`
4. Tu backend envía ese token a Expo Push API
5. Expo convierte el token y envía la notificación a Firebase/APNs
6. El dispositivo recibe la notificación ✅

**Tu backend NO necesita saber nada de Firebase. Solo usa Expo Push API.**

👉 Ver `EXPLICACION_FIREBASE_EXPO_NOTIFICACIONES.md` para más detalles.

---

## 🔧 Configuración del Backend

### **1. Instalación de Dependencias**

```bash
composer require guzzlehttp/guzzle
```

**Nota:** No necesitas `pusher/pusher-php-server` a menos que uses Pusher para otros propósitos.

### **2. Variables de Entorno**

En tu archivo `.env` de Laravel:

```env
# Expo Push Notifications API
EXPO_PUSH_API_URL=https://exp.host/--/api/v2/push/send

# Opcional: Si tienes cuenta Expo y quieres usar tu access token
# EXPO_ACCESS_TOKEN=tu_access_token_expo
```

**Importante:** La API de Expo Push Notifications es **gratuita** hasta 100,000 notificaciones/mes y **no requiere access token** para uso básico.

---

## 📦 Estructura del Backend

### **1. Migración - Tabla `notification_tokens`**

```php
// database/migrations/xxxx_create_notification_tokens_table.php
Schema::create('notification_tokens', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('user_id');
    $table->string('token')->unique(); // ExponentPushToken[...]
    $table->string('device_id');
    $table->string('platform'); // 'ios', 'android', 'web'
    $table->string('app_version')->nullable();
    $table->string('device_model')->nullable();
    $table->string('os_version')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamp('last_used_at')->nullable();
    $table->timestamps();

    $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
    $table->index(['user_id', 'is_active']);
    $table->index('token');
});
```

### **2. Modelo - `NotificationToken.php`**

```php
// app/Models/NotificationToken.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationToken extends Model
{
    protected $fillable = [
        'user_id',
        'token',
        'device_id',
        'platform',
        'app_version',
        'device_model',
        'os_version',
        'is_active',
        'last_used_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

### **3. Servicio - `ExpoPushService.php`**

```php
// app/Services/ExpoPushService.php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\NotificationToken;

class ExpoPushService
{
    private string $apiUrl;

    public function __construct()
    {
        $this->apiUrl = env('EXPO_PUSH_API_URL', 'https://exp.host/--/api/v2/push/send');
    }

    /**
     * Enviar notificación a tokens específicos
     */
    public function sendToTokens(array $tokens, string $title, string $body, array $data = []): array
    {
        $messages = [];
        
        foreach ($tokens as $token) {
            $messages[] = [
                'to' => $token,
                'sound' => 'default',
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'priority' => 'high',
                'channelId' => 'default',
            ];
        }

        return $this->send($messages);
    }

    /**
     * Enviar notificación a usuarios específicos
     */
    public function sendToUsers(array $userIds, string $title, string $body, array $data = []): array
    {
        $tokens = NotificationToken::whereIn('user_id', $userIds)
            ->where('is_active', true)
            ->pluck('token')
            ->toArray();

        if (empty($tokens)) {
            Log::warning('No se encontraron tokens activos para los usuarios', ['user_ids' => $userIds]);
            return ['success' => false, 'message' => 'No tokens found'];
        }

        return $this->sendToTokens($tokens, $title, $body, $data);
    }

    /**
     * Enviar notificación a un rol específico
     */
    public function sendToRole(string $role, string $title, string $body, array $data = []): array
    {
        $userIds = \App\Models\User::where('role', $role)
            ->pluck('id')
            ->toArray();

        return $this->sendToUsers($userIds, $title, $body, $data);
    }

    /**
     * Enviar mensajes a Expo Push API
     */
    private function send(array $messages): array
    {
        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Accept-Encoding' => 'gzip, deflate',
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl, $messages);

            if ($response->successful()) {
                $responseData = $response->json();
                
                // Procesar respuesta
                $results = $responseData['data'] ?? [];
                $successCount = 0;
                $failedCount = 0;
                
                foreach ($results as $result) {
                    if ($result['status'] === 'ok') {
                        $successCount++;
                    } else {
                        $failedCount++;
                        Log::warning('Notificación fallida', [
                            'token' => $result['token'] ?? 'unknown',
                            'error' => $result['message'] ?? 'unknown error',
                        ]);
                        
                        // Si el token es inválido, marcarlo como inactivo
                        if (isset($result['details']['error']) && 
                            in_array($result['details']['error'], ['DeviceNotRegistered', 'InvalidCredentials'])) {
                            $this->deactivateToken($result['token'] ?? '');
                        }
                    }
                }
                
                Log::info('Notificaciones enviadas', [
                    'total' => count($messages),
                    'success' => $successCount,
                    'failed' => $failedCount,
                ]);
                
                return [
                    'success' => true,
                    'sent' => $successCount,
                    'failed' => $failedCount,
                    'results' => $results,
                ];
            }
            
            Log::error('Error al enviar notificaciones', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Error al comunicarse con Expo API',
                'status' => $response->status(),
            ];
            
        } catch (\Exception $e) {
            Log::error('Excepción al enviar notificaciones', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Desactivar token inválido
     */
    private function deactivateToken(string $token): void
    {
        NotificationToken::where('token', $token)
            ->update(['is_active' => false]);
    }
}
```

### **4. Controlador - `NotificationController.php`**

```php
// app/Http/Controllers/API/NotificationController.php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\ExpoPushService;
use App\Models\NotificationToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    protected ExpoPushService $expoPushService;

    public function __construct(ExpoPushService $expoPushService)
    {
        $this->expoPushService = $expoPushService;
    }

    /**
     * Registrar token de dispositivo
     * POST /api/notifications/register-token
     */
    public function registerToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'device_id' => 'required|string',
            'platform' => 'required|string|in:ios,android,web',
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $token = NotificationToken::updateOrCreate(
                [
                    'token' => $request->token,
                    'device_id' => $request->device_id,
                ],
                [
                    'user_id' => $request->user_id,
                    'platform' => $request->platform,
                    'app_version' => $request->app_version,
                    'device_model' => $request->device_model,
                    'os_version' => $request->os_version,
                    'is_active' => true,
                    'last_used_at' => now(),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Token registrado correctamente',
                'data' => $token,
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar token',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Desregistrar token
     * DELETE /api/notifications/unregister-token
     */
    public function unregisterToken(Request $request)
    {
        $token = $request->header('Authorization') 
            ? str_replace('Bearer ', '', $request->header('Authorization'))
            : null;

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Token de autenticación requerido',
            ], 401);
        }

        try {
            // Obtener el usuario autenticado
            $user = auth()->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado',
                ], 401);
            }

            // Desactivar todos los tokens del usuario (o específico si se envía en el body)
            $query = NotificationToken::where('user_id', $user->id);
            
            if ($request->has('token')) {
                $query->where('token', $request->token);
            }
            
            $query->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Token desregistrado correctamente',
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al desregistrar token',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Enviar notificación
     * POST /api/notifications/send
     */
    public function sendNotification(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'userIds' => 'required|array',
            'userIds.*' => 'integer|exists:users,id',
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'data' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->expoPushService->sendToUsers(
            $request->userIds,
            $request->title,
            $request->body,
            $request->data ?? []
        );

        return response()->json($result, $result['success'] ? 200 : 500);
    }
}
```

### **5. Rutas API**

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    // Notificaciones
    Route::post('/notifications/register-token', [NotificationController::class, 'registerToken']);
    Route::delete('/notifications/unregister-token', [NotificationController::class, 'unregisterToken']);
    Route::post('/notifications/send', [NotificationController::class, 'sendNotification']);
});
```

---

## 📨 Ejemplos de Uso

### **Ejemplo 1: Enviar notificación cuando se asigna un mantenimiento**

```php
// app/Http/Controllers/MantenimientoController.php
use App\Services\ExpoPushService;

class MantenimientoController extends Controller
{
    public function asignar(Request $request, Mantenimiento $mantenimiento)
    {
        // ... lógica de asignación ...
        
        // Enviar notificación al técnico
        $expoPushService = app(ExpoPushService::class);
        $expoPushService->sendToUsers(
            [$mantenimiento->tecnico_id],
            'Mantenimiento Asignado',
            "Se te ha asignado un nuevo mantenimiento: {$mantenimiento->equipo->nombre}",
            [
                'type' => 'maintenance',
                'id' => $mantenimiento->id,
                'screen' => 'MantenimientoDetail',
            ]
        );
        
        // ... resto del código ...
    }
}
```

### **Ejemplo 2: Usar Notificaciones Laravel**

```php
// app/Notifications/MantenimientoAsignado.php
<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use App\Services\ExpoPushService;

class MantenimientoAsignado extends Notification
{
    protected $mantenimiento;

    public function __construct($mantenimiento)
    {
        $this->mantenimiento = $mantenimiento;
    }

    public function via($notifiable)
    {
        return ['expo'];
    }

    public function toExpo($notifiable)
    {
        return [
            'title' => 'Mantenimiento Asignado',
            'body' => "Se te ha asignado un nuevo mantenimiento: {$this->mantenimiento->equipo->nombre}",
            'data' => [
                'type' => 'maintenance',
                'id' => $this->mantenimiento->id,
                'screen' => 'MantenimientoDetail',
            ],
        ];
    }
}
```

**Registrar el canal en `AppServiceProvider.php`:**

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Support\Facades\Notification;
use App\Services\ExpoPushService;

public function boot()
{
    Notification::extend('expo', function ($app) {
        return new ExpoPushNotificationChannel($app->make(ExpoPushService::class));
    });
}
```

---

## 🔍 Formato de Tokens

### **Tokens de Expo**

Los tokens que recibirás del frontend tienen este formato:

```
ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

**Ejemplo:**
```
ExponentPushToken[AbCdEf123456GhIjKl789012MnOpQr345678StUvWx9012]
```

Estos tokens funcionan tanto para:
- ✅ Builds con Expo Go
- ✅ Builds con EAS Build
- ✅ Builds locales standalone (tu caso)

---

## ⚠️ Diferencias Clave: Builds Locales vs EAS Build

### **Con EAS Build (antes):**
- Expo gestiona automáticamente el `google-services.json`
- No necesitas configurar nada en el proyecto local

### **Con Build Local (ahora):**
- ✅ El backend funciona **exactamente igual**
- ✅ Los tokens siguen siendo `ExponentPushToken[...]`
- ✅ El backend sigue usando Expo Push API
- ✅ Solo cambia que el build se hace localmente

**No necesitas cambiar nada en el backend** - funciona exactamente igual.

---

## 🚀 Pruebas

### **1. Probar el registro de token:**

```bash
curl -X POST https://tu-api.com/api/notifications/register-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "token": "ExponentPushToken[test123]",
    "device_id": "test-device-123",
    "platform": "android",
    "user_id": 1
  }'
```

### **2. Probar el envío de notificación:**

```bash
curl -X POST https://tu-api.com/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "userIds": [1],
    "title": "Test Notification",
    "body": "Esta es una notificación de prueba",
    "data": {
      "type": "test",
      "id": 123
    }
  }'
```

---

## 📊 Monitoreo y Logs

El servicio `ExpoPushService` ya incluye logging. Puedes ver los logs en:

```bash
tail -f storage/logs/laravel.log
```

Los logs incluyen:
- ✅ Tokens enviados exitosamente
- ⚠️ Tokens que fallaron
- 🔄 Tokens desactivados automáticamente cuando son inválidos

---

## 🔐 Seguridad

### **Validaciones implementadas:**
- ✅ Autenticación requerida (middleware `auth:sanctum`)
- ✅ Validación de datos de entrada
- ✅ Sanitización de tokens
- ✅ Rate limiting (configurar en Laravel)

### **Recomendaciones:**
1. Agregar rate limiting a las rutas de notificaciones
2. Validar que el usuario solo pueda registrar tokens para sí mismo
3. Implementar webhooks de Expo para recibir confirmaciones de entrega

---

## 📝 Resumen

### **Para Builds Locales:**

1. ✅ **El backend NO necesita cambios** - funciona igual que con EAS Build
2. ✅ Los tokens siguen siendo `ExponentPushToken[...]`
3. ✅ El backend sigue usando Expo Push Notifications API
4. ✅ Solo necesitas tener el `google-services.json` en `android/app/` para que el build funcione

### **Lo único que cambia:**
- El build se hace localmente en lugar de en EAS
- Necesitas copiar `google-services.json` manualmente antes del build

---

## 🆘 Troubleshooting

### **Error: "Token no válido"**
- Verifica que el token tenga el formato `ExponentPushToken[...]`
- Asegúrate de que el token esté activo en la base de datos

### **Error: "No se pudo enviar notificación"**
- Verifica que la API de Expo esté accesible
- Revisa los logs de Laravel para más detalles
- Verifica que los tokens estén activos (`is_active = true`)

### **Las notificaciones no llegan al dispositivo**
- Verifica que el token esté registrado correctamente
- Asegúrate de que el dispositivo tenga conexión a internet
- Verifica que el usuario haya dado permisos de notificaciones en la app

---

**✨ ¡Listo! Tu backend está configurado para enviar notificaciones push con builds locales.**

