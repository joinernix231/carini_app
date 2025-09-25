import API, { login as loginAPI } from './api';

// ✅ Obtener lista de mantenimientos
export const getMantenimientos = async (token: string) => {
  const response = await API.get('/api/maintenances', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};

// ✅ Crear mantenimiento
export const createMantenimiento = async (
  payload: {
    client_device_id: number;
    type: 'preventive' | 'corrective';
    date_maintenance: string;
    maintenance_type_id: number;
    description?: string;
    photo?: string;
  },
  token: string
) => {
  const response = await API.post('/api/maintenances', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};

// ✅ Obtener mantenimiento por ID
export const getMantenimientoById = async (id: number, token: string) => {
  const response = await API.get(`/api/maintenances/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};

// ✅ Actualizar mantenimiento
export const updateMantenimiento = async (
  id: number,
  payload: {
    type?: 'preventive' | 'corrective';
    date_maintenance?: string;
    maintenance_type_id?: number;
    description?: string;
    photo?: string;
    payment_support?: string;
  },
  token: string
) => {
  const response = await API.put(`/api/maintenances/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};

// ✅ Eliminar mantenimiento
export const deleteMantenimiento = async (id: number, token: string) => {
  const response = await API.delete(`/api/maintenances/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
 // Obtener lista de fechas disponibles
export const getFechasDisponiblesTecnicos = async (token: string) => {
    const response = await API.get('/api/availableDates', {
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log(response.data);
    return response.data;
};

export const getMantenimientosSinAsignar = async (token: string) => {
  const response = await API.get('/api/maintenancesNotAssigned', {
      headers: { Authorization: `Bearer ${token}` },
  });
  console.log(response.data);
  return response.data;
};

// ✅ Verificar pago de mantenimiento
export const verifyMaintenancePayment = async (maintenanceId: number, token: string) => {
  const response = await API.put(`/api/verifyMaintenance/${maintenanceId}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ✅ Subir soporte de pago
export const uploadPaymentSupport = async (maintenanceId: number, documentUrl: string, token: string) => {
  const response = await API.put(`/api/maintenances/${maintenanceId}/payment-support`, 
    { payment_support: documentUrl }, 
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};
