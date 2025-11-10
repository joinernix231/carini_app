// src/services/MantenimientoInformationService.ts
import API from './api';

const authHeaders = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
});

export interface MaintenanceInformation {
    id: number;
    type: string;
    date_maintenance: string | null;
    shift: string | null;
    status: string;
    value: string | null; // Cambiado a string porque viene como "1150000.00"
    description: string | null;
    observations: string | null;
    photo: string | null;
    signature_photo: string | null;
    is_paid: boolean | null;
    payment_support: string | null;
    price_support: string | null;
    spare_parts: string | null;
    started_at: string | null;
    created_at: string;
    updated_at: string;
    total_work_time: any;
    total_pause_ms: number;
    total_pause_seconds: number;
    total_pause_formatted: string;
    latitude: string | null;
    longitude: string | null;
    location: string | null; // Cambiado a string | null según el response
    // Campos de confirmación
    confirmation_required?: boolean;
    confirmed_at?: string | null;
    confirmation_deadline?: string | null;
    coordinator_notified?: boolean;
    coordinator_notified_at?: string | null;
    coordinator_called?: boolean;
    coordinator_called_at?: string | null;
    client: {
        id: number;
        identifier: string;
        name: string;
        legal_representative: string | null;
        address: string;
        city: string;
        department: string;
        phone: string;
        client_type: string;
        document_type: string;
        status: string;
        user_id: number;
        created_at: string;
        updated_at: string;
    };
    technician: {
        id: number;
        user: {
            name: string;
            email: string;
        };
        phone: string;
    } | null;
    devices: Array<{
        id: number;
        client_id: number;
        device: {
            id: number;
            model: string;
            brand: string;
            type: string;
        };
        serial: string;
        address: string;
        pivot: {
            description: string | null;
            progress_completed_indices: number[] | null;
            progress_completed_count: number | null;
            progress_total: number | null;
            progress_pct: number | null;
            progress_status: string | null;
            progress_updated_at: string | null;
        };
    }>;
    photos: Array<any>; // Array vacío según el response
    action_logs: Array<any>; // Array vacío según el response
    spare_part_suggestions: Array<any>; // Array vacío según el response
    statistics: {
        photos_count: number;
        action_logs_count: number;
        spare_part_suggestions_count: number;
        devices_count: number;
        has_location: boolean;
        is_started: boolean;
        is_completed: boolean;
        is_paid: boolean;
    };
}

export interface MaintenancePhoto {
    id: number;
    maintenance_id: number;
    client_device_id: number;
    photo: string; // Nombre del archivo (legacy)
    photo_url: string; // URL completa de S3
    photo_type: 'initial' | 'final' | 'part';
    created_at?: string;
    uploaded_at?: string;
    device?: {
        id: number;
        brand: string;
        model: string;
        serial: string;
    };
}

export const MantenimientoInformationService = {
    /**
     * Obtiene la información completa de un mantenimiento
     */
    async getMaintenanceInformation(
        maintenanceId: number,
        token: string
    ): Promise<MaintenanceInformation> {
        try {
            console.log('🔍 MantenimientoInformationService - Obteniendo información del mantenimiento:', maintenanceId);
            
            const response = await API.get(
                `/api/maintenances/${maintenanceId}/information`,
                authHeaders(token)
            );
            
            return response.data.data;
        } catch (error: any) {
            // Error log removed
            throw new Error(error.response?.data?.message || 'Error obteniendo información del mantenimiento');
        }
    },

    /**
     * Obtiene las fotos de un mantenimiento
     */
    async getMaintenancePhotos(
        maintenanceId: number,
        token: string,
        options?: {
            photo_type?: 'initial' | 'final' | 'part';
            device_id?: number;
            unpaginated?: boolean;
        }
    ): Promise<{
        photos: MaintenancePhoto[];
        count?: {
            initial: number;
            final: number;
            part: number;
            total: number;
        };
    }> {
        try {
            console.log('🔍 MantenimientoInformationService - Obteniendo fotos del mantenimiento:', maintenanceId);
            
            let url = `/api/admin/maintenances/${maintenanceId}/photos`;
            const params = new URLSearchParams();
            
            if (options?.photo_type) params.append('photo_type', options.photo_type);
            if (options?.device_id) params.append('device_id', options.device_id.toString());
            if (options?.unpaginated) params.append('unpaginated', '1');
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            
            const response = await API.get(url, authHeaders(token));
            
            return response.data.data || response.data;
        } catch (error: any) {
            // Error log removed
            throw new Error(error.response?.data?.message || 'Error obteniendo fotos del mantenimiento');
        }
    }
};

