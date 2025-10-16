import API from './api';
import { Tecnico } from '../types/tecnico/tecnico';
import { PaginationData } from '../components/PaginationControls';
import {BaseResponse} from "../types/BaseResponse";

export interface TecnicosResponse extends BaseResponse {
    data: Tecnico[];
}

export interface CreateTecnicoPayload {
    document: string;
    name: string;
    address: string | null;
    email: string | null;
    phone?: string | null;
    specialty: string;
    blood_type?: string | null;
    hire_date: string;
    contract_type: 'full_time' | 'part_time' | 'contractor';
}

export type UpdateTecnicoPayload = Partial<CreateTecnicoPayload> & {
    photo?: string | null;
    eps_pdf?: string | null;
    arl_pdf?: string | null;
    pension_pdf?: string | null;
};

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

// ✅ TecnicoService.ts
async function getAll(
    token: string,
    page = 1,
    filters?: string
): Promise<TecnicosResponse> {
    let url = `/api/technical?page=${page}`;
    if (filters) url += `&filters=${encodeURIComponent(filters)}`;

    const res = await API.get(url, authHeaders(token));
    
    return res.data.data as TecnicosResponse;
}




function mapToPaginationData(response: TecnicosResponse): PaginationData {

        return {
        current_page: response.current_page,
        last_page: response.last_page,
        from: response.from,
        to: response.to,
        total: response.total,
        per_page: response.per_page,
        next_page_url: response.next_page_url,
        prev_page_url: response.prev_page_url,
    };
}

async function getOne(id: number, token: string): Promise<Tecnico> {
    const res = await API.get(`/api/technical/${id}`, authHeaders(token));
    return res.data.data ?? res.data;
}

async function create(payload: CreateTecnicoPayload, token: string): Promise<Tecnico> {
    const res = await API.post('/api/technical', payload, authHeaders(token));
    return res.data.data ?? res.data;
}

async function update(id: number, payload: UpdateTecnicoPayload, token: string): Promise<Tecnico> {
    const res = await API.put(`/api/technical/${id}`, payload, authHeaders(token));
    return res.data.data ?? res.data;
}

async function remove(id: number, token: string): Promise<void> {
    await API.delete(`/api/technical/${id}`, authHeaders(token));
}

async function changeStatus(id: number, status: 'active' | 'inactive', token: string): Promise<Tecnico> {
    const res = await API.put(`/api/technical/${id}/status`, { status }, authHeaders(token));
    return res.data.data ?? res.data;
}


export interface AvailableTechnician {
    id: number;
    user_id: number;
    document: string;
    phone: string;
    address: string;
    status: string;
    specialty?: string;
    blood_type?: string;
    contract_type?: 'full_time' | 'part_time' | 'contractor';
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
}

export interface AvailableTechniciansResponse {
    success: boolean;
    message: string;
    data: AvailableTechnician[];
}

async function getAvailableTechnicians(
    token: string,
    date?: string,
    shift?: 'AM' | 'PM'
): Promise<AvailableTechnician[]> {
    try {
        let url = '/api/availableTechnicians';
        const params = new URLSearchParams();
        
        if (date) params.append('date', date);
        if (shift) params.append('shift', shift);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await API.get(url, authHeaders(token));
        return response.data.data || [];
    } catch (error: any) {
        console.error('Error fetching available technicians:', error);
        throw error;
    }
}

export const TecnicoService = {
    getAll,
    mapToPaginationData,
    getOne,
    create,
    update,
    remove,
    changeStatus,
    getAvailableTechnicians,
};

