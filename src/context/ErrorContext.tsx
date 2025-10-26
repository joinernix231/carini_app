// src/context/ErrorContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { ErrorService } from '../services/ErrorService';
import { ErrorMessage, ErrorType, ApiError } from '../types/ErrorTypes';

interface ErrorContextType {
  showError: (error: any, customMessage?: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  clearError: () => void;
  currentError: ErrorMessage | null;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentError, setCurrentError] = useState<ErrorMessage | null>(null);

  const showError = useCallback((error: any, customMessage?: string) => {
    try {
      const apiError = error?.apiError || ErrorService.parseApiError(error);
      const errorType = error?.errorType || ErrorService.getErrorType(apiError.status, error);
      const config = error?.errorConfig || ErrorService.getErrorConfig(errorType);
      
      const errorMessage = ErrorService.createErrorMessage(apiError, customMessage);
      
      // Mostrar alerta si está configurado
      if (ErrorService.shouldShowAlert(errorType)) {
        Alert.alert(
          errorMessage.title,
          errorMessage.message,
          [
            {
              text: 'Entendido',
              onPress: () => {
                setCurrentError(null);
                // Redirigir a login si es necesario
                if (ErrorService.shouldRedirectToLogin(errorType)) {
                  // Aquí podrías implementar la navegación al login
                  // Log removed
                }
              },
            },
          ],
          { cancelable: false }
        );
      }
      
      // Mostrar toast si está configurado
      if (ErrorService.shouldShowToast(errorType)) {
        showToast(errorMessage.message, 'error');
      }
      
      // Guardar error actual para componentes que lo necesiten
      setCurrentError(errorMessage);
      
    } catch (err) {
      // Error log removed
      showToast('Error inesperado', 'error');
    }
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    // Por ahora usamos Alert, pero podrías integrar react-native-toast-message
    Alert.alert(
      type === 'success' ? 'Éxito' : 
      type === 'error' ? 'Error' : 
      type === 'warning' ? 'Advertencia' : 'Información',
      message,
      [{ text: 'OK' }]
    );
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ 
      showError, 
      showToast, 
      clearError, 
      currentError 
    }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError debe usarse dentro de ErrorProvider');
  }
  return context;
};

