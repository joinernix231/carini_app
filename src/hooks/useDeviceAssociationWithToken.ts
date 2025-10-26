// src/hooks/useDeviceAssociationWithToken.ts
import { useState, useCallback } from 'react';
import { Equipo } from '../types/equipo/equipo';
import { AvailableDevicesService } from '../services/AvailableDevicesService';
import { useError } from '../context/ErrorContext';

export function useDeviceAssociationWithToken(token: string | null) {
    const { showError } = useError();
    
    const [devices, setDevices] = useState<Equipo[]>([]);
    const [loadingDevices, setLoadingDevices] = useState<boolean>(false);

    const loadDevices = useCallback(async () => {
        if (!token) {
            return;
        }

        try {
            setLoadingDevices(true);
            const devices = await AvailableDevicesService.getAvailableDevices(token);
            setDevices(devices);
        } catch (error: any) {
            // Error log removed
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
