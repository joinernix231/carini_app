import API from './api';

// Obtener lista de clientes
export const getClientes = async (token: string) => {
  const res = await API.get('/api/clients', {
    headers: { Authorization: `Bearer ${token}` },
  });
  // Algunas respuestas en el proyecto vienen anidadas como data.data.data (paginación)
  return res.data?.data?.data ?? res.data?.data ?? res.data;
};

// Obtener un cliente por ID
export const getCliente = async (id: number, token: string) => {
  const res = await API.get(`/api/clients/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data ?? res.data;
};

// Eliminar cliente por ID
export const deleteCliente = async (id: number, token: string) => {
  const res = await API.delete(`/api/clients/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// (Opcional) Crear cliente
export const createCliente = async (
  payload: {
    name: string;
    identifier: string;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
  },
  token: string
) => {
  const res = await API.post('/api/clients', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data ?? res.data;
};

// (Opcional) Actualizar cliente
export const updateCliente = async (
  id: number,
  payload: Partial<{ name: string; email: string; password: string; phone: string }>,
  token: string
) => {
  const res = await API.put(`/api/clients/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data ?? res.data;
};
