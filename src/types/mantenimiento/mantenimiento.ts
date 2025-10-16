// src/types/mantenimiento/mantenimiento.ts
export interface Device {
  id: number;
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
}





