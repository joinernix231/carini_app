// src/services/EquipoService.ts
import API from './api';
import { Equipo, CreateEquipoPayload, ImageUploadResponse } from '../types/equipo/equipo';
import { PaginationData } from '../components/PaginationControls';
import { BaseResponse } from '../types/BaseResponse';

export interface EquiposResponse extends BaseResponse {
    data: Equipo[];
}

const authHeaders = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
});

async function getAll(
    token: string,
    page = 1,
    filters?: string,
    perPage = 20
): Promise<EquiposResponse> {
    let url = `/api/devices?page=${page}&per_page=${perPage}`;
    if (filters) url += `&filters=${encodeURIComponent(filters)}`;

    const res = await API.get(url, authHeaders(token));
    const response = res.data.data as EquiposResponse;
    
    // Mapear pdf_url a PDF para cada equipo en la lista
    if (response.data) {
        response.data = response.data.map(equipo => ({
            ...equipo,
            PDF: equipo.pdf_url,
        }));
    }
    
    return response;
}

function mapToPaginationData(response: EquiposResponse): PaginationData {
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

async function getOne(id: number, token: string): Promise<Equipo> {
    const res = await API.get(`/api/devices/${id}`, authHeaders(token));
    const equipo = res.data.data ?? res.data;
    
    // Mapear pdf_url del servidor a PDF para el frontend
    return {
        ...equipo,
        PDF: equipo.pdf_url,
    };
}

async function create(payload: CreateEquipoPayload, token: string): Promise<Equipo> {
    // Transformar PDF a pdf_url para el servidor
    const serverPayload = {
        ...payload,
        pdf_url: payload.PDF,
    };
    delete serverPayload.PDF; // Eliminar el campo PDF original
    
    const res = await API.post('/api/devices', serverPayload, authHeaders(token));
    return res.data.data ?? res.data;
}

async function update(id: number, payload: Partial<CreateEquipoPayload>, token: string): Promise<Equipo> {
    // Transformar PDF a pdf_url para el servidor
    const serverPayload = {
        ...payload,
        pdf_url: payload.PDF,
    };
    delete serverPayload.PDF; // Eliminar el campo PDF original
    
    const res = await API.put(`/api/devices/${id}`, serverPayload, authHeaders(token));
    return res.data.data ?? res.data;
}

async function remove(id: number, token: string): Promise<void> {
    await API.delete(`/api/devices/${id}`, authHeaders(token));
}

async function changeStatus(id: number, status: 'active' | 'inactive', token: string): Promise<Equipo> {
    const res = await API.put(`/api/devices/${id}/status`, { status }, authHeaders(token));
    return res.data.data ?? res.data;
}


// Función auxiliar para construir filtros
function buildFilters(searchOptions: {
    serial?: string;
    model?: string;
    brand?: string;
    type?: string;
}): string {
    const filters: string[] = [];

    if (searchOptions.serial?.trim()) {
        filters.push(`serial|like|${searchOptions.serial.trim()}`);
    }

    if (searchOptions.model?.trim()) {
        filters.push(`model|like|${searchOptions.model.trim()}`);
    }

    if (searchOptions.brand?.trim()) {
        filters.push(`brand|like|${searchOptions.brand.trim()}`);
    }

    if (searchOptions.type?.trim()) {
        filters.push(`type|like|${searchOptions.type.trim()}`);
    }

    return filters.join(';');
}

export const EquipoService = {
    getAll,
    mapToPaginationData,
    getOne,
    create,
    update,
    remove,
    changeStatus,
    buildFilters,
};



