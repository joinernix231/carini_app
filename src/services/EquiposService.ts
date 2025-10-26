import API from './api';


export const getEquiposVinculados = async (token: string) => {
  const response = await API.get('/api/devices?unpaginated=true', {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  console.log('🔍 EquiposService - Response structure:', JSON.stringify(response.data, null, 2));
  
  // El backend devuelve: { success: true, data: [...], message }
  let devices = response.data.data || [];
  
  // Si devices no es un array, intentar acceder a la estructura correcta
  if (!Array.isArray(devices)) {
    devices = response.data.data?.data || response.data || [];
  }
  
  // Asegurar que devices es un array
  if (!Array.isArray(devices)) {
    // Error log removed
    return [];
  }
  
  return devices;
};


export const asignarEquipo = async (payload: {
  serial: string;
  address: string;
  client_id: number;
}, token: string) => {
  const response = await API.post('/api/devices', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

