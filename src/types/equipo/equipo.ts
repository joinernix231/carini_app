import { BaseResponse } from '../BaseResponse';

export interface Equipo {
    id: number;
    serial: string;
    model: string;
    brand: string;
    description?: string | null;
    type?: string | null;
    photo?: string | null;
    PDF?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface EquiposResponse extends BaseResponse {
    data: Equipo[];
}

export interface EquipoFormValues {
    model: string;
    brand: string;
    description: string;
    type: string;
    photo?: string | null;
    PDF?: string | null;
}

export interface CreateEquipoPayload {
    model: string;
    brand: string;
    description?: string | null;
    type?: string | null;
    photo?: string | null;
    PDF?: string | null;
}

export interface ImageUploadResponse {
    success: boolean;
    message: string;
    image_url?: string;
    image_name?: string;
}



