import API, { authHeaders } from './api';
import { CoordinadorMantenimiento } from './CoordinadorMantenimientoService';

export type FilterType = {
  field: string;
  comparator: 'like' | 'is' | 'in' | 'notIn' | 'null' | 'notNull' | '=' | '>' | '<' | '>=' | '<=';
  value: string;
};

export interface MantenimientosResponse {
  data: CoordinadorMantenimiento[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MantenimientosParams {
  page?: number;
  filters?: string;
  unpaginated?: boolean;
}

export class MantenimientosService {
  /**
   * Obtiene todos los mantenimientos del coordinador con filtros opcionales
   */
  static async getMantenimientos(
    token: string,
    params: MantenimientosParams = {}
  ): Promise<MantenimientosResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params.filters) {
        queryParams.append('filters', params.filters);
      }
      
      if (params.unpaginated) {
        queryParams.append('unpaginated', 'true');
      }

      const url = `/api/maintenancesCoordinator?${queryParams.toString()}`;
      console.log('MantenimientosService: Enviando filtros:', {
        page: params.page,
        filters: params.filters,
        url: url
      });
      const response = await API.get(url, authHeaders(token));

      return response.data;
    } catch (error: any) {
      console.error('Error fetching mantenimientos:', error);
      throw error;
    }
  }

  /**
   * Construye el string de filtros para la API usando FiltersCriteria
   */
  static buildFiltersString(filters: FilterType[]): string {
    return filters.map(filter => `${filter.field}|${filter.comparator}|${filter.value}`).join(';');
  }

  /**
   * Obtiene mantenimientos con filtros específicos
   */
  static async getMantenimientosWithFilters(
    token: string,
    filters: FilterType[],
    page: number = 1
  ): Promise<MantenimientosResponse> {
    const filtersString = this.buildFiltersString(filters);
    return this.getMantenimientos(token, { page, filters: filtersString });
  }

  /**
   * Obtiene todos los mantenimientos sin paginación
   */
  static async getAllMantenimientos(
    token: string,
    filters: FilterType[] = []
  ): Promise<CoordinadorMantenimiento[]> {
    const filtersString = filters.length > 0 ? this.buildFiltersString(filters) : undefined;
    const response = await this.getMantenimientos(token, { 
      unpaginated: true, 
      filters: filtersString 
    });
    return response.data;
  }

  /**
   * Busca mantenimientos por texto
   */
  static async searchMantenimientos(
    token: string,
    searchText: string,
    page: number = 1
  ): Promise<MantenimientosResponse> {
    const filters: FilterType[] = [
      { field: 'description', comparator: 'like', value: searchText },
      { field: 'type', comparator: 'like', value: searchText },
      { field: 'status', comparator: 'like', value: searchText },
    ];

    const filtersString = this.buildFiltersString(filters);
    return this.getMantenimientos(token, { page, filters: filtersString });
  }

  /**
   * Obtiene estadísticas de mantenimientos
   */
  static async getMantenimientosStats(token: string): Promise<{
    total: number;
    preventivos: number;
    correctivos: number;
    pendientes: number;
    cotizados: number;
    asignados: number;
    enProgreso: number;
    completados: number;
    cancelados: number;
    rechazados: number;
  }> {
    try {
      const allMantenimientos = await this.getAllMantenimientos(token);
      
      return {
        total: allMantenimientos.length,
        preventivos: allMantenimientos.filter(m => m.type === 'preventive').length,
        correctivos: allMantenimientos.filter(m => m.type === 'corrective').length,
        pendientes: allMantenimientos.filter(m => m.status === 'pending').length,
        cotizados: allMantenimientos.filter(m => m.status === 'quoted').length,
        asignados: allMantenimientos.filter(m => m.status === 'assigned').length,
        enProgreso: allMantenimientos.filter(m => m.status === 'in_progress').length,
        completados: allMantenimientos.filter(m => m.status === 'completed').length,
        cancelados: allMantenimientos.filter(m => m.status === 'cancelled').length,
        rechazados: allMantenimientos.filter(m => m.status === 'rejected').length,
      };
    } catch (error: any) {
      console.error('Error fetching mantenimientos stats:', error);
      throw error;
    }
  }
}

export default MantenimientosService;
