// src/components/VirtualizedList.tsx
import React, { useMemo, useCallback, memo } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ListRenderItem,
  ViewToken,
} from 'react-native';
import { logger } from '../utils/logger';

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  estimatedItemSize?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
  initialNumToRender?: number;
  getItemLayout?: (data: any, index: number) => { length: number; offset: number; index: number };
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  viewabilityConfig?: any;
  className?: string;
}

// Componente de loading optimizado
const LoadingFooter = memo(() => (
  <View style={styles.loadingFooter}>
    <ActivityIndicator size="small" color="#007AFF" />
    <Text style={styles.loadingText}>Cargando más...</Text>
  </View>
));

// Componente de lista vacía optimizado
const EmptyList = memo(() => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No hay elementos para mostrar</Text>
  </View>
));

// Componente principal de lista virtualizada
function VirtualizedListComponent<T>({
  data,
  renderItem,
  keyExtractor,
  loading = false,
  refreshing = false,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.5,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  estimatedItemSize = 80,
  maxToRenderPerBatch = 10,
  windowSize = 10,
  removeClippedSubviews = true,
  initialNumToRender = 10,
  getItemLayout,
  onViewableItemsChanged,
  viewabilityConfig,
  className,
}: VirtualizedListProps<T>) {
  
  // Memoizar el renderItem para evitar re-renders innecesarios
  const memoizedRenderItem = useCallback<ListRenderItem<T>>((info) => {
    const startTime = performance.now();
    const result = renderItem(info);
    const endTime = performance.now();
    
    if (endTime - startTime > 16) { // Más de 16ms (60fps)
      logger.performance(`Slow render item at index ${info.index}: ${endTime - startTime}ms`);
    }
    
    return result;
  }, [renderItem]);

  // Memoizar el keyExtractor
  const memoizedKeyExtractor = useCallback((item: T, index: number) => {
    return keyExtractor(item, index);
  }, [keyExtractor]);

  // Memoizar el onEndReached para evitar llamadas duplicadas
  const memoizedOnEndReached = useCallback(() => {
    if (onEndReached && !loading) {
      logger.performance('onEndReached triggered');
      onEndReached();
    }
  }, [onEndReached, loading]);

  // Memoizar el onRefresh
  const memoizedOnRefresh = useCallback(() => {
    if (onRefresh) {
      logger.performance('onRefresh triggered');
      onRefresh();
    }
  }, [onRefresh]);

  // Memoizar el refreshControl
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;
    
    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={memoizedOnRefresh}
        colors={['#007AFF']}
        tintColor="#007AFF"
        title="Actualizando..."
        titleColor="#666"
      />
    );
  }, [refreshing, memoizedOnRefresh]);

  // Memoizar el footer component
  const footerComponent = useMemo(() => {
    if (ListFooterComponent) return ListFooterComponent;
    if (loading && data.length > 0) return <LoadingFooter />;
    return null;
  }, [ListFooterComponent, loading, data.length]);

  // Memoizar el empty component
  const emptyComponent = useMemo(() => {
    if (ListEmptyComponent) return ListEmptyComponent;
    if (!loading && data.length === 0) return <EmptyList />;
    return null;
  }, [ListEmptyComponent, loading, data.length]);

  // Configuración de viewability optimizada
  const optimizedViewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
    ...viewabilityConfig,
  }), [viewabilityConfig]);

  return (
    <FlatList
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={memoizedKeyExtractor}
      refreshControl={refreshControl}
      onEndReached={memoizedOnEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListEmptyComponent={emptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={footerComponent}
      estimatedItemSize={estimatedItemSize}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      initialNumToRender={initialNumToRender}
      getItemLayout={getItemLayout}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={optimizedViewabilityConfig}
      style={[styles.list, className]}
      contentContainerStyle={data.length === 0 ? styles.emptyContentContainer : undefined}
    />
  );
}

// Memoizar el componente completo
export const VirtualizedList = memo(VirtualizedListComponent) as <T>(
  props: VirtualizedListProps<T>
) => React.ReactElement;

// Hook para optimizar listas con datos grandes
export function useVirtualizedList<T>(
  data: T[],
  options: {
    pageSize?: number;
    threshold?: number;
  } = {}
) {
  const { pageSize = 20, threshold = 100 } = options;
  
  const [displayData, setDisplayData] = React.useState<T[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  // Memoizar los datos paginados
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(data.length / pageSize);
    const endIndex = currentPage * pageSize;
    const newData = data.slice(0, endIndex);
    
    setHasMore(currentPage < totalPages);
    return newData;
  }, [data, currentPage, pageSize]);

  // Cargar más datos
  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  // Reset cuando cambian los datos
  React.useEffect(() => {
    setCurrentPage(1);
    setDisplayData([]);
  }, [data]);

  // Actualizar datos mostrados
  React.useEffect(() => {
    setDisplayData(paginatedData);
  }, [paginatedData]);

  return {
    data: displayData,
    hasMore,
    loadMore,
    totalItems: data.length,
    currentPage,
    totalPages: Math.ceil(data.length / pageSize),
  };
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
