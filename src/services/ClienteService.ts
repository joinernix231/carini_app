import API, { authHeaders } from './api';
import { Cliente } from '../types/cliente/cliente';
import { PaginationData } from '../components/PaginationControls';
import { BaseResponse } from '../types/BaseResponse';

export interface ClientesResponse extends BaseResponse {
    data: Cliente[];
}

export interface CreateClientePayload {
    identification: string;
    name: string;
    address: string | null;
    email: string | null;
    phone?: string | null;
}

export interface UpdateClientePayload {
    identification?: string;
    name?: string;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
}


async function getAll(
    token: string,
    page = 1,
    filters?: string
): Promise<ClientesResponse> {
    let url = `/api/clients?page=${page}`;
    if (filters) url += `&filters=${encodeURIComponent(filters)}`;

    const res = await API.get(url, authHeaders(token));
    return res.data.data as ClientesResponse;
}

async function getById(id: number, token: string): Promise<Cliente> {
    const res = await API.get(`/api/clients/${id}`, authHeaders(token));
    return res.data.data;
}

async function create(payload: CreateClientePayload, token: string): Promise<Cliente> {
    const res = await API.post('/api/clients', payload, authHeaders(token));
    return res.data.data;
}

async function update(id: number, payload: UpdateClientePayload, token: string): Promise<Cliente> {
    const res = await API.put(`/api/clients/${id}`, payload, authHeaders(token));
    return res.data.data;
}

async function remove(id: number, token: string): Promise<void> {
    await API.delete(`/api/clients/${id}`, authHeaders(token));
}

async function changeStatus(id: number, status: 'active' | 'inactive', token: string): Promise<Cliente> {
    const res = await API.put(`/api/clients/${id}/status`, { status }, authHeaders(token));
    return res.data.data;
}

function mapToPaginationData(response: ClientesResponse): PaginationData {
    return {
        current_page: response.current_page,
        last_page: response.last_page,
        from: response.from,
        to: response.to,
        total: response.total,
        per_page: response.per_page,
    };
}

export const ClienteService = {
    getAll,
    getById,
    create,
    update,
    remove,
    changeStatus,
    mapToPaginationData,
};

// Interfaces para el dashboard del cliente
export interface ClienteDashboardStats {
    equiposCount: number;
    mantenimientosPendientes: number;
    mantenimientosCompletados: number;
    mantenimientosEnProceso: number;
}

export interface ClienteEquipo {
    id: string;
    name: string;
    tipo_equipo: string;
    serial?: string;
    model?: string;
    address?: string;
    estado?: string;
    ultimoMantenimiento?: string;
}

export interface ClienteMantenimiento {
    id: string;
    device: {
        model: string;
        serial: string;
    };
    type: string;
    status: string;
    created_at: string;
    description?: string;
    priority?: string;
}

// Métodos específicos para el dashboard del cliente
export class ClienteDashboardService {

    /**
     * Obtiene los equipos del cliente
     */
    static async getEquipos(token: string): Promise<ClienteEquipo[]> {
        try {
            const response = await API.get('/api/cliente/equipos', authHeaders(token));
            return response.data;
        } catch (error: any) {
            // Error log removed
            throw new Error(error.response?.data?.message || 'Error obteniendo equipos del cliente');
        }
    }

    /**
     * Obtiene los mantenimientos del cliente
     */
    static async getMantenimientos(token: string): Promise<ClienteMantenimiento[]> {
        try {
            console.log('🔍 ClienteDashboardService - Obteniendo mantenimientos del cliente');
            const response = await API.get('/api/cliente/mantenimientos', authHeaders(token));
            // Log removed
            return response.data;
        } catch (error: any) {
            // Error log removed
            throw new Error(error.response?.data?.message || 'Error obteniendo mantenimientos del cliente');
        }
    }


    /**
     * Obtiene notificaciones del cliente
     */
    static async getNotificaciones(token: string): Promise<any[]> {
        try {
            console.log('🔍 ClienteDashboardService - Obteniendo notificaciones');
            const response = await API.get('/api/cliente/notificaciones', authHeaders(token));
            // Log removed
            return response.data;
        } catch (error: any) {
            // Error log removed
            throw new Error(error.response?.data?.message || 'Error obteniendo notificaciones');
        }
    }
}