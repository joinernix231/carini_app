import { BaseResponse } from '../BaseResponse';

export interface TecnicoUser {
    email: string;
    name: string;
    role: string;
}

export interface Tecnico {
    id: number;
    address?: string;
    document?: string;
    phone?: string;
    user_id: number;
    user?: TecnicoUser;
    status?: 'active' | 'inactive';
    name?: string;
    email?: string;
    created_at: string;
}

/**
 * Este es el tipo que corresponde a la respuesta paginada
 * que tu backend devuelve (current_page, last_page, data[], ...)
 */
export interface TecnicosResponse extends BaseResponse {
    data: Tecnico[];
}
