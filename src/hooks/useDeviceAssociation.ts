// src/hooks/useDeviceAssociation.ts
import { useState, useCallback } from 'react';
import { Equipo } from '../types/equipo/equipo';
import { EquipoService } from '../services/EquipoService';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';

export function useDeviceAssociation() {
    const { token } = useAuth();
    const { showError } = useError();
    
    const [devices, setDevices] = useState<Equipo[]>([]);
    const [loadingDevices, setLoadingDevices] = useState<boolean>(false);

    const loadDevices = useCallback(async () => {
        console.log('🔍 useDeviceAssociation - loadDevices called, token:', token ? 'present' : 'missing');
        
        if (!token) {
            console.log('❌ useDeviceAssociation - No token available');
            return;
        }

        try {
            setLoadingDevices(true);
            console.log('🔍 useDeviceAssociation - Calling EquipoService.getAll with token');
            const response = await EquipoService.getAll(token, 1);
            console.log('✅ useDeviceAssociation - Devices loaded:', response.data.length);
            setDevices(response.data);
        } catch (error: any) {
            console.error('❌ useDeviceAssociation - Error cargando dispositivos:', error);
            showError(error);
        } finally {
            setLoadingDevices(false);
        }
    }, [token, showError]);

    return {
        devices,
        loadingDevices,
        loadDevices,
    };
}
