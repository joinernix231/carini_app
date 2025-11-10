// src/types/mantenimiento/mantenimiento.ts
export interface Device {
  id: number;
  client_device_id: number;
  model: string;
  brand: string;
  type: string;
  serial: string;
  address: string;
  pivot_description?: string | null;
}

export interface Mantenimiento {
  id: number;
  type: 'preventive' | 'corrective';
  date_maintenance: string | null;
  shift: 'AM' | 'PM';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  value: number | null;
  spare_parts: string | null;
  device: Device[];
  description: string;
  photo: string | null;
  is_paid: boolean | null;
  payment_support: string | null;
  created_at: string;
  // Campos de confirmación
  confirmation_required?: boolean;
  confirmed_at?: string | null;
  confirmation_deadline?: string | null;
  coordinator_notified?: boolean;
  coordinator_notified_at?: string | null;
  coordinator_called?: boolean;
  coordinator_called_at?: string | null;
}

export interface MantenimientoFormData {
  type: 'preventive' | 'corrective';
  shift: 'AM' | 'PM';
  description: string;
  devices: {
    device_id: number;
    description?: string;
  }[];
}

export interface MantenimientoListItem {
  id: number;
  type: 'preventive' | 'corrective';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  devices: Device[];
  description: string;
  date_maintenance: string | null;
  created_at: string;
  deviceCount: number;
  primaryDevice: Device;
  clientName?: string | null;
  // Campos de confirmación
  confirmation_required?: boolean;
  confirmed_at?: string | null;
  confirmation_deadline?: string | null;
}





