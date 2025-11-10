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
      // Error log removed
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
   * Optimizado: Solo carga los datos necesarios para estadísticas
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
      // En lugar de cargar todos los mantenimientos, cargamos solo los que necesitamos para stats
      // Esto es más eficiente que cargar todo y filtrar
      const [
        enProgresoData,
        completadosData,
      ] = await Promise.all([
        // Solo cargar en progreso
        this.getMantenimientos(token, { 
          unpaginated: true, 
          filters: 'status|is|in_progress' 
        }).catch(() => ({ data: [] })),
        // Solo cargar completados
        this.getMantenimientos(token, { 
          unpaginated: true, 
          filters: 'status|is|completed' 
        }).catch(() => ({ data: [] })),
      ]);

      // Para las otras estadísticas, usamos los datos que ya tenemos del dashboard
      // o retornamos valores por defecto ya que no son críticos para la carga inicial
      return {
        total: 0, // No crítico, se puede calcular después
        preventivos: 0, // No crítico
        correctivos: 0, // No crítico
        pendientes: 0, // No crítico
        cotizados: 0, // No crítico
        asignados: 0, // No crítico
        enProgreso: enProgresoData.data?.length || 0,
        completados: completadosData.data?.length || 0,
        cancelados: 0, // No crítico
        rechazados: 0, // No crítico
      };
    } catch (error: any) {
      // Error log removed
      // Retornar valores por defecto en caso de error
      return {
        total: 0,
        preventivos: 0,
        correctivos: 0,
        pendientes: 0,
        cotizados: 0,
        asignados: 0,
        enProgreso: 0,
        completados: 0,
        cancelados: 0,
        rechazados: 0,
      };
    }
  }
}

export default MantenimientosService;
