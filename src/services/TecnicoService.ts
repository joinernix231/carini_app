// src/services/TecnicoService.ts
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
}

const authHeaders = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
});

// ✅ TecnicoService.ts
async function getAll(
    token: string,
    page = 1,
    filters?: string,
    perPage = 20
): Promise<TecnicosResponse> {
    let url = `/api/technical?page=${page}&per_page=${perPage}`;
    if (filters) url += `&filters=${encodeURIComponent(filters)}`;

    const res = await API.get(url, authHeaders(token));

    // El backend devuelve: { success: true, data: { current_page, data: [...], ... }, message }
    // res.data.data es el objeto paginado => lo devolvemos como TecnicosResponse
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

async function update(id: number, payload: Partial<CreateTecnicoPayload>, token: string): Promise<Tecnico> {
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

export const TecnicoService = {
    getAll,
    mapToPaginationData,
    getOne,
    create,
    update,
    remove,
    changeStatus,
};
