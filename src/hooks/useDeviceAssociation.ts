// src/hooks/useDeviceAssociation.ts
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Equipo } from '../types/equipo/equipo';
import { EquipoService } from '../services/EquipoService';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { logger } from '../utils/logger';

export function useDeviceAssociation() {
    const { token } = useAuth();
    const { showError } = useError();
    
    const [devices, setDevices] = useState<Equipo[]>([]);
    const [loadingDevices, setLoadingDevices] = useState<boolean>(false);
    
    // Ref para evitar llamadas duplicadas
    const loadingRef = useRef<boolean>(false);
    const mountedRef = useRef<boolean>(true);
    
    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const loadDevices = useCallback(async () => {
        // Evitar llamadas duplicadas
        if (loadingRef.current || !mountedRef.current) {
            return;
        }
        
        logger.debug('useDeviceAssociation - loadDevices called, token:', token ? 'present' : 'missing');
        
        if (!token) {
            logger.warn('useDeviceAssociation - No token available');
            return;
        }

        try {
            loadingRef.current = true;
            if (mountedRef.current) {
                setLoadingDevices(true);
            }
            
            logger.api('useDeviceAssociation - Calling EquipoService.getAll with token');
            const response = await EquipoService.getAll(token, 1);
            
            if (mountedRef.current) {
                logger.debug('useDeviceAssociation - Devices loaded:', response.data.length);
                setDevices(response.data);
            }
        } catch (error: any) {
            if (mountedRef.current) {
                logger.error('useDeviceAssociation - Error cargando dispositivos:', error);
                showError(error);
            }
        } finally {
            loadingRef.current = false;
            if (mountedRef.current) {
                setLoadingDevices(false);
            }
        }
    }, [token, showError]);

    // Memoizar el valor de retorno para evitar re-renders innecesarios
    const returnValue = useMemo(() => ({
        devices,
        loadingDevices,
        loadDevices,
    }), [devices, loadingDevices, loadDevices]);

    return returnValue;
}
