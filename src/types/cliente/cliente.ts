import { BaseResponse } from '../BaseResponse';
import {CoordinadorUser} from "../coordinador/coordinador";

export interface Contacto {
    id: number;
    nombre_contacto: string;
    correo: string;
    telefono: string;
    direccion: string;
    cargo: string;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface Cliente {
    id: number;
    identifier: string | null;
    name: string;
    legal_representative?: string | null;
    address?: string | null;
    city?: string | null;
    department?: string | null;
    phone?: string | null;
    client_type?: 'Natural' | 'Jurídico';
    document_type?: 'CC' | 'CE' | 'CI' | 'PASS' | 'NIT';
    user_id: number;
    status?: string;
    created_at?: string | null;
    updated_at?: string | null;
    contacts?: Contacto[];
    user?: User | null;
}

export interface ClientesResponse extends BaseResponse {
    data: Cliente[];
}

export interface ClienteFormValues {
    name: string;
    identifier: string;
    email: string;
    client_type: 'Natural' | 'Jurídico';
    document_type: 'CC' | 'CE' | 'CI' | 'PASS' | 'NIT';
    city: string;
    department: string;
    address: string;
    phone: string;
    legal_representative?: string;
    contacts: Array<{
        nombre_contacto: string;
        correo: string;
        telefono: string;
        direccion: string;
        cargo: string;
    }>;
}



