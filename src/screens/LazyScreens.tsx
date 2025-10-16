// src/screens/LazyScreens.tsx
// Pantallas lazy para optimizar el bundle inicial

import React, { Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Componente de loading simple
const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

// HOC simple para lazy loading
function withLazyLoading<T extends React.ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>
) {
  const LazyComponent = React.lazy(importFunction);
  
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => (
    <Suspense fallback={<LoadingFallback />}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
}

// Pantallas de Administrador (más pesadas)
export const LazyAdminDashboard = withLazyLoading(
  () => import('./Administrador/AdministradorDashboard')
);

export const LazyClienteList = withLazyLoading(
  () => import('./Administrador/Cliente/ClienteList')
);

export const LazyTecnicoList = withLazyLoading(
  () => import('./Administrador/Tecnico/TecnicoList')
);

export const LazyEquipoList = withLazyLoading(
  () => import('./Administrador/Equipo/EquipoList')
);

export const LazyCoordinadorList = withLazyLoading(
  () => import('./Administrador/Coordinador/CoordinadorList')
);

// Pantallas de Técnico
export const LazyTecnicoDashboard = withLazyLoading(
  () => import('./Tecnico/TecnicoDashboard')
);

export const LazyMisMantenimientos = withLazyLoading(
  () => import('./Tecnico/MisMantenimientos')
);

export const LazyGestionarDocumentos = withLazyLoading(
  () => import('./Tecnico/GestionarDocumentos')
);

// Pantallas de Coordinador
export const LazyCoordinadorDashboard = withLazyLoading(
  () => import('./Coordinator/CoordinadorDashboard')
);

export const LazyAsignarEquipos = withLazyLoading(
  () => import('./Coordinator/AsignarEquipos')
);

// Pantallas de Cliente
export const LazyClienteDashboard = withLazyLoading(
  () => import('./client/ClienteDashboard')
);

export const LazyMisEquipos = withLazyLoading(
  () => import('./client/MyDevices/MisEquipos')
);

export const LazyMantenimientosList = withLazyLoading(
  () => import('./client/mantenimiento/MantenimientosList')
);

// Pantallas de formularios (más pesadas)
export const LazyCrearCliente = withLazyLoading(
  () => import('./Administrador/Cliente/CrearCliente')
);

export const LazyCrearTecnico = withLazyLoading(
  () => import('./Administrador/Tecnico/CrearTecnico')
);

export const LazyCrearEquipo = withLazyLoading(
  () => import('./Administrador/Equipo/CrearEquipo')
);

export const LazyCrearCoordinador = withLazyLoading(
  () => import('./Administrador/Coordinador/CrearCoordinador')
);

// Pantallas de edición
export const LazyEditarCliente = withLazyLoading(
  () => import('./Administrador/Cliente/EditarCliente')
);

export const LazyEditarTecnico = withLazyLoading(
  () => import('./Administrador/Tecnico/EditarTecnico')
);

export const LazyEditarEquipo = withLazyLoading(
  () => import('./Administrador/Equipo/EditarEquipo')
);

export const LazyEditarCoordinador = withLazyLoading(
  () => import('./Administrador/Coordinador/EditarCoordinador')
);

// Pantallas de detalle
export const LazyDetalleCliente = withLazyLoading(
  () => import('./Administrador/Cliente/DetalleCliente')
);

export const LazyDetalleTecnico = withLazyLoading(
  () => import('./Administrador/Tecnico/DetalleTecnico')
);

export const LazyDetalleEquipo = withLazyLoading(
  () => import('./Administrador/Equipo/DetalleEquipo')
);

export const LazyDetalleCoordinador = withLazyLoading(
  () => import('./Administrador/Coordinador/DetalleCoordinador')
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
