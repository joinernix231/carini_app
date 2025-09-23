// src/services/ClienteService.ts
import API from './api';
import { Cliente, ClienteFormValues } from '../types/cliente/cliente';
import { PaginationData } from '../components/PaginationControls';
import { BaseResponse } from '../types/BaseResponse';

export interface ClientesResponse extends BaseResponse {
    data: Cliente[];
}

export interface CreateClientePayload {
    name: string;
    identifier: string;
    email?: string | null;
    client_type?: 'Natural' | 'Jurídico';
    document_type?: 'CC' | 'CE' | 'CI' | 'PASS' | 'NIT';
    city?: string | null;
    department?: string | null;
    address?: string | null;
    phone?: string | null;
    legal_representative?: string | null;
    contacts?: Array<{
        nombre_contacto: string;
        correo: string;
        telefono: string;
        direccion: string;
        cargo: string;
    }>;
}

const authHeaders = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
});

async function getAll(
    token: string,
    page = 1,
    filters?: string,
    perPage = 20
): Promise<ClientesResponse> {
    let url = `/api/clients?page=${page}&per_page=${perPage}`;
    if (filters) url += `&filters=${encodeURIComponent(filters)}`;

    const res = await API.get(url, authHeaders(token));
    return res.data.data as ClientesResponse;
}

function mapToPaginationData(response: ClientesResponse): PaginationData {
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

async function getOne(id: number, token: string): Promise<Cliente> {
    const res = await API.get(`/api/clients/${id}`, authHeaders(token));
    return res.data.data ?? res.data;
}

async function create(payload: CreateClientePayload, token: string): Promise<Cliente> {
    const res = await API.post('/api/clients', payload, authHeaders(token));
    return res.data.data ?? res.data;
}

async function update(id: number, payload: Partial<CreateClientePayload>, token: string): Promise<Cliente> {
    const res = await API.put(`/api/clients/${id}`, payload, authHeaders(token));
    return res.data.data ?? res.data;
}

async function remove(id: number, token: string): Promise<void> {
    await API.delete(`/api/clients/${id}`, authHeaders(token));
}

async function changeStatus(id: number, status: 'active' | 'inactive', token: string): Promise<Cliente> {
    const res = await API.put(`/api/clients/${id}/status`, { status }, authHeaders(token));
    return res.data.data ?? res.data;
}

// Función auxiliar para construir filtros
function buildFilters(searchOptions: {
    name?: string;
    email?: string;
    city?: string;
    identifier?: string;
    phone?: string;
}): string {
    const filters: string[] = [];

    if (searchOptions.name?.trim()) {
        filters.push(`name|like|${searchOptions.name.trim()}`);
    }

    if (searchOptions.email?.trim()) {
        filters.push(`email|like|${searchOptions.email.trim()}`);
    }

    if (searchOptions.city?.trim()) {
        filters.push(`city|like|${searchOptions.city.trim()}`);
    }

    if (searchOptions.identifier?.trim()) {
        filters.push(`identifier|like|${searchOptions.identifier.trim()}`);
    }

    if (searchOptions.phone?.trim()) {
        filters.push(`phone|like|${searchOptions.phone.trim()}`);
    }

    return filters.join(';');
}

export const ClienteService = {
    getAll,
    mapToPaginationData,
    getOne,
    create,
    update,
    remove,
    changeStatus,
    buildFilters,
};