// src/services/ClientDeviceService.ts
import API from './api';
import { ClientDevice, AssociateDevicePayload, AssociateDeviceResponse } from '../types/cliente/ClientDevice';

const authHeaders = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
});

export const ClientDeviceService = {
    /**
     * Obtiene los dispositivos asociados a un cliente
     */
    async getClientDevices(clientId: number, token: string): Promise<ClientDevice[]> {
        try {
            console.log('🔍 ClientDeviceService - Obteniendo dispositivos del cliente:', clientId);
            
            const response = await API.get(`/api/clients/${clientId}`, authHeaders(token));
            
            // Los dispositivos vienen en el detalle del cliente
            const clientDevices = response.data.data.client_devices || [];
            
            // Log removed
            return clientDevices;
        } catch (error: any) {
            // Error log removed
            throw new Error(error.response?.data?.message || 'Error obteniendo dispositivos del cliente');
        }
    },

    /**
     * Asocia un dispositivo a un cliente
     */
    async associateDevice(
        clientId: number, 
        payload: AssociateDevicePayload, 
        token: string
    ): Promise<AssociateDeviceResponse> {
        try {
            console.log('🔍 ClientDeviceService - Asociando dispositivo:', payload);
            
            const response = await API.post(
                `/api/admin/clients/${clientId}/devices`, 
                payload, 
                authHeaders(token)
            );
            
            // Log removed
            return response.data;
        } catch (error: any) {
            // Error log removed
            throw new Error(error.response?.data?.message || 'Error asociando dispositivo al cliente');
        }
    },

    /**
     * Desasocia un dispositivo de un cliente
     */
    async disassociateDevice(
        clientId: number, 
        deviceId: number, 
        token: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            console.log('🔍 ClientDeviceService - Desasociando dispositivo:', deviceId);
            
            const response = await API.delete(
                `/api/admin/clients/${clientId}/devices/${deviceId}`, 
                authHeaders(token)
            );
            
            // Log removed
            return response.data;
        } catch (error: any) {
            // Error log removed
            throw new Error(error.response?.data?.message || 'Error desasociando dispositivo del cliente');
        }
    },

    /**
     * Actualiza la información de un dispositivo asociado
     */
    async updateClientDevice(
        clientId: number,
        deviceId: number,
        payload: Partial<AssociateDevicePayload>,
        token: string
    ): Promise<ClientDevice> {
        try {
            console.log('🔍 ClientDeviceService - Actualizando dispositivo:', deviceId);
            
            const response = await API.put(
                `/api/clients/${clientId}/devices/${deviceId}`, 
                payload, 
                authHeaders(token)
            );
            
            // Log removed
            return response.data.data;
        } catch (error: any) {
            // Error log removed
            throw new Error(error.response?.data?.message || 'Error actualizando dispositivo del cliente');
        }
    }
};
