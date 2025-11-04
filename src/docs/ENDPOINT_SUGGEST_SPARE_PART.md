# 🔧 Endpoint: Sugerir Cambio de Repuesto

## 📍 Ruta

```
POST /api/technicianMaintenances/{maintenanceId}/suggest-spare-part
```

**Autenticación:** Requerida (Bearer Token)  
**Rol:** Técnico

---

## 📥 Request Body

```json
{
  "description": "string (requerido)",
  "client_device_id": "integer (requerido)",
  "photo": "string (opcional) - nombre de la imagen subida a S3"
}
```

### Validaciones

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `description` | string | ✅ Sí | Mínimo 10 caracteres, máximo 500 |
| `client_device_id` | integer | ✅ Sí | Debe existir y estar asociado al mantenimiento |
| `photo` | string | ❌ No | Si se envía, debe ser un nombre de archivo válido |

---

## 📤 Response

### ✅ Success (200)

```json
{
  "success": true,
  "message": "Sugerencia de cambio de repuesto registrada exitosamente",
  "data": {
    "id": 1,
    "maintenance_id": 123,
    "client_device_id": 456,
    "description": "El filtro de la lavadora necesita ser cambiado debido a desgaste",
    "photo": "spare-part_1762232163853_6mmttpqy9on.jpg",
    "status": "pending",
    "created_at": "2025-01-15T10:30:00.000000Z",
    "updated_at": "2025-01-15T10:30:00.000000Z"
  }
}
```

### ❌ Error (422 - Validation Error)

```json
{
  "success": false,
  "message": "Error de validación",
  "errors": {
    "description": ["El campo descripción es requerido y debe tener al menos 10 caracteres."],
    "client_device_id": ["El equipo seleccionado no está asociado a este mantenimiento."]
  }
}
```

### ❌ Error (403 - Forbidden)

```json
{
  "success": false,
  "message": "No tienes permiso para acceder a este mantenimiento."
}
```

### ❌ Error (404 - Not Found)

```json
{
  "success": false,
  "message": "Mantenimiento no encontrado."
}
```

---

## 🗄️ Estructura de Base de Datos

### ⚠️ Nota Importante

**NO usar la tabla `maintenance_client_device`** para las sugerencias de repuesto porque:
- Es una tabla pivot para el **progreso del mantenimiento** por dispositivo
- Las sugerencias de repuesto son una **entidad diferente** con ciclo de vida propio
- Puede haber **múltiples sugerencias** por dispositivo en un mismo mantenimiento
- Requiere campos adicionales (status, coordinador, notas, etc.)

### Migration (Nueva Tabla)

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spare_part_suggestions', function (Blueprint $table) {
            $table->id();
            
            // Relación con mantenimiento
            $table->foreignId('maintenance_id')
                  ->constrained('maintenances')
                  ->onDelete('cascade');
            
            // Relación con dispositivo (debe existir en maintenance_client_device)
            $table->foreignId('client_device_id');
            
            // Validar que el dispositivo esté asociado al mantenimiento
            // Esto se hace a nivel de aplicación, no de BD
            
            // Datos de la sugerencia
            $table->text('description');
            $table->string('photo')->nullable();
            
            // Estado y gestión
            $table->enum('status', ['pending', 'approved', 'rejected', 'completed'])
                  ->default('pending');
            
            // Gestión del coordinador
            $table->text('coordinator_notes')->nullable();
            $table->foreignId('coordinator_id')->nullable()
                  ->constrained('users')
                  ->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            
            $table->timestamps();
            
            // Índices para optimización
            $table->index('maintenance_id');
            $table->index('client_device_id');
            $table->index('status');
            $table->index(['maintenance_id', 'client_device_id']);
            
            // Índice compuesto para búsquedas comunes
            $table->index(['maintenance_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spare_part_suggestions');
    }
};
```

### 🔗 Relación con `maintenance_client_device`

La validación en el backend debe verificar que el `client_device_id` esté asociado al `maintenance_id` en la tabla `maintenance_client_device`:

```php
// En el Form Request o Controller
Rule::exists('maintenance_client_device', 'client_device_id')
    ->where('maintenance_id', $maintenanceId)
