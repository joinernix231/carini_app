# 📋 Documentación de Campos para Técnicos

## 🎯 **Campos Actuales en Laravel**

```php
Schema::create('technicians', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('document')->unique();
    $table->string('phone')->nullable();
    $table->string('address')->nullable();
    $table->enum('status', ['active', 'inactive'])->default('active');
    $table->timestamps();
    $table->softDeletes();
});
```

## 📝 **Campos Faltantes Necesarios (Simplificados)**

### **1. Información Personal**
```php
// Agregar a la migración existente
$table->enum('blood_type', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])->nullable();
$table->string('photo_url')->nullable();
```

### **2. Información Laboral**
```php
$table->string('specialty'); // Especialidad técnica
$table->date('hire_date'); // Fecha de contratación
$table->enum('contract_type', ['full_time', 'part_time', 'contractor'])->default('full_time');
```

### **3. Documentos PDF**
```php
$table->string('eps_document_url')->nullable();
$table->string('arl_document_url')->nullable();
$table->string('pension_document_url')->nullable();
```

## 🚀 **Migración Simplificada**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('technicians', function (Blueprint $table) {
            // Información Personal
            $table->enum('blood_type', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])->nullable()->after('address');
            $table->string('photo_url')->nullable()->after('blood_type');
            
            // Información Laboral
            $table->string('specialty')->after('photo_url');
            $table->date('hire_date')->after('specialty');
            $table->enum('contract_type', ['full_time', 'part_time', 'contractor'])->default('full_time')->after('hire_date');
            
            // Documentos PDF
            $table->string('eps_document_url')->nullable()->after('contract_type');
            $table->string('arl_document_url')->nullable()->after('eps_document_url');
            $table->string('pension_document_url')->nullable()->after('arl_document_url');
        });
    }

    public function down()
    {
        Schema::table('technicians', function (Blueprint $table) {
            $table->dropColumn([
                'blood_type', 'photo_url', 'specialty', 'hire_date', 'contract_type',
                'eps_document_url', 'arl_document_url', 'pension_document_url'
            ]);
        });
    }
};
```

## 📊 **Modelo Eloquent Simplificado**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Technician extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'document',
        'phone',
        'address',
        'status',
        'blood_type',
        'photo_url',
        'specialty',
        'hire_date',
        'contract_type',
        'eps_document_url',
        'arl_document_url',
        'pension_document_url'
    ];

    protected $casts = [
        'hire_date' => 'date'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getFullNameAttribute()
    {
        return $this->user->name ?? 'Técnico';
    }

    public function getParafiscalesAttribute()
    {
        return [
            'eps' => [
                'nombre' => 'EPS',
                'documento_url' => $this->eps_document_url
            ],
            'arl' => [
                'nombre' => 'ARL',
                'documento_url' => $this->arl_document_url
            ],
            'pension' => [
                'nombre' => 'Pensión',
                'documento_url' => $this->pension_document_url
            ]
        ];
    }
}
```

## 🔧 **API Endpoints Simplificados**

```php
// routes/api.php

Route::middleware('auth:sanctum')->group(function () {
    // Técnico endpoints
    Route::get('/technician/profile', [TechnicianController::class, 'profile']);
    Route::get('/technician/parafiscales', [TechnicianController::class, 'parafiscales']);
    Route::get('/technician/carnet', [TechnicianController::class, 'carnet']);
});
```

## 📱 **Uso en la App React Native**

Con estos campos simplificados, la app podrá:

1. **Mostrar información básica** del técnico en el carnet digital
2. **Cargar documentos PDF** reales desde las URLs
3. **Mostrar parafiscales** con documentos PDF
4. **Gestionar perfil** básico del técnico

¡Esta estructura simplificada es perfecta para empezar! 🚀
