// src/types/ErrorTypes.ts

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
  validationErrors?: Record<string, string[]>;
}

export interface ErrorMessage {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  action?: {
    label: string;
    onPress: () => void;
  };
}

export type ErrorType = 
  | 'UNAUTHORIZED'      // 401
  | 'FORBIDDEN'         // 403
  | 'NOT_FOUND'         // 404
  | 'VALIDATION_ERROR'  // 422
  | 'SERVER_ERROR'      // 500
  | 'NETWORK_ERROR'     // Sin conexión
  | 'TIMEOUT_ERROR'     // Timeout
  | 'UNKNOWN_ERROR';    // Otros

export interface ErrorConfig {
  type: ErrorType;
  title: string;
  message: string;
  showAlert: boolean;
  showToast: boolean;
  autoRetry?: boolean;
  redirectToLogin?: boolean;
}
