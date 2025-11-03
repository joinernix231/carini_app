import { BaseService, BaseResponse, PaginationData } from './BaseService';
import API from './api';

// Tipos basados en la documentación de la API
export type MaintenanceStatus = 'assigned' | 'in_progress' | 'completed';
export type MaintenanceType = 'preventivo' | 'correctivo';

export interface Client {
  id: number;
  identifier: string;
  name: string;
  legal_representative: string | null;
  address: string;
  city: string;
  department: string | null;
  phone: string;
  client_type: string;
  document_type: string;
  status: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: number;
  client_device_id: number;
  model: string;
  brand: string;
  type: string;
  serial: string;
  address: string;
  pivot_description: string;
}

export interface TechnicianUser {
  name: string;
  email: string;
  role: string;
}

export interface Technician {
  id: number;
  user_id: number;
  user: TechnicianUser;
  document: string;
  phone: string;
  status: string;
  address: string;
  blood_type: string;
  photo: string;
  specialty: string;
  hire_date: string;
  contract_type: string;
  eps_pdf: string;
  arl_pdf: string;
  pension_pdf: string;
  created_at: string;
  updated_at: string;
}

export interface TecnicoMaintenance {
  id: number;
  type: string;
  date_maintenance: string;
  shift: string;
  status: MaintenanceStatus;
  value: number | null;
  device: Device[];
  client: Client;
  technician: Technician;
  latitude?: string;
  longitude?: string;
  started_at?: string;
  // Tiempo total pausado acumulado en milisegundos (provisto por el backend)
  total_pause_ms?: number;
  // Compatibilidad por si el backend devuelve segundos o string previo
  pause_duration?: string | null;
  pause_duration_ms?: number;
  description: string;
  photo: string;
  is_paid: boolean | null;
  payment_support: string | null;
  price_support: string | null;
  created_at: string;
}

export interface TecnicoMaintenancesResponse extends BaseResponse<TecnicoMaintenance[]> {
  meta?: PaginationData;
}

// Progreso por dispositivo dentro de un mantenimiento
export interface DeviceProgress {
  client_device_id: number;
  completed_indices: number[];
  progress_total?: number;
  progress_completed_count?: number;
  progress_pct?: number;
  progress_status?: 'pending' | 'in_progress' | 'completed';
}

export interface MaintenanceProgressResponse extends BaseResponse<{
  maintenance_id: number;
  devices: DeviceProgress[];
  global?: {
    total_devices: number;
    avg_progress_pct: number;
    all_completed: boolean;
  };
}> {}

export interface TecnicoMaintenancesParams {
  status?: MaintenanceStatus;
  date_from?: string;
  date_to?: string;
  unpaginated?: boolean;
}

export interface ActiveMaintenanceResponse extends BaseResponse<{
  has_active_maintenance: boolean;
  maintenance: TecnicoMaintenance | null;
}> {}

export class TecnicoMantenimientosService extends BaseService {
  /**
   * Verifica si el técnico tiene un mantenimiento activo
   */
  static async getActiveMaintenance(token: string): Promise<ActiveMaintenanceResponse> {
    try {
      const url = '/api/technician/activeMaintenance';
      
      console.log('🔍 TecnicoMantenimientosService: Verificando mantenimiento activo');

      const response = await API.get(url, this.getAuthHeaders(token));
      
      console.log('✅ Respuesta mantenimiento activo:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error verificando mantenimiento activo:', error);
      throw error;
    }
  }

