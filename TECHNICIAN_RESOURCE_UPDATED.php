<?php

namespace App\Http\Resources\Technician;

use App\Http\Resources\User\UserResource;
use Illuminate\Http\Request;
use App\Http\Resources\BaseJsonResource;

class TechnicianResource extends BaseJsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'user_id' => $this->resource->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'document' => $this->resource->document,
            'phone' => $this->resource->phone,
            'status' => $this->resource->status,
            'address' => $this->resource->address,
            
            // Información Personal
            'blood_type' => $this->resource->blood_type,
            'photo_url' => $this->resource->photo_url,
            
            // Información Laboral
            'specialty' => $this->resource->specialty,
            'hire_date' => $this->resource->hire_date?->format('Y-m-d'),
            'contract_type' => $this->resource->contract_type,
            
            // Documentos PDF (URLs completas generadas por mutators)
            'eps_pdf_url' => $this->resource->eps_pdf_url,
            'arl_pdf_url' => $this->resource->arl_pdf_url,
            'pension_pdf_url' => $this->resource->pension_pdf_url,
            
            
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
