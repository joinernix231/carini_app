import API from './api';

// Tipos para el sistema de mantenimientos
export type MaintenanceType = 'preventive' | 'corrective';
export type MaintenanceStatus = 'pending' | 'quoted' | 'payment_uploaded' | 'approved' | 'rejected' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = null | false | true;
export type ShiftType = 'AM' | 'PM';

// Tipos para dispositivos
export interface MaintenanceDevice {
  id: number;
  model: string;
  brand: string;
  type: string;
  photo: string | null;
  pdf_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Tipos para clientes
export interface MaintenanceClient {
  id: number;
  identifier: string;
  name: string;
  legal_representative: string | null;
  address: string;
  city: string;
  department: string;
  phone: string;
  client_type: string;
  document_type: string;
  status: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// Interfaz principal para mantenimientos del coordinador
export interface CoordinadorMantenimiento {
  id: number;
  type: MaintenanceType;
  date_maintenance: string | null;
  shift: ShiftType | null;
  status: MaintenanceStatus;
  value: number | null;
  spare_parts: string | null;
  is_paid: PaymentStatus;
  created_at: string;
  device: MaintenanceDevice | MaintenanceDevice[]; // El endpoint puede devolver arreglo
  client: MaintenanceClient | null; // Puede venir null según endpoint
  description: string | null;
  photo: string | null;
}

// Tipos para respuestas de la API
export interface CoordinadorMantenimientosResponse {
  success: boolean;
  data: CoordinadorMantenimiento[];
  message: string;
}

// Tipos para asignación de mantenimientos
export interface AsignarMantenimientoPayload {
  date_maintenance: string;
  shift: ShiftType;
  value?: number;
  spare_parts?: string[];
  technician_id?: number;
}

// Tipos para estadísticas
export interface MaintenanceStats {
  total: number;
  preventive: number;
  corrective: number;
  pending: number;
  assigned: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

// Tipos para filtros
export interface MaintenanceFilters {
  type?: MaintenanceType;
  status?: MaintenanceStatus;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
}

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getMantenimientosSinAsignarCoordinador = async (token: string): Promise<CoordinadorMantenimiento[]> => {
  try {
    const response = await API.get('/api/maintenancesNotAssigned', authHeaders(token));
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching mantenimientos sin asignar (coordinador):', error);
    throw error;
  }
};

export const getMantenimientosAsignadosCoordinador = async (token: string): Promise<CoordinadorMantenimiento[]> => {
  try {
    const response = await API.get('/api/maintenancesAssigned', authHeaders(token));
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching mantenimientos asignados (coordinador):', error);
    throw error;
  }
};


export const asignarTecnicoCoordinador = async (
  mantenimientoId: number, 
  payload: AsignarMantenimientoPayload, 
  token: string
): Promise<any> => {
  try {
    console.log('🚀 Enviando asignación:', {
      url: `/api/assignMaintenance/${mantenimientoId}`,
      payload,
      mantenimientoId
    });
    
    const response = await API.put(
      `/api/assignMaintenance/${mantenimientoId}`,
      payload,
      authHeaders(token)
    );
    
    // Log removed
    return response.data;
  } catch (error: any) {
    console.error('❌ Error asignando técnico (coordinador):', error);
    console.error('❌ Error details:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    });
    throw error;
  }
};

export const uploadPriceSupport = async (
  maintenanceId: number,
  priceSupportUrl: string | null,
  token: string,
  options?: {
    is_paid?: boolean | null;
    value?: number | null;
  }
): Promise<any> => {
  try {
    const payload: any = {};
    
    if (priceSupportUrl) {
      payload.price_support = priceSupportUrl;
    }
    
    if (options?.is_paid !== undefined) {
      payload.is_paid = options.is_paid;
    }
    
    if (options?.value !== undefined) {
      payload.value = options.value;
    }
    
    const response = await API.put(
      `/api/uploadPrice/${maintenanceId}`,
      payload,
      authHeaders(token)
    );
    return response.data;
  } catch (error: any) {
    // Error log removed
    throw error;
  }
};

// Nuevo servicio para mantenimientos sin cotización (paso 2)
export const getMantenimientosSinCotizacion = async (token: string): Promise<CoordinadorMantenimiento[]> => {
  try {
    const response = await API.get('/api/maintenancesNotPrice', authHeaders(token));
    return response.data.data;
  } catch (error: any) {
    // Error log removed
    throw error;
  }
};

// Nuevo servicio para mantenimientos aprobados (paso 4)
export const getMantenimientosAprobados = async (token: string): Promise<CoordinadorMantenimiento[]> => {
  try {
    const response = await API.get('/api/maintenancesApproved', authHeaders(token));
    return response.data.data;
  } catch (error: any) {
    // Error log removed
    throw error;
  }
};

// Servicio para mantenimientos por estado de pago
export interface MantenimientosByPaymentStatus {
  paid_pending_review: CoordinadorMantenimiento[]; // is_paid = false
  pending_payment: CoordinadorMantenimiento[];     // is_paid = null
}

export const getMantenimientosByPaymentStatus = async (token: string): Promise<MantenimientosByPaymentStatus> => {
  try {
    const response = await API.get('/api/maintenancesByPaymentStatus', authHeaders(token));
    
    const allMantenimientos = response.data.data || [];
    
    // Separar según is_paid
    const paidPendingReview = allMantenimientos.filter((m: any) => m.is_paid === false);
    const pendingPayment = allMantenimientos.filter((m: any) => m.is_paid === null);
    
    return {
      paid_pending_review: paidPendingReview,
      pending_payment: pendingPayment
    };
  } catch (error: any) {
    // Error log removed
    throw error;
  }
};

// Servicio para actualizar cotización
export const updateQuotation = async (
  maintenanceId: number,
  token: string,
  options: {
    is_paid?: boolean | null;
    value?: number | null;
    price_support?: string | null;
  }
): Promise<any> => {
  try {
    const payload: any = {};
    
    if (options.is_paid !== undefined) {
      payload.is_paid = options.is_paid;
    }
    
    if (options.value !== undefined) {
      payload.value = options.value;
    }
    
    if (options.price_support !== undefined) {
      payload.price_support = options.price_support;
    }
    
    const response = await API.put(
      `/api/maintenance/${maintenanceId}/update-quotation`,
      payload,
      authHeaders(token)
    );
    return response.data;
  } catch (error: any) {
    // Error log removed
    throw error;
  }
};

export const CoordinadorMantenimientoService = {
  getMantenimientosSinAsignarCoordinador,
  getMantenimientosAsignadosCoordinador,
  getMantenimientosSinCotizacion,
  getMantenimientosAprobados,
  getMantenimientosByPaymentStatus,
  asignarTecnicoCoordinador,
  uploadPriceSupport,
  updateQuotation,
};
