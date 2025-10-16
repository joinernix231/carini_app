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
  MiPerfil: undefined;
};

export type TecnicoStackParamList = {
  TecnicoDashboard: undefined;
  MisMantenimientos: undefined;
  MiPerfil: undefined;
  MiCarnet: undefined;
  Parafiscales: undefined;
};

export type CoordinadorStackParamList = {
  CoordinadorDashboard: undefined;
  AsignarEquipos: undefined;
  MantenimientosSinAsignar: undefined;
  AsignarTecnico: { mantenimientoId: number };
};

export type AdministradorStackParamList = {
  AdminDashboard: undefined;
  ClienteList: undefined;
  CrearCliente: undefined;
  DetalleCliente: { id: number };
  EditarCliente: { id: number };
  EquipoList: undefined;
  CrearEquipo: undefined;
  DetalleEquipoAdmin: { id: number };
  EditarEquipo: { id: number };
  TecnicoList: undefined;
  DetalleTecnico: { id: number };
  CrearTecnico: undefined;
  EditarTecnico: { id: number };
  CoordinadorList: undefined;
  DetalleCoordinador: { id: number };
  CrearCoordinador: undefined;
  EditarCoordinador: { id: number };
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