  /**
   * Obtiene los mantenimientos del técnico autenticado
   */
  static async getMaintenances(
    token: string,
    params: TecnicoMaintenancesParams = {}
  ): Promise<TecnicoMaintenancesResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) {
        queryParams.append('status', params.status);
      }
      
      if (params.date_from) {
        queryParams.append('date_from', params.date_from);
      }
      
      if (params.date_to) {
        queryParams.append('date_to', params.date_to);
      }
      
      if (params.unpaginated) {
        queryParams.append('unpaginated', 'true');
      }

      const url = `/api/technicianMaintenances${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('TecnicoMantenimientosService: Obteniendo mantenimientos:', {
        params,
        url
      });

      const response = await API.get(url, this.getAuthHeaders(token));
      
      return response.data;
    } catch (error: any) {
      console.error('TecnicoMantenimientosService: Error obteniendo mantenimientos:', error);
      throw error;
    }
  }

  /**
   * Obtiene el detalle de un mantenimiento específico
   */
  static async getMaintenanceDetail(
    token: string,
    maintenanceId: number
  ): Promise<BaseResponse<TecnicoMaintenance>> {
    try {
      const url = `/api/technicianMaintenances/${maintenanceId}`;
      
      console.log('TecnicoMantenimientosService: Obteniendo detalle:', maintenanceId);

      const response = await API.get(url, this.getAuthHeaders(token));
      
      return response.data;
    } catch (error: any) {
      console.error('TecnicoMantenimientosService: Error obteniendo detalle:', error);
      throw error;
    }
  }

  /**
   * Obtiene el progreso actual (índices completados) por equipo del mantenimiento
   */
  static async getMaintenanceProgress(
    token: string,
    maintenanceId: number
  ): Promise<MaintenanceProgressResponse> {
    try {
      const url = `/api/technicianMaintenances/${maintenanceId}/progress`;
      const response = await API.get(url, this.getAuthHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error('TecnicoMantenimientosService: Error obteniendo progreso:', error);
      throw error;
    }
  }

  /**
   * Actualiza el progreso (batch) por equipos en un mantenimiento
   * items_total es opcional; el backend puede calcularlo por tipo
   */
  static async updateMaintenanceProgress(
    token: string,
    maintenanceId: number,
    devices: Array<{ client_device_id: number; completed_indices: number[]; items_total?: number }>
  ): Promise<MaintenanceProgressResponse> {
    try {
      const url = `/api/technicianMaintenances/${maintenanceId}/progress`;
      const body = { devices };
      const response = await API.post(url, body, this.getAuthHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error('TecnicoMantenimientosService: Error actualizando progreso:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los mantenimientos del técnico sin paginación
   */
  static async getAllMaintenances(
    token: string,
    params: TecnicoMaintenancesParams = {}
  ): Promise<TecnicoMaintenance[]> {
    const response = await this.getMaintenances(token, { 
      ...params, 
      unpaginated: true 
    });
    return response.data;
  }

  /**
   * Obtiene mantenimientos filtrados por estado
   */
  static async getMaintenancesByStatus(
    token: string,
    status: MaintenanceStatus
  ): Promise<TecnicoMaintenancesResponse> {
    return this.getMaintenances(token, { status });
  }

  /**
   * Obtiene mantenimientos filtrados por rango de fechas
   */
  static async getMaintenancesByDateRange(
    token: string,
    dateFrom: string,
    dateTo?: string
  ): Promise<TecnicoMaintenancesResponse> {
    return this.getMaintenances(token, { 
      date_from: dateFrom, 
      date_to: dateTo 
    });
  }

  /**
   * Obtiene las fechas para filtros comunes
   */
  static getFilterDates(filter: 'today' | 'week' | 'month'): { date_from: string; date_to: string } {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    switch (filter) {
      case 'today':
        const todayStr = `${year}-${month}-${day}`;
        return { date_from: todayStr, date_to: todayStr };
      
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return {
          date_from: `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`,
          date_to: `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`
        };
      
      case 'month':
        const firstDay = new Date(year, today.getMonth(), 1);
        const lastDay = new Date(year, today.getMonth() + 1, 0);
        
        return {
          date_from: `${year}-${month}-01`,
          date_to: `${year}-${month}-${String(lastDay.getDate()).padStart(2, '0')}`
        };
    }
  }

  /**
   * Obtiene mantenimientos de hoy
   */
  static async getTodayMaintenances(
    token: string
  ): Promise<TecnicoMaintenancesResponse> {
    const today = new Date().toISOString().split('T')[0];
    return this.getMaintenances(token, { 
      date_from: today, 
      date_to: today 
    });
  }

  /**
   * Obtiene mantenimientos pendientes
   */
  static async getPendingMaintenances(
    token: string
  ): Promise<TecnicoMaintenancesResponse> {
    return this.getMaintenances(token, { status: 'assigned' });
  }

  /**
   * Obtiene mantenimientos en progreso
   */
  static async getInProgressMaintenances(
    token: string
  ): Promise<TecnicoMaintenancesResponse> {
    return this.getMaintenances(token, { status: 'in_progress' });
  }

  /**
   * Obtiene mantenimientos completados
   */
  static async getCompletedMaintenances(
    token: string
  ): Promise<TecnicoMaintenancesResponse> {
    return this.getMaintenances(token, { status: 'completed' });
  }

  /**
   * Obtiene estadísticas de mantenimientos del técnico
   */
  static async getMaintenancesStats(token: string): Promise<{
    total: number;
    assigned: number;
    in_progress: number;
    completed: number;
    today: number;
    thisWeek: number;
  }> {
    try {
      const allMaintenances = await this.getAllMaintenances(token);
      
      // Calcular fechas
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      return {
        total: allMaintenances.length,
        assigned: allMaintenances.filter(m => m.status === 'assigned').length,
        in_progress: allMaintenances.filter(m => m.status === 'in_progress').length,
        completed: allMaintenances.filter(m => m.status === 'completed').length,
        today: allMaintenances.filter(m => m.date_maintenance === today).length,
        thisWeek: allMaintenances.filter(m => 
          m.date_maintenance >= weekStartStr && m.date_maintenance <= today
        ).length,
      };
    } catch (error: any) {
      console.error('TecnicoMantenimientosService: Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Formatea la fecha para mostrar en la UI
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formatea la fecha y hora para mostrar en la UI
   */
  static formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene el texto del estado en español
   */
  static getStatusText(status: MaintenanceStatus): string {
    const statusMap: Record<MaintenanceStatus, string> = {
      assigned: 'Asignado',
      in_progress: 'En Progreso',
      completed: 'Completado'
    };
    return statusMap[status] || 'Desconocido';
  }

  /**
   * Obtiene el color del estado
   */
  static getStatusColor(status: MaintenanceStatus): string {
    const colorMap: Record<MaintenanceStatus, string> = {
      assigned: '#FF9800',
      in_progress: '#2196F3',
      completed: '#4CAF50'
    };
    return colorMap[status] || '#757575';
  }

  /**
   * Obtiene el icono del tipo de equipo
   */
  static getEquipmentIcon(deviceType: string): string {
    const type = deviceType.toLowerCase();
    if (type === 'lavadora') {
      return 'local-laundry-service';
    } else if (type === 'secadora') {
      return 'dry-cleaning';
    } else if (type === 'centrífuga') {
      return 'sync';
    }
    return 'build';
  }

  /**
   * Obtiene el nombre completo del equipo
   */
  static getEquipmentName(device: Device): string {
    return `${device.brand} ${device.model}`;
  }

  /**
   * Obtiene la descripción del mantenimiento
   */
  static getMaintenanceDescription(maintenance: TecnicoMaintenance): string {
    if (maintenance.description) {
      return maintenance.description;
    }
    if (maintenance.device.length > 0 && maintenance.device[0].pivot_description) {
      return maintenance.device[0].pivot_description;
    }
    return 'Mantenimiento programado';
  }

  /**
   * Sube múltiples fotos de mantenimiento en una sola petición
   */
  static async uploadMaintenancePhotos(
    token: string,
    maintenanceId: number,
    photos: Array<{
      client_device_id: number;
      photo: string; // Nombre de la imagen subida a S3
      photo_type: 'initial' | 'final' | 'part';
    }>
  ): Promise<BaseResponse<any>> {
    try {
      const url = `/api/technicianMaintenances/${maintenanceId}/photos`;
      
      console.log('🚀 TecnicoMantenimientosService: INICIANDO subida de fotos:', {
        maintenanceId,
        photosCount: photos.length,
        url,
        photos: photos.map(p => ({ 
          client_device_id: p.client_device_id, 
          photo_type: p.photo_type,
          photo: p.photo
        }))
      });

      const requestBody = { photos };
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      console.log('📤 Request body type:', typeof requestBody);
      console.log('📤 Photos array:', JSON.stringify(photos, null, 2));

      const response = await API.post(url, requestBody, this.getAuthHeaders(token));
      
      console.log('✅ Fotos subidas exitosamente:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error subiendo fotos de mantenimiento:', error);
      throw error;
    }
  }

  /**
   * Inicia un mantenimiento con ubicación GPS
   */
  static async startMaintenance(
    token: string,
    maintenanceId: number,
    location: {
      latitude: number;
      longitude: number;
    }
  ): Promise<BaseResponse<any>> {
    try {
      const url = `/api/technicianMaintenances/${maintenanceId}/start`;
      
      console.log('🚀 TecnicoMantenimientosService: Iniciando mantenimiento:', {
        maintenanceId,
        location
      });

      const requestBody = {
        latitude: location.latitude,
        longitude: location.longitude
      };

      const response = await API.post(url, requestBody, this.getAuthHeaders(token));
      
      console.log('✅ Mantenimiento iniciado exitosamente:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error iniciando mantenimiento:', error);
      throw error;
    }
  }

  /**
   * Pausa un mantenimiento con ubicación GPS y razón opcional
   */
  static async pauseMaintenance(
    token: string,
    maintenanceId: number,
    location: {
      latitude: number;
      longitude: number;
    },
    pauseReason?: string
  ): Promise<BaseResponse<any>> {
    try {
      const url = `/api/technicianMaintenances/${maintenanceId}/pause`;
      
      console.log('⏸️ TecnicoMantenimientosService: Pausando mantenimiento:', {
        maintenanceId,
        location,
        pauseReason
      });

      const requestBody: any = {
        latitude: location.latitude,
        longitude: location.longitude
      };

      // Agregar razón de pausa si existe
      if (pauseReason) {
        requestBody.pause_reason = pauseReason;
      }

      const response = await API.post(url, requestBody, this.getAuthHeaders(token));
      
      console.log('✅ Mantenimiento pausado exitosamente:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error pausando mantenimiento:', error);
      throw error;
    }
  }

  /**
   * Reanuda un mantenimiento pausado con ubicación GPS
   */
  static async resumeMaintenance(
    token: string,
    maintenanceId: number,
    location: {
      latitude: number;
      longitude: number;
    }
  ): Promise<BaseResponse<any>> {
    try {
      const url = `/api/technicianMaintenances/${maintenanceId}/resume`;
      
      console.log('▶️ TecnicoMantenimientosService: Reanudando mantenimiento:', {
        maintenanceId,
        location
      });

      const requestBody = {
        latitude: location.latitude,
        longitude: location.longitude
      };

      const response = await API.post(url, requestBody, this.getAuthHeaders(token));
      
      console.log('✅ Mantenimiento reanudado exitosamente:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error reanudando mantenimiento:', error);
      throw error;
    }
  }

}

export default TecnicoMantenimientosService;
