// src/hooks/useOptimisticUpdates.ts
import { useState, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any, originalData: T) => void;
  rollbackOnError?: boolean;
  timeout?: number;
}

interface OptimisticUpdateState<T> {
  data: T;
  isOptimistic: boolean;
  error: any;
  isUpdating: boolean;
}

export function useOptimisticUpdates<T>(
  initialData: T,
  options: OptimisticUpdateOptions<T> = {}
) {
  const {
    onSuccess,
    onError,
    rollbackOnError = true,
    timeout = 10000
  } = options;

  const [state, setState] = useState<OptimisticUpdateState<T>>({
    data: initialData,
    isOptimistic: false,
    error: null,
    isUpdating: false,
  });

  const originalDataRef = useRef<T>(initialData);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Actualizar datos optimistamente
  const updateOptimistically = useCallback(async (
    optimisticData: T,
    updateFunction: () => Promise<T>
  ) => {
    // Guardar datos originales para rollback
    originalDataRef.current = state.data;
    
    // Actualizar UI inmediatamente
    setState(prev => ({
      ...prev,
      data: optimisticData,
      isOptimistic: true,
      isUpdating: true,
      error: null,
    }));

    logger.debug('Optimistic update applied:', optimisticData);

    try {
      // Configurar timeout
      if (timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          throw new Error('Update timeout');
        }, timeout);
      }

      // Ejecutar actualización real
      const result = await updateFunction();
      
      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Actualizar con datos reales
      setState(prev => ({
        ...prev,
        data: result,
        isOptimistic: false,
        isUpdating: false,
        error: null,
      }));

      logger.debug('Optimistic update confirmed:', result);
      onSuccess?.(result);

    } catch (error) {
      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      logger.error('Optimistic update failed:', error);

      if (rollbackOnError) {
        // Rollback a datos originales
        setState(prev => ({
          ...prev,
          data: originalDataRef.current,
          isOptimistic: false,
          isUpdating: false,
          error,
        }));
      } else {
        // Mantener datos optimistas pero marcar error
        setState(prev => ({
          ...prev,
          isOptimistic: false,
          isUpdating: false,
          error,
        }));
      }

      onError?.(error, originalDataRef.current);
    }
  }, [state.data, onSuccess, onError, rollbackOnError, timeout]);

  // Actualizar datos sin optimistic update
  const update = useCallback(async (updateFunction: () => Promise<T>) => {
    setState(prev => ({
      ...prev,
      isUpdating: true,
      error: null,
    }));

    try {
      const result = await updateFunction();
      
      setState(prev => ({
        ...prev,
        data: result,
        isUpdating: false,
        error: null,
      }));

      onSuccess?.(result);
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isUpdating: false,
        error,
      }));

      onError?.(error, state.data);
      throw error;
    }
  }, [onSuccess, onError, state.data]);

  // Resetear estado
  const reset = useCallback(() => {
    setState({
      data: initialData,
      isOptimistic: false,
      error: null,
      isUpdating: false,
    });
    originalDataRef.current = initialData;
  }, [initialData]);

  // Limpiar timeout al desmontar
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    data: state.data,
    isOptimistic: state.isOptimistic,
    isUpdating: state.isUpdating,
    error: state.error,
    updateOptimistically,
    update,
    reset,
    cleanup,
  };
}

// Hook específico para listas con optimistic updates
export function useOptimisticList<T>(
  initialList: T[],
  options: OptimisticUpdateOptions<T[]> = {}
) {
  const optimisticUpdates = useOptimisticUpdates(initialList, options);

  // Agregar item optimistamente
  const addItemOptimistically = useCallback(async (
    newItem: T,
    addFunction: (item: T) => Promise<T[]>
  ) => {
    const optimisticList = [...optimisticUpdates.data, newItem];
    
    await optimisticUpdates.updateOptimistically(
      optimisticList,
      () => addFunction(newItem)
    );
  }, [optimisticUpdates]);

  // Eliminar item optimistamente
  const removeItemOptimistically = useCallback(async (
    itemId: string | number,
    getItemId: (item: T) => string | number,
    removeFunction: (id: string | number) => Promise<T[]>
  ) => {
    const optimisticList = optimisticUpdates.data.filter(
      item => getItemId(item) !== itemId
    );
    
    await optimisticUpdates.updateOptimistically(
      optimisticList,
      () => removeFunction(itemId)
    );
  }, [optimisticUpdates]);

  // Actualizar item optimistamente
  const updateItemOptimistically = useCallback(async (
    itemId: string | number,
    updatedItem: T,
    getItemId: (item: T) => string | number,
    updateFunction: (id: string | number, item: T) => Promise<T[]>
  ) => {
    const optimisticList = optimisticUpdates.data.map(item =>
      getItemId(item) === itemId ? updatedItem : item
    );
    
    await optimisticUpdates.updateOptimistically(
      optimisticList,
      () => updateFunction(itemId, updatedItem)
    );
  }, [optimisticUpdates]);

  return {
    ...optimisticUpdates,
    addItemOptimistically,
    removeItemOptimistically,
    updateItemOptimistically,
  };
}

// Hook para formularios con optimistic updates
export function useOptimisticForm<T>(
  initialData: T,
  options: OptimisticUpdateOptions<T> = {}
) {
  const optimisticUpdates = useOptimisticUpdates(initialData, options);

  // Enviar formulario optimistamente
  const submitOptimistically = useCallback(async (
    formData: T,
    submitFunction: (data: T) => Promise<T>
  ) => {
    await optimisticUpdates.updateOptimistically(
      formData,
      () => submitFunction(formData)
    );
  }, [optimisticUpdates]);

  return {
    ...optimisticUpdates,
    submitOptimistically,
  };
}
