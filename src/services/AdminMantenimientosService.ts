import API, { authHeaders } from './api';
import { BaseService } from './BaseService';

export interface AdminMaintenance {
    id: number;
    type: 'preventive' | 'corrective';
    date_maintenance: string;
    shift: string;
    status: 'pending' | 'quoted' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
    value: number | null;
    description: string | null;
    client: {
        id: number;
        name: string;
        phone: string;
        address: string;
    };
    technician: {
        id: number;
        user: {
            name: string;
            email: string;
        };
        phone: string;
    } | null;
    device: Array<{
        id: number;
        model: string;
        brand: string;
        type: string;
        serial: string;
        address: string;
    }>;
    created_at: string;
    updated_at: string;
}

export interface AdminMantenimientosResponse {
    data: AdminMaintenance[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface AdminMantenimientosParams {
    page?: number;
    per_page?: number;
    filters?: string;
    unpaginated?: boolean;
}

export class AdminMantenimientosService extends BaseService {
    /**
     * Obtiene todos los mantenimientos para el administrador
     */
    static async getMantenimientos(
        token: string,
        params: AdminMantenimientosParams = {}
    ): Promise<AdminMantenimientosResponse> {
        try {
            const queryParams = new URLSearchParams();
            
            if (params.page) {
                queryParams.append('page', params.page.toString());
            }
            
            if (params.per_page) {
                queryParams.append('per_page', params.per_page.toString());
            }
            
            if (params.filters) {
                queryParams.append('filters', params.filters);
            }
            
            if (params.unpaginated) {
                queryParams.append('unpaginated', 'true');
            }

            let url = `/api/admin/maintenances`;
            if (queryParams.toString()) {
                url += `?${queryParams.toString()}`;
            }

            const response = await API.get(url, authHeaders(token));
            return response.data;
        } catch (error: any) {
            console.error('AdminMantenimientosService: Error obteniendo mantenimientos:', error);
            throw error;
        }
    }

    /**
     * Obtiene todos los mantenimientos sin paginación
     */
    static async getAllMantenimientos(
        token: string,
        filters?: string
    ): Promise<AdminMaintenance[]> {
        const response = await this.getMantenimientos(token, { 
            unpaginated: true,
            filters
        });
        return response.data;
    }

    /**
     * Busca mantenimientos por texto
     */
    static async searchMantenimientos(
        token: string,
        searchText: string,
        page: number = 1
    ): Promise<AdminMantenimientosResponse> {
        // Construir filtros de búsqueda
        const filters = `description|like|${searchText};client.name|like|${searchText};technician.user.name|like|${searchText}`;
        return this.getMantenimientos(token, { page, filters });
    }

    /**
     * Crea un mantenimiento como administrador
     */
    static async createMantenimiento(
        token: string,
        payload: {
            client_id: number;
            type: 'preventive' | 'corrective';
            description?: string;
            photo?: string;
            client_devices: Array<{
                id: number;
                description?: string | null;
            }>;
        }
    ): Promise<{ success: boolean; data: AdminMaintenance; message: string }> {
        try {
            const response = await API.post(
                '/api/admin/maintenances',
                payload,
                authHeaders(token)
            );
            return response.data;
        } catch (error: any) {
            console.error('AdminMantenimientosService: Error creando mantenimiento:', error);
            throw error;
        }
    }
}

export default AdminMantenimientosService;

