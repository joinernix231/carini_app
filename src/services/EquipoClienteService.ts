import API from './api';
import { login as loginAPI } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getEquiposVinculados = async (token: string) => {
  try {
    const response = await API.get('/api/linkDevices', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('🔁 Token expirado. Reintentando login automático...');

      const email = await AsyncStorage.getItem('email');
      const password = await AsyncStorage.getItem('password');

      if (email && password) {
        const loginResponse = await loginAPI(email, password);
        const newToken = loginResponse.token;

        // 👉 Guardar nuevo token
        await AsyncStorage.setItem('token', newToken);
        API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        // 👉 Reintentar con el nuevo token
        const retry = await API.get('/api/linkDevices', {
          headers: { Authorization: `Bearer ${newToken}` },
        });

        return retry.data.data.data;
      } else {
        throw new Error('No se pudo reautenticar. Credenciales no disponibles.');
      }
    }

    throw error;
  }
};

export const getEquipoVinculado = async (token: string, deviceId: number ) => {
  try {
    const response = await API.get(`/api/linkDevices/${deviceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  
    
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('🔁 Token expirado. Reintentando login automático...');

      const email = await AsyncStorage.getItem('email');
      const password = await AsyncStorage.getItem('password');

      if (email && password) {
        const loginResponse = await loginAPI(email, password);
        const newToken = loginResponse.token;

        // 👉 Guardar nuevo token
        await AsyncStorage.setItem('token', newToken);
        API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        // 👉 Reintentar con el nuevo token
        const retry = await API.get('/api/linkDevices', {
          headers: { Authorization: `Bearer ${newToken}` },
        });

        return retry.data.data.data;
      } else {
        throw new Error('No se pudo reautenticar. Credenciales no disponibles.');
      }
    }

    throw error;
  }
};




export const asignarEquipo = async (payload: {
  serial: string;
  address: string;
  device_id: number;
}, token: string) => {
  const response = await API.post('/api/linkDevices', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

/**
 * Obtiene los mantenimientos de un equipo vinculado del cliente
 */
export const getMantenimientosEquipoVinculado = async (
  token: string,
  deviceId: number,
  options?: { per_page?: number }
): Promise<any[]> => {
  try {
    let url = `/api/linkDevices/${deviceId}/maintenances`;
    const params = new URLSearchParams();
    
    if (options?.per_page) {
      params.append('per_page', options.per_page.toString());
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await API.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    return response.data.data || [];
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('🔁 Token expirado. Reintentando login automático...');

      const email = await AsyncStorage.getItem('email');
      const password = await AsyncStorage.getItem('password');

      if (email && password) {
        const loginResponse = await loginAPI(email, password);
        const newToken = loginResponse.token;

        await AsyncStorage.setItem('token', newToken);
        API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        const retry = await API.get(url, {
          headers: { Authorization: `Bearer ${newToken}` },
        });

        return retry.data.data || [];
      } else {
        throw new Error('No se pudo reautenticar. Credenciales no disponibles.');
      }
    }

    throw error;
  }
};