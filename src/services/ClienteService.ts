import API from './api';
import { authHeaders } from './api';

export interface ClienteDashboardStats {
  equiposCount: number;
  mantenimientosPendientes: number;
  mantenimientosCompletados: number;
  mantenimientosEnProceso: number;
}

export interface ClienteEquipo {
  id: string;
  name: string;
  tipo_equipo: string;
  serial?: string;
  model?: string;
  address?: string;
  estado?: string;
  ultimoMantenimiento?: string;
}

export interface ClienteMantenimiento {
  id: string;
  device: {
    model: string;
    serial: string;
  };
  type: string;
  status: string;
  created_at: string;
  description?: string;
  priority?: string;
}

export class ClienteService {
  /**
   * Obtiene las estadísticas del dashboard del cliente
   */
  static async getDashboardStats(token: string): Promise<ClienteDashboardStats> {
    try {
      console.log('🔍 ClienteService - Obteniendo estadísticas del dashboard');
      const response = await API.get('/api/cliente/dashboard/stats', authHeaders(token));
      console.log('✅ ClienteService - Estadísticas obtenidas:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ ClienteService - Error obteniendo estadísticas:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo estadísticas del dashboard');
    }
  }

  /**
   * Obtiene los equipos del cliente
   */
  static async getEquipos(token: string): Promise<ClienteEquipo[]> {
    try {
      console.log('🔍 ClienteService - Obteniendo equipos del cliente');
      const response = await API.get('/api/cliente/equipos', authHeaders(token));
      console.log('✅ ClienteService - Equipos obtenidos:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ ClienteService - Error obteniendo equipos:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo equipos del cliente');
    }
  }

  /**
   * Obtiene los mantenimientos del cliente
   */
  static async getMantenimientos(token: string): Promise<ClienteMantenimiento[]> {
    try {
      console.log('🔍 ClienteService - Obteniendo mantenimientos del cliente');
      const response = await API.get('/api/cliente/mantenimientos', authHeaders(token));
      console.log('✅ ClienteService - Mantenimientos obtenidos:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ ClienteService - Error obteniendo mantenimientos:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo mantenimientos del cliente');
    }
  }

  /**
   * Obtiene el historial de mantenimientos del cliente
   */
  static async getHistorialMantenimientos(token: string, limit: number = 10): Promise<ClienteMantenimiento[]> {
    try {
      console.log('🔍 ClienteService - Obteniendo historial de mantenimientos');
      const response = await API.get(`/api/cliente/mantenimientos/historial?limit=${limit}`, authHeaders(token));
      console.log('✅ ClienteService - Historial obtenido:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ ClienteService - Error obteniendo historial:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo historial de mantenimientos');
    }
  }

  /**
   * Obtiene notificaciones del cliente
   */
  static async getNotificaciones(token: string): Promise<any[]> {
    try {
      console.log('🔍 ClienteService - Obteniendo notificaciones');
      const response = await API.get('/api/cliente/notificaciones', authHeaders(token));
      console.log('✅ ClienteService - Notificaciones obtenidas:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ ClienteService - Error obteniendo notificaciones:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo notificaciones');
    }
  }
}