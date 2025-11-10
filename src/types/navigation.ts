// Tipos de navegación específicos para cada rol
// Esto previene navegación incorrecta entre roles

export type ClienteStackParamList = {
  ClienteDashboard: undefined;
  MisEquipos: undefined;
  DetalleEquipo: { deviceId: number };
  AgregarEquipo: undefined;
  SolicitarMantenimiento: { equipoId?: number };
  CrearMantenimiento: { equipoId?: number };
  DetalleMantenimiento: { id: number };
  EquipmentMaintenanceHistory: { deviceId: number; deviceBrand?: string; deviceModel?: string };
  MiPerfil: undefined;
};

export type TecnicoStackParamList = {
  TecnicoDashboard: undefined;
  MisMantenimientos: undefined;
  DetalleMantenimiento: { maintenanceId: number };
  IniciarMantenimiento: { maintenanceId: number };
  MantenimientoEnProgreso: { maintenanceId: number };
  MiPerfil: undefined;
  MiCarnet: undefined;
  Parafiscales: undefined;
};

export type CoordinadorStackParamList = {
  CoordinadorDashboard: undefined;
  AsignarEquipos: undefined;
  MantenimientosSinAsignar: undefined;
  MantenimientosSinConfirmar: undefined;
  AsignarTecnicoMain: undefined;
  AsignarTecnico: { mantenimientoId: number };
  MantenimientosMain: undefined;
  MantenimientosSinCotizacion: undefined;
  MantenimientosAprobados: undefined;
  Mantenimientos: undefined;
  MantenimientosAsignados: undefined;
  MantenimientosRechazados: undefined;
  MantenimientosTecnicoList: { technicianId: number };
  DetalleMantenimientoTecnico: { technicianId: number; maintenanceId: number };
  DetalleMantenimiento: { maintenanceId: number };
  Notifications: undefined;
  TecnicoList: undefined;
  DetalleTecnico: { id: number };
  CrearTecnico: undefined;
  EditarTecnico: { id: number };
  EquipoList: undefined;
  CrearEquipo: undefined;
  DetalleEquipoAdmin: { id: number };
  EditarEquipo: { id: number };
};

export type AdministradorStackParamList = {
  AdminDashboard: undefined;
  ClienteList: undefined;
  CrearCliente: undefined;
  DetalleCliente: { id: number };
  EditarCliente: { id: number };
  ClienteDevices: { clientId: number; clientName: string };
  DetalleEquipoCliente: { clientDeviceId: number; clientDevice: any; clientName: string };
  DetalleMantenimientoEquipo: { maintenanceId: number };
  EquipmentMaintenanceHistory: { deviceId?: number; clientDeviceId?: number; deviceName?: string; deviceBrand?: string; deviceModel?: string; isAdmin?: boolean };
  EquipoList: undefined;
  CrearEquipo: undefined;
  DetalleEquipoAdmin: { id: number };
  EditarEquipo: { id: number };
  TecnicoList: undefined;
  DetalleTecnico: { id: number };
  CrearTecnico: undefined;
  EditarTecnico: { id: number };
  MantenimientosTecnicoList: { technicianId: number };
  DetalleMantenimientoTecnico: { technicianId: number; maintenanceId: number };
  CoordinadorList: undefined;
  DetalleCoordinador: { id: number };
  CrearCoordinador: undefined;
  EditarCoordinador: { id: number };
  VerMantenimientos: undefined;
  CrearMantenimiento: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  AcceptPolicy: undefined;
};

// Tipo unión para el stack principal
export type RootStackParamList = AuthStackParamList & 
  ClienteStackParamList & 
  TecnicoStackParamList & 
  CoordinadorStackParamList & 
  AdministradorStackParamList;
