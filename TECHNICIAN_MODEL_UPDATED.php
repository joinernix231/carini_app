<?php

namespace App\Models\Technician;

use App\Models\Maintenance\Maintenance;
use App\Models\User;
use Database\Factories\TechnicalFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Arr;

class Technician extends Model
{
    /** @use HasFactory<TechnicalFactory> */
    use HasFactory;

    protected $table = 'technicians';

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
        'eps_pdf_url',
        'arl_pdf_url',
        'pension_pdf_url'
    ];

    protected $casts = [
        'hire_date' => 'date'
    ];

    public static array $rules = [
        'document' => 'string|max:20',
        'phone' => 'nullable|string|max:20',
        'address' => 'nullable|string|max:255',
        'blood_type' => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        'photo_url' => 'nullable|string|max:500',
        'specialty' => 'string|max:100',
        'hire_date' => 'date',
        'contract_type' => 'in:full_time,part_time,contractor',
        'eps_pdf_url' => 'nullable|string|max:500',
        'arl_pdf_url' => 'nullable|string|max:500',
        'pension_pdf_url' => 'nullable|string|max:500'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function maintenances(): HasMany
    {
        return $this->hasMany(Maintenance::class);
    }

    /**
     * Mutator para EPS PDF URL
     */
    public function getEpsPdfUrlAttribute(): ?string
    {
        if ($value = Arr::get($this->attributes, 'eps_pdf_url'))
            return config('filesystems.disks.s3.url') . 'docs/pdfs/' . $value;
        return null;
    }

    /**
     * Mutator para ARL PDF URL
     */
    public function getArlPdfUrlAttribute(): ?string
    {
        if ($value = Arr::get($this->attributes, 'arl_pdf_url'))
            return config('filesystems.disks.s3.url') . 'docs/pdfs/' . $value;
        return null;
    }

    /**
     * Mutator para Pensión PDF URL
     */
    public function getPensionPdfUrlAttribute(): ?string
    {
        if ($value = Arr::get($this->attributes, 'pension_pdf_url'))
            return config('filesystems.disks.s3.url') . 'docs/pdfs/' . $value;
        return null;
    }

    /**
     * Obtiene el nombre completo del técnico
     */
    public function getFullNameAttribute(): string
    {
        return $this->user->name ?? 'Técnico';
    }

    /**
     * Obtiene la información de parafiscales para la app
     */
    public function getParafiscalesAttribute(): array
    {
        return [
            'eps' => [
                'nombre' => 'EPS',
                'documento_url' => $this->eps_pdf_url
            ],
            'arl' => [
                'nombre' => 'ARL',
                'documento_url' => $this->arl_pdf_url
            ],
            'pension' => [
                'nombre' => 'Pensión',
                'documento_url' => $this->pension_pdf_url
            ]
        ];
    }

    /**
     * Obtiene la información del carnet digital
     */
    public function getCarnetInfoAttribute(): array
    {
        return [
            'nombre' => $this->full_name,
            'rh' => $this->blood_type,
            'especialidad' => $this->specialty,
            'foto' => $this->photo_url,
            'numero_carnet' => 'TC-' . $this->id,
            'fecha_expedicion' => $this->hire_date?->format('Y-m-d'),
            'vigencia' => $this->hire_date?->addYear()->format('Y-m-d')
        ];
    }

    protected static function newFactory(): TechnicalFactory
    {
        return TechnicalFactory::new();
    }
}
