// src/services/MantenimientoConfirmationService.ts
import API, { authHeaders } from './api';

export interface MaintenanceConfirmationResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    confirmation_required: boolean;
    confirmed_at: string | null;
    confirmation_deadline: string | null;
    coordinator_notified: boolean;
    coordinator_notified_at: string | null;
    coordinator_called: boolean;
    coordinator_called_at: string | null;
    [key: string]: any;
  };
}

export interface UnconfirmedMaintenance {
  id: number;
  status: string;
  date_maintenance: string;
  shift: string;
  confirmation_required: boolean;
  confirmed_at: string | null;
  confirmation_deadline: string | null;
  coordinator_notified: boolean;
  coordinator_notified_at: string | null;
  coordinator_called: boolean;
  coordinator_called_at: string | null;
  client: {
    id: number;
    name: string;
    phone: string;
  };
  technician: {
    id: number;
    user: {
      name: string;
      email: string;
    };
    phone: string;
  } | null;
  device?: any[];
}

export const MantenimientoConfirmationService = {
  /**
   * Confirma un mantenimiento como cliente
   */
  async confirmMaintenance(
    maintenanceId: number,
    token: string
  ): Promise<MaintenanceConfirmationResponse> {
    try {
      const response = await API.post(
        `/api/maintenances/${maintenanceId}/confirm`,
        {},
        authHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error('Error confirmando mantenimiento:', error);
      throw new Error(
        error.response?.data?.message || 'Error al confirmar el mantenimiento'
      );
    }
  },

  /**
   * Marca un mantenimiento como "llamado" por el coordinador
   */
  async markAsCalled(
    maintenanceId: number,
    token: string
  ): Promise<MaintenanceConfirmationResponse> {
    try {
      const response = await API.post(
        `/api/maintenances/${maintenanceId}/mark-as-called`,
        {},
        authHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error('Error marcando como llamado:', error);
      throw new Error(
        error.response?.data?.message || 'Error al marcar como llamado'
      );
    }
  },

  /**
   * Obtiene la lista de mantenimientos sin confirmar (para coordinador)
   */
  async getUnconfirmedMaintenances(
    token: string,
    options?: {
      unpaginated?: boolean;
      filters?: string;
    }
  ): Promise<UnconfirmedMaintenance[]> {
    try {
      let url = `/api/coordinator/maintenances/unconfirmed`;
      const params = new URLSearchParams();

      if (options?.unpaginated) {
        params.append('unpaginated', '1');
      }
      if (options?.filters) {
        params.append('filters', options.filters);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await API.get(url, authHeaders(token));
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error obteniendo mantenimientos sin confirmar:', error);
      throw new Error(
        error.response?.data?.message ||
          'Error obteniendo mantenimientos sin confirmar'
      );
    }
  },
};

export default MantenimientoConfirmationService;


