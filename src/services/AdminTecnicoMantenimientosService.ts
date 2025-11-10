import { BaseService, BaseResponse } from './BaseService';
import API from './api';
import { TecnicoMaintenance } from './TecnicoMantenimientosService';

export interface MaintenanceLog {
  id: number;
  maintenance_id: number;
  technician_id: number;
  action: 'start' | 'pause' | 'resume' | 'end';
  timestamp: string;
  reason: string | null;
  latitude: string;
  longitude: string;
  location: {
    latitude: string;
    longitude: string;
  };
  created_at: string;
  updated_at: string;
}

export interface DeviceProgress {
  client_device_id: number;
  device: {
    id: number;
    brand: string;
    model: string;
    type: string;
    serial: string;
  };
  completed_indices: number[];
  progress_total: number;
  progress_completed_count: number;
  progress_pct: number;
  progress_status: 'pending' | 'in_progress' | 'completed';
  progress_updated_at: string;
}

export interface ControlInfo {
  last_location: {
    latitude: string;
    longitude: string;
    timestamp: string;
  };
  maintenance_time: {
    total_ms: number;
    formatted: string;
    hours: number;
    minutes: number;
    seconds: number;
  };
  progress_percentage: number;
  devices_progress: DeviceProgress[];
  total_devices: number;
  avg_progress_pct: number;
  all_completed: boolean;
}

export interface MaintenanceDetailResponse {
  maintenance: TecnicoMaintenance;
  control_info: ControlInfo;
  logs: MaintenanceLog[];
  total_logs: number;
}

export interface TecnicoMaintenancesAdminResponse extends BaseResponse<TecnicoMaintenance[]> {}

export interface MaintenanceDetailAdminResponse extends BaseResponse<MaintenanceDetailResponse> {}

export class AdminTecnicoMantenimientosService extends BaseService {
  /**
   * Obtiene todos los mantenimientos de un técnico específico
   * Endpoint: /api/maintenancesTechnicians/{technician}
   */
  static async getTecnicoMaintenances(
    token: string,
    technicianId: number
  ): Promise<TecnicoMaintenancesAdminResponse> {
    try {
      const url = `/api/maintenancesTechnicians/${technicianId}`;
      
      console.log('🔍 AdminTecnicoMantenimientosService: Obteniendo mantenimientos del técnico:', technicianId);

      const response = await API.get(url, this.getAuthHeaders(token));
      
      console.log('✅ Respuesta mantenimientos técnico:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo mantenimientos del técnico:', error);
      throw error;
    }
  }

  /**
   * Obtiene el detalle completo de un mantenimiento específico de un técnico
   * Incluye: maintenance, control_info, logs
   * Endpoint: /api/maintenancesTechnicians/{technician}/maintenance/{maintenance}
   */
  static async getMaintenanceDetail(
    token: string,
    technicianId: number,
    maintenanceId: number
  ): Promise<MaintenanceDetailAdminResponse> {
    try {
      const url = `/api/maintenancesTechnicians/${technicianId}/maintenance/${maintenanceId}`;
      
      console.log('🔍 AdminTecnicoMantenimientosService: Obteniendo detalle del mantenimiento:', {
        technicianId,
        maintenanceId
      });

      const response = await API.get(url, this.getAuthHeaders(token));
      
      console.log('✅ Respuesta detalle mantenimiento:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo detalle del mantenimiento:', error);
      throw error;
    }
  }
}

export default AdminTecnicoMantenimientosService;

