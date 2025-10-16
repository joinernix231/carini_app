// src/components/LazyScreen.tsx
import React, { Suspense, ComponentType, ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { logger } from '../utils/logger';

interface LazyScreenProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

// Componente de loading personalizable
const DefaultFallback = ({ name }: { name?: string }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#007AFF" />
    {name && (
      <View style={styles.textContainer}>
        <Text style={styles.loadingText}>Cargando {name}...</Text>
      </View>
    )}
  </View>
);

export function LazyScreen({ 
  children, 
  fallback, 
  name 
}: LazyScreenProps) {
  const startTime = React.useRef(Date.now());

  React.useEffect(() => {
    const loadTime = Date.now() - startTime.current;
    logger.performance(`Screen ${name || 'Unknown'} loaded in ${loadTime}ms`);
  }, [name]);

  return (
    <Suspense fallback={fallback || <DefaultFallback name={name} />}>
      {children}
    </Suspense>
  );
}

// Hook para lazy loading de componentes
export function useLazyComponent<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  componentName?: string
) {
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    
    const loadComponent = async () => {
      try {
        logger.performance(`Loading component: ${componentName || 'Unknown'}`);
        const startTime = Date.now();
        
        const module = await importFunction();
        
        if (isMounted) {
          const loadTime = Date.now() - startTime;
          logger.performance(`Component ${componentName || 'Unknown'} loaded in ${loadTime}ms`);
          setComponent(module.default);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          logger.error(`Error loading component ${componentName || 'Unknown'}:`, err);
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [importFunction, componentName]);

  return { Component, loading, error };
}

// HOC para lazy loading
export function withLazyLoading<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  componentName?: string
) {
  const LazyComponent = React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    const { Component, loading, error } = useLazyComponent(importFunction, componentName);

    if (loading) {
      return <DefaultFallback name={componentName} />;
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Error cargando {componentName || 'componente'}
          </Text>
        </View>
      );
    }

    if (!Component) {
      return null;
    }

    return <Component {...props} ref={ref} />;
  });

  LazyComponent.displayName = `LazyComponent(${componentName || 'Unknown'})`;
  
  return LazyComponent;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  textContainer: {
    marginTop: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
});
