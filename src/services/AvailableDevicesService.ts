// src/services/AvailableDevicesService.ts
import API from './api';
import { Equipo } from '../types/equipo/equipo';

const authHeaders = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
});

export const AvailableDevicesService = {
    /**
     * Obtiene dispositivos disponibles para asociar
     * Este endpoint debe ser accesible para administradores
     */
    async getAvailableDevices(token: string): Promise<Equipo[]> {
        try {
            const response = await API.get('api/devices?unpaginated=true', authHeaders(token));
            
            console.log('🔍 AvailableDevicesService - Response structure:', JSON.stringify(response.data, null, 2));
            
            // El backend devuelve: { success: true, data: [...], message }
            let devices = response.data.data || [];
            
            // Si devices no es un array, intentar acceder a la estructura correcta
            if (!Array.isArray(devices)) {
                devices = response.data.data?.data || response.data || [];
            }
            
            // Asegurar que devices es un array
            if (!Array.isArray(devices)) {
                console.error('❌ AvailableDevicesService - devices is not an array:', devices);
                return [];
            }
            
            // Mapear pdf_url a PDF para cada equipo
            const mappedDevices = devices.map((equipo: any) => ({
                ...equipo,
                PDF: equipo.pdf_url,
            }));
            
            return mappedDevices;
        } catch (error: any) {
            console.error('❌ AvailableDevicesService - Error obteniendo dispositivos:', error);
            throw new Error(error.response?.data?.message || 'Error obteniendo dispositivos disponibles');
        }
    }
};