```

Esto asegura que solo se puedan sugerir repuestos para dispositivos que realmente están en el mantenimiento.

---

## 📝 Modelo Laravel

### SparePartSuggestion.php

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SparePartSuggestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'maintenance_id',
        'client_device_id',
        'description',
        'photo',
        'status',
        'coordinator_notes',
        'coordinator_id',
        'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    // Relaciones
    public function maintenance(): BelongsTo
    {
        return $this->belongsTo(Maintenance::class);
    }

    public function clientDevice(): BelongsTo
    {
        return $this->belongsTo(ClientDevice::class, 'client_device_id');
    }

    public function coordinator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coordinator_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeForMaintenance($query, int $maintenanceId)
    {
        return $query->where('maintenance_id', $maintenanceId);
    }
}
```

---

## 🎯 Controller

### TechnicianMaintenanceController.php (método)

```php
/**
 * Sugerir cambio de repuesto para un mantenimiento
 *
 * @param Request $request
 * @param int $maintenanceId
 * @return JsonResponse
 */
public function suggestSparePart(Request $request, int $maintenanceId)
{
    try {
        $user = $request->user();
        
        // Verificar que el mantenimiento existe y pertenece al técnico
        $maintenance = Maintenance::where('id', $maintenanceId)
            ->where('technician_id', $user->id)
            ->firstOrFail();

        // Validar request
        $validated = $request->validate([
            'description' => 'required|string|min:10|max:500',
            'client_device_id' => [
                'required',
                'integer',
                Rule::exists('maintenance_client_device', 'client_device_id')
                    ->where('maintenance_id', $maintenanceId)
            ],
            'photo' => 'nullable|string|max:255',
        ]);

        // Crear sugerencia
        $suggestion = SparePartSuggestion::create([
            'maintenance_id' => $maintenanceId,
            'client_device_id' => $validated['client_device_id'],
            'description' => $validated['description'],
            'photo' => $validated['photo'] ?? null,
            'status' => 'pending',
        ]);

        // Opcional: Notificar al coordinador
        // $this->notifyCoordinator($suggestion);

        return response()->json([
            'success' => true,
            'message' => 'Sugerencia de cambio de repuesto registrada exitosamente',
            'data' => new SparePartSuggestionResource($suggestion),
        ], 200);

    } catch (ModelNotFoundException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Mantenimiento no encontrado o no tienes permiso para acceder a él.',
        ], 404);

    } catch (ValidationException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error de validación',
            'errors' => $e->errors(),
        ], 422);

    } catch (\Exception $e) {
        \Log::error('Error sugiriendo cambio de repuesto: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Error al procesar la solicitud. Por favor, intenta de nuevo.',
        ], 500);
    }
}
```

---

## 📋 Request Validation (Form Request)

### SuggestSparePartRequest.php

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SuggestSparePartRequest extends FormRequest
{
    public function authorize(): bool
    {
        $maintenance = $this->route('maintenanceId');
        
        // Verificar que el mantenimiento pertenece al técnico autenticado
        return Maintenance::where('id', $maintenance)
            ->where('technician_id', $this->user()->id)
            ->exists();
    }

    public function rules(): array
    {
        $maintenanceId = $this->route('maintenanceId');
        
        return [
            'description' => [
                'required',
                'string',
                'min:10',
                'max:500',
            ],
            'client_device_id' => [
                'required',
                'integer',
                Rule::exists('maintenance_client_device', 'client_device_id')
                    ->where('maintenance_id', $maintenanceId),
            ],
            'photo' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-zA-Z0-9_\-\.]+\.(jpg|jpeg|png|webp)$/i',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'description.required' => 'La descripción del repuesto es requerida.',
            'description.min' => 'La descripción debe tener al menos 10 caracteres.',
            'description.max' => 'La descripción no puede exceder 500 caracteres.',
            'client_device_id.required' => 'Debes seleccionar un equipo.',
            'client_device_id.exists' => 'El equipo seleccionado no está asociado a este mantenimiento.',
            'photo.regex' => 'El nombre de la foto no es válido.',
        ];
    }
}
```

---

## 🎨 Resource (API Resource)

### SparePartSuggestionResource.php

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SparePartSuggestionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'maintenance_id' => $this->maintenance_id,
            'client_device_id' => $this->client_device_id,
            'device' => [
                'id' => $this->clientDevice->id,
                'brand' => $this->clientDevice->device->brand,
                'model' => $this->clientDevice->device->model,
                'serial' => $this->clientDevice->serial,
            ],
            'description' => $this->description,
            'photo' => $this->photo ? asset('storage/photos/' . $this->photo) : null,
            'photo_name' => $this->photo,
            'status' => $this->status,
            'coordinator_notes' => $this->coordinator_notes,
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
```

