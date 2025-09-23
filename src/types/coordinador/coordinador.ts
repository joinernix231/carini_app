import { BaseResponse } from '../BaseResponse';

export interface CoordinadorUser {
    email: string;
    name: string;
    role: string;
}

export interface Coordinador {
    id: number;
    address?: string;
    identification?: string;
    phone?: string;
    user_id: number;
    user?: CoordinadorUser;
    name?: string;
    status?: 'active' | 'inactive';
    email?: string;
    created_at: string;
}


export interface CoordinadorResponse extends BaseResponse {
    data: Coordinador[];
}
