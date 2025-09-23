// src/services/ErrorService.ts
import { ApiError, ErrorConfig, ErrorType, ErrorMessage } from '../types/ErrorTypes';

export class ErrorService {
  private static errorConfigs: Record<ErrorType, ErrorConfig> = {
    UNAUTHORIZED: {
      type: 'UNAUTHORIZED',
      title: 'Credenciales Incorrectas',
      message: 'Verifica tus credenciales e intenta nuevamente.',
      showAlert: true,
      showToast: false,
      redirectToLogin: true,
    },
    FORBIDDEN: {
      type: 'FORBIDDEN',
      title: 'Sin Permisos',
      message: 'No tienes permisos para realizar esta acción. Contacta al administrador.',
      showAlert: true,
      showToast: false,
    },
    NOT_FOUND: {
      type: 'NOT_FOUND',
      title: 'Recurso No Encontrado',
      message: 'El recurso que buscas no existe o ha sido eliminado.',
      showAlert: false,
      showToast: true,
    },
    VALIDATION_ERROR: {
      type: 'VALIDATION_ERROR',
      title: 'Error de Validación',
      message: 'Por favor, revisa los datos ingresados e intenta nuevamente.',
      showAlert: false,
      showToast: true,
    },
    SERVER_ERROR: {
      type: 'SERVER_ERROR',
      title: 'Error del Servidor',
      message: 'Ha ocurrido un error en el servidor. Intenta nuevamente en unos minutos.',
      showAlert: true,
      showToast: false,
      autoRetry: true,
    },
    NETWORK_ERROR: {
      type: 'NETWORK_ERROR',
      title: 'Sin Conexión',
      message: 'Verifica tu conexión a internet e intenta nuevamente.',
      showAlert: true,
      showToast: false,
      autoRetry: true,
    },
    TIMEOUT_ERROR: {
      type: 'TIMEOUT_ERROR',
      title: 'Tiempo Agotado',
      message: 'La operación tardó demasiado. Intenta nuevamente.',
      showAlert: false,
      showToast: true,
      autoRetry: true,
    },
    UNKNOWN_ERROR: {
      type: 'UNKNOWN_ERROR',
      title: 'Error Inesperado',
      message: 'Ha ocurrido un error inesperado. Intenta nuevamente.',
      showAlert: false,
      showToast: true,
    },
  };

  static getErrorType(status: number, error?: any): ErrorType {
    switch (status) {
      case 401:
        return 'UNAUTHORIZED';
      case 400:
        return 'VALIDATION_ERROR';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 422:
        return 'VALIDATION_ERROR';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'SERVER_ERROR';
      default:
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
          return 'NETWORK_ERROR';
        }
        if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
          return 'TIMEOUT_ERROR';
        }
        return 'UNKNOWN_ERROR';
    }
  }

  static getErrorConfig(errorType: ErrorType): ErrorConfig {
    return this.errorConfigs[errorType];
  }

  static parseApiError(error: any): ApiError {
    const status = error?.response?.status || 0;
    const responseData = error?.response?.data;
    
    // Para errores 400, extraer el mensaje específico del servidor
    let message = 'Error desconocido';
    
    if (status === 400 && responseData) {
      // Si hay datos específicos de validación, extraer el primer error
      if (responseData.data && typeof responseData.data === 'object') {
        const firstError = Object.values(responseData.data)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          message = firstError[0];
        } else if (typeof firstError === 'string') {
          message = firstError;
        }
      }
      // Si no hay datos específicos, usar el mensaje general
      else if (responseData.message) {
        message = responseData.message;
      }
    } else {
      // Para otros errores, usar la lógica original
      message = responseData?.message || 
                responseData?.error || 
                error?.message || 
                'Error desconocido';
    }
    
    return {
      status,
      message,
      code: responseData?.code,
      details: responseData,
    };
  }

  static createErrorMessage(apiError: ApiError, customMessage?: string): ErrorMessage {
    const errorType = this.getErrorType(apiError.status, apiError);
    const config = this.getErrorConfig(errorType);
    
    // Para errores 400, usar el mensaje del servidor como título y el error específico como mensaje
    let title = config.title;
    let message = config.message;
    
    if (apiError.status === 400 && apiError.details) {
      // Usar el mensaje general del servidor como título
      if (apiError.details.message) {
        title = apiError.details.message;
      }
      // Usar el error específico como mensaje
      if (apiError.message && apiError.message !== 'Error desconocido') {
        message = apiError.message;
      }
    } else if (customMessage) {
      message = customMessage;
    }
    
    return {
      title,
      message,
      type: errorType === 'UNAUTHORIZED' || errorType === 'FORBIDDEN' ? 'error' : 'warning',
    };
  }

  static shouldShowAlert(errorType: ErrorType): boolean {
    return this.errorConfigs[errorType].showAlert;
  }

  static shouldShowToast(errorType: ErrorType): boolean {
    return this.errorConfigs[errorType].showToast;
  }

  static shouldRedirectToLogin(errorType: ErrorType): boolean {
    return this.errorConfigs[errorType].redirectToLogin || false;
  }

  static shouldAutoRetry(errorType: ErrorType): boolean {
    return this.errorConfigs[errorType].autoRetry || false;
  }
}