---

## 🛣️ Ruta (API Routes)

### routes/api.php

```php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::prefix('technicianMaintenances')->group(function () {
        // ... otras rutas
        
        Route::post('/{maintenanceId}/suggest-spare-part', [
            TechnicianMaintenanceController::class, 
            'suggestSparePart'
        ])->middleware('role:technician');
    });
});
```

---

## 🔍 Consultas Adicionales Recomendadas

### 1. Obtener sugerencias de un mantenimiento

```php
// En el modelo Maintenance o Controller
public function sparePartSuggestions()
{
    return $this->hasMany(SparePartSuggestion::class);
}

// Uso
$maintenance->sparePartSuggestions()->with('clientDevice.device')->get();
```

### 2. Obtener todas las sugerencias pendientes (para coordinador)

```php
SparePartSuggestion::pending()
    ->with(['maintenance', 'clientDevice.device', 'maintenance.technician'])
    ->orderBy('created_at', 'desc')
    ->get();
```

---

## 📊 Ejemplo de Flujo Completo

### 1. Frontend envía:
```json
POST /api/technicianMaintenances/123/suggest-spare-part
{
  "description": "El filtro de la lavadora necesita ser cambiado debido a desgaste excesivo. Se recomienda cambio inmediato.",
  "client_device_id": 456,
  "photo": "spare-part_1762232163853_6mmttpqy9on.jpg"
}
```

### 2. Backend valida:
- ✅ Mantenimiento existe y pertenece al técnico
- ✅ client_device_id está asociado al mantenimiento
- ✅ Descripción cumple requisitos
- ✅ Foto (si existe) tiene formato válido

### 3. Backend guarda:
```php
SparePartSuggestion::create([
    'maintenance_id' => 123,
    'client_device_id' => 456,
    'description' => '...',
    'photo' => 'spare-part_1762232163853_6mmttpqy9on.jpg',
    'status' => 'pending',
]);
```

### 4. Backend responde:
```json
{
  "success": true,
  "message": "Sugerencia de cambio de repuesto registrada exitosamente",
  "data": { ... }
}
```

---

## 🔔 Notificaciones (Opcional)

Si quieres notificar al coordinador:

```php
// En el método suggestSparePart después de crear
$coordinator = $maintenance->coordinator; // o el coordinador asignado

if ($coordinator) {
    $coordinator->notify(new SparePartSuggestionNotification($suggestion));
}
```

---

## ✅ Checklist de Implementación

- [ ] Crear migration `spare_part_suggestions`
- [ ] Crear modelo `SparePartSuggestion`
- [ ] Crear resource `SparePartSuggestionResource`
- [ ] Crear form request `SuggestSparePartRequest`
- [ ] Agregar método `suggestSparePart` al controller
- [ ] Agregar ruta en `routes/api.php`
- [ ] Agregar relaciones en modelos relacionados
- [ ] Probar endpoint con Postman/Insomnia
- [ ] (Opcional) Implementar notificaciones

---

## 🎯 Próximos Pasos

1. **Endpoint para el Coordinador**: Ver y gestionar sugerencias
   - `GET /api/coordinator/spare-part-suggestions`
   - `PUT /api/coordinator/spare-part-suggestions/{id}/approve`
   - `PUT /api/coordinator/spare-part-suggestions/{id}/reject`

2. **Notificaciones**: Notificar al coordinador cuando se crea una sugerencia

3. **Historial**: Ver sugerencias anteriores en el detalle del mantenimiento

