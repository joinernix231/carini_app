// src/services/TecnicoService.ts
import API from './api';
import { Coordinador } from '../types/coordinador/coordinador';
import { PaginationData } from '../components/PaginationControls';
import {BaseResponse} from "../types/BaseResponse";

export interface CoordinadoresResponse extends BaseResponse {
    data: Coordinador[];
}

export interface CreateCoordinadorPayload {
    identification: string;
    name: string;
    address: string | null;
    email: string | null;
    phone?: string | null;
}

const authHeaders = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
});


async function getAll(
    token: string,
    page = 1,
    filters?: string,
    perPage = 20
): Promise<CoordinadoresResponse> {
    let url = `/api/coordinators?page=${page}&per_page=${perPage}`;
    if (filters) url += `&filters=${encodeURIComponent(filters)}`;

    const res = await API.get(url, authHeaders(token));

    // El backend devuelve: { success: true, data: { current_page, data: [...], ... }, message }
    // res.data.data es el objeto paginado => lo devolvemos como CoordinadoresResponse
    return res.data.data as CoordinadoresResponse;
}




function mapToPaginationData(response: CoordinadoresResponse): PaginationData {

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

async function getOne(id: number, token: string): Promise<Coordinador> {
    const res = await API.get(`/api/coordinators/${id}`, authHeaders(token));
    return res.data.data ?? res.data;
}

async function create(payload: CreateCoordinadorPayload, token: string): Promise<Coordinador> {
    const res = await API.post('/api/coordinators', payload, authHeaders(token));
    return res.data.data ?? res.data;
}

async function update(id: number, payload: Partial<CreateCoordinadorPayload>, token: string): Promise<Coordinador> {
    const res = await API.put(`/api/coordinators/${id}`, payload, authHeaders(token));
    return res.data.data ?? res.data;
}

async function remove(id: number, token: string): Promise<void> {
    await API.delete(`/api/coordinators/${id}`, authHeaders(token));
}

async function changeStatus(id: number, status: 'active' | 'inactive', token: string): Promise<Coordinador> {
    const res = await API.put(`/api/coordinator/${id}/status`, { status }, authHeaders(token));
    return res.data.data ?? res.data;
}

export const CoordinadorService = {
    getAll,
    mapToPaginationData,
    getOne,
    create,
    update,
    remove,
    changeStatus,
};
