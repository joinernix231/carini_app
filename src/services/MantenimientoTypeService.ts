import API, { login as loginAPI } from './api';

// ✅ Obtener lista de tipos de mantenimiento
export const getTiposMantenimiento = async (token: string) => {
  const response = await API.get('/api/maintenanceTypes', {
    headers: { Authorization: `Bearer ${token}` },
  });
  // Log removed
  return response.data.data;
};

// ✅ Crear tipo de mantenimiento
export const createTipoMantenimiento = async (
  payload: {
    name: string;
    description?: string;
  },
  token: string
) => {
  const response = await API.post('/api/maintenanceTypes', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};

// ✅ Obtener tipo de mantenimiento por ID
export const getTipoMantenimientoById = async (id: number, token: string) => {
  const response = await API.get(`/api/maintenanceTypes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};

// ✅ Actualizar tipo de mantenimiento
export const updateTipoMantenimiento = async (
  id: number,
  payload: {
    name?: string;
    description?: string;
  },
  token: string
) => {
  const response = await API.put(`/api/maintenanceTypes/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};

// ✅ Eliminar tipo de mantenimiento
export const deleteTipoMantenimiento = async (id: number, token: string) => {
  const response = await API.delete(`/api/maintenanceTypes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
