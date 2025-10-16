// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Actualizar el state para mostrar la UI de error
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log del error
    logger.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Llamar callback personalizado si existe
    this.props.onError?.(error, errorInfo);

    // Auto-reset después de 30 segundos
    this.resetTimeoutId = setTimeout(() => {
      this.resetError();
    }, 30000);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset si las props han cambiado y está configurado
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError();
    }

    // Reset si las resetKeys han cambiado
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        key !== prevProps.resetKeys?.[index]
      );
      
      if (hasResetKeyChanged) {
        this.resetError();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });

    logger.debug('ErrorBoundary reset');
  };

  render() {
    if (this.state.hasError) {
      // Renderizar UI de error personalizada si se proporciona
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error por defecto
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>¡Oops! Algo salió mal</Text>
              <Text style={styles.errorMessage}>
                Ha ocurrido un error inesperado. Por favor, intenta nuevamente.
              </Text>
              
              {__DEV__ && this.state.error && (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugTitle}>Información de Debug:</Text>
                  <Text style={styles.debugText}>
                    Error ID: {this.state.errorId}
                  </Text>
                  <Text style={styles.debugText}>
                    Mensaje: {this.state.error.message}
                  </Text>
                  {this.state.error.stack && (
                    <Text style={styles.debugStack}>
                      Stack: {this.state.error.stack}
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.resetError}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

// HOC para envolver componentes con ErrorBoundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook para manejar errores en componentes funcionales
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    logger.error('Error captured by useErrorHandler:', error);
    setError(error);
  }, []);

  // Si hay error, lanzarlo para que sea capturado por ErrorBoundary
  if (error) {
    throw error;
  }

  return {
    captureError,
    resetError,
    hasError: !!error,
  };
}

// Componente de error específico para listas
export function ListErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <View style={styles.listErrorContainer}>
          <Text style={styles.listErrorTitle}>Error cargando lista</Text>
          <Text style={styles.listErrorMessage}>
            No se pudieron cargar los elementos. Desliza hacia abajo para reintentar.
          </Text>
        </View>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Componente de error específico para formularios
export function FormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <View style={styles.formErrorContainer}>
          <Text style={styles.formErrorTitle}>Error en formulario</Text>
          <Text style={styles.formErrorMessage}>
            Ha ocurrido un error al procesar el formulario. Por favor, verifica los datos e intenta nuevamente.
          </Text>
        </View>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  debugContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  debugStack: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Estilos específicos para listas
  listErrorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
  },
  listErrorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  listErrorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Estilos específicos para formularios
  formErrorContainer: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  formErrorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  formErrorMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
