import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { StorageService } from '../services/StorageService';
import { Tecnico, User, TecnicoResponse } from '../types/tecnico/tecnico';
import { ErrorService } from '../services/ErrorService';

export interface MeData {
  user: User;
  technician_data?: Tecnico;
  role: string;
}

export const useMe = () => {
  const [meData, setMeData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useMe - Obteniendo información del usuario...');
      
      // Obtener token del storage
      const token = await StorageService.getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log('🔑 useMe - Token obtenido:', token ? 'Token presente' : 'Sin token');
      
      const headers = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      console.log('📡 useMe - Headers generados:', headers);
      
      const response = await API.get<TecnicoResponse>('/api/me', headers);
      // Log removed

      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        const meData: MeData = {
          user: {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            policy_accepted: userData.policy_accepted,
            created_at: userData.created_at,
            updated_at: userData.updated_at
          },
          technician_data: userData.technician_data,
          role: userData.role
        };
        
        setMeData(meData);
        return meData;
      }

      throw new Error('No se encontraron datos del usuario');
    } catch (err) {
      const errorMessage = ErrorService.getErrorMessage(err);
      setError(errorMessage);
      // Error log removed
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  return {
    meData,
    loading,
    error,
    refetch: loadMe,
  };
};

export const useCarnetInfo = () => {
  const [carnetInfo, setCarnetInfo] = useState<{
    nombre: string;
    rh: string;
    especialidad: string;
    foto: string;
    numero_carnet: string;
    fecha_expedicion: string;
    telefono: string;
    direccion: string;
    tipo_contrato: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCarnetInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useCarnetInfo - Obteniendo información del carnet...');
      
      const token = await StorageService.getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const headers = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      const response = await API.get<TecnicoResponse>('/api/me', headers);
      
      if (response.data.success && response.data.data.technician_data) {
        const tecnico = response.data.data.technician_data;
        const user = response.data.data;
        
        const carnetData = {
          nombre: user.name || 'Técnico',
          rh: tecnico.blood_type || 'No especificado',
          especialidad: tecnico.specialty || 'Técnico',
          foto: tecnico.photo || '',
          numero_carnet: `${tecnico.document}`,
          fecha_expedicion: tecnico.hire_date || new Date().toISOString().split('T')[0],
          telefono: tecnico.phone || '',
          direccion: tecnico.address || '',
          tipo_contrato: tecnico.contract_type || 'full_time',
        };
        
        setCarnetInfo(carnetData);
        return carnetData;
      }

      throw new Error('No se encontraron datos del técnico');
    } catch (err) {
      const errorMessage = ErrorService.getErrorMessage(err);
      setError(errorMessage);
      // Error log removed
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCarnetInfo();
  }, [loadCarnetInfo]);

  return {
    carnetInfo,
    loading,
    error,
    refetch: loadCarnetInfo,
  };
};

export const useParafiscales = () => {
  const [parafiscales, setParafiscales] = useState<{
    eps: { nombre: string; documento_url: string };
    arl: { nombre: string; documento_url: string };
    pension: { nombre: string; documento_url: string };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadParafiscales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useParafiscales - Obteniendo parafiscales...');
      
      const token = await StorageService.getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const headers = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      const response = await API.get<TecnicoResponse>('/api/me', headers);
      
      if (response.data.success && response.data.data.technician_data) {
        const tecnico = response.data.data.technician_data;
        
        const parafiscalesData = {
          eps: {
            nombre: 'EPS',
            documento_url: tecnico.eps_pdf || ''
          },
          arl: {
            nombre: 'ARL',
            documento_url: tecnico.arl_pdf || ''
          },
          pension: {
            nombre: 'Pensión',
            documento_url: tecnico.pension_pdf || ''
          }
        };
        
        setParafiscales(parafiscalesData);
        return parafiscalesData;
      }

      throw new Error('No se encontraron datos del técnico');
    } catch (err) {
      const errorMessage = ErrorService.getErrorMessage(err);
      setError(errorMessage);
      // Error log removed
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParafiscales();
  }, [loadParafiscales]);

  return {
    parafiscales,
    loading,
    error,
    refetch: loadParafiscales,
  };
};
