import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger';

// Importar pantallas críticas (no lazy)
import LoginScreen from '../screens/LoginScreen';
import AcceptPolicyScreen from '../screens/AcceptPolicyScreen';

// Importar pantallas (usando versiones normales temporalmente)
import {
  LazyAdminDashboard,
  LazyClienteList,
  LazyTecnicoList,
  LazyEquipoList,
  LazyCoordinadorList,
  LazyTecnicoDashboard,
  LazyMisMantenimientos,
  LazyGestionarDocumentos,
  LazyCoordinadorDashboard,
  LazyAsignarEquipos,
  LazyClienteDashboard,
  LazyMisEquipos,
  LazyMantenimientosList,
  LazyCrearCliente,
  LazyCrearTecnico,
  LazyCrearEquipo,
  LazyCrearCoordinador,
  LazyEditarCliente,
  LazyEditarTecnico,
  LazyEditarEquipo,
  LazyEditarCoordinador,
  LazyDetalleCliente,
  LazyDetalleTecnico,
  LazyDetalleEquipo,
  LazyDetalleCoordinador,
} from '../screens/NormalScreens';

// Importar pantallas no lazy (críticas o pequeñas)
import DetalleEquipoCliente from '../screens/client/MyDevices/DetalleEquipo';
import AgregarEquipo from '../screens/client/MyDevices/AgregarEquipo';
import CrearMantenimiento from '../screens/client/mantenimiento/CrearMantenimiento';
import DetalleMantenimiento from '../screens/client/mantenimiento/DetalleMantenimiento';
import MiPerfil from '../screens/client/MiPerfil/MiPerfil';
import MiCarnet from '../screens/Tecnico/MiCarnet';
import Parafiscales from '../screens/Tecnico/Parafiscales';
import MantenimientosMainScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosMainScreen';
import MantenimientosSinCotizacionScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosSinCotizacionScreen';
import MantenimientosAprobadosScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosAprobadosScreen';
import MantenimientosAsignadosScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosAsignadosScreen';
import MantenimientosScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosScreen';
import DetalleMantenimientoScreen from '../screens/Coordinator/AsignarTecnico/DetalleMantenimientoScreen';
import AsignarTecnicoScreen from '../screens/Coordinator/AsignarTecnico/AsignarTecnicoScreen';
import MantenimientosRechazadosScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosRechazadosScreen';
import ClienteDevicesScreen from '../screens/Administrador/Cliente/ClienteDevicesScreen';

// Stack Navigators por rol
const AuthStack = createNativeStackNavigator();
const ClienteStack = createNativeStackNavigator();
const TecnicoStack = createNativeStackNavigator();
const CoordinadorStack = createNativeStackNavigator();
const AdministradorStack = createNativeStackNavigator();

// Configuración común de pantallas
const commonScreenOptions = {
  headerShown: false,
  gestureEnabled: true,
  animation: 'slide_from_right' as const,
};

export function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={commonScreenOptions}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="AcceptPolicy" component={AcceptPolicyScreen} />
    </AuthStack.Navigator>
  );
}

export function ClienteNavigator() {
  return (
    <ClienteStack.Navigator 
      screenOptions={commonScreenOptions}
      initialRouteName="ClienteDashboard"
    >
      <ClienteStack.Screen name="ClienteDashboard" component={LazyClienteDashboard} />
      <ClienteStack.Screen name="MisEquipos" component={LazyMisEquipos} />
      <ClienteStack.Screen name="DetalleEquipo" component={DetalleEquipoCliente} />
      <ClienteStack.Screen name="AgregarEquipo" component={AgregarEquipo} />
      <ClienteStack.Screen name="SolicitarMantenimiento" component={LazyMantenimientosList} />
      <ClienteStack.Screen name="CrearMantenimiento" component={CrearMantenimiento} />
      <ClienteStack.Screen name="DetalleMantenimiento" component={DetalleMantenimiento} />
      <ClienteStack.Screen name="MiPerfil" component={MiPerfil} />
    </ClienteStack.Navigator>
  );
}

export function TecnicoNavigator() {
  return (
    <TecnicoStack.Navigator 
      screenOptions={commonScreenOptions}
      initialRouteName="TecnicoDashboard"
    >
      <TecnicoStack.Screen name="TecnicoDashboard" component={LazyTecnicoDashboard} />
      <TecnicoStack.Screen name="MisMantenimientos" component={LazyMisMantenimientos} />
      <TecnicoStack.Screen name="DetalleMantenimiento" component={DetalleMantenimientoScreen} />
      <TecnicoStack.Screen name="MiPerfil" component={MiPerfil} />
      <TecnicoStack.Screen name="MiCarnet" component={MiCarnet} />
      <TecnicoStack.Screen name="Parafiscales" component={Parafiscales} />
      <TecnicoStack.Screen name="GestionarDocumentos" component={LazyGestionarDocumentos} />
    </TecnicoStack.Navigator>
  );
}

export function CoordinadorNavigator() {
  return (
    <CoordinadorStack.Navigator 
      screenOptions={commonScreenOptions}
      initialRouteName="CoordinadorDashboard"
    >
      <CoordinadorStack.Screen name="CoordinadorDashboard" component={LazyCoordinadorDashboard} />
      <CoordinadorStack.Screen name="AsignarEquipos" component={LazyAsignarEquipos} />
      <CoordinadorStack.Screen name="MantenimientosMain" component={MantenimientosMainScreen} />
      <CoordinadorStack.Screen name="MantenimientosSinCotizacion" component={MantenimientosSinCotizacionScreen} />
      <CoordinadorStack.Screen name="MantenimientosAprobados" component={MantenimientosAprobadosScreen} />
      <CoordinadorStack.Screen name="Mantenimientos" component={MantenimientosScreen} />
      <CoordinadorStack.Screen name="MantenimientosAsignados" component={MantenimientosAsignadosScreen} />
      <CoordinadorStack.Screen name="MantenimientosRechazados" component={MantenimientosRechazadosScreen} />
      <CoordinadorStack.Screen name="DetalleMantenimiento" component={DetalleMantenimientoScreen} />
      <CoordinadorStack.Screen name="AsignarTecnico" component={AsignarTecnicoScreen} />
      
      {/* Pantallas compartidas con Administrador */}
      {/* Técnicos */}
      <CoordinadorStack.Screen name="TecnicoList" component={LazyTecnicoList} />
      <CoordinadorStack.Screen name="DetalleTecnico" component={LazyDetalleTecnico} />
      <CoordinadorStack.Screen name="CrearTecnico" component={LazyCrearTecnico} />
      <CoordinadorStack.Screen name="EditarTecnico" component={LazyEditarTecnico} />
      
      {/* Equipos */}
      <CoordinadorStack.Screen name="EquipoList" component={LazyEquipoList} />
      <CoordinadorStack.Screen name="CrearEquipo" component={LazyCrearEquipo} />
      <CoordinadorStack.Screen name="DetalleEquipoAdmin" component={LazyDetalleEquipo} />
      <CoordinadorStack.Screen name="EditarEquipo" component={LazyEditarEquipo} />
    </CoordinadorStack.Navigator>
  );
}

export function AdministradorNavigator() {
  return (
    <AdministradorStack.Navigator 
      screenOptions={commonScreenOptions}
      initialRouteName="AdminDashboard"
    >
      <AdministradorStack.Screen name="AdminDashboard" component={LazyAdminDashboard} />
      
      {/* Clientes */}
      <AdministradorStack.Screen name="ClienteList" component={LazyClienteList} />
      <AdministradorStack.Screen name="CrearCliente" component={LazyCrearCliente} />
      <AdministradorStack.Screen name="DetalleCliente" component={LazyDetalleCliente} />
      <AdministradorStack.Screen name="ClienteDevices" component={ClienteDevicesScreen} />
      <AdministradorStack.Screen name="EditarCliente" component={LazyEditarCliente} />
      
      {/* Equipos */}
      <AdministradorStack.Screen name="EquipoList" component={LazyEquipoList} />
      <AdministradorStack.Screen name="CrearEquipo" component={LazyCrearEquipo} />
      <AdministradorStack.Screen name="DetalleEquipoAdmin" component={LazyDetalleEquipo} />
      <AdministradorStack.Screen name="EditarEquipo" component={LazyEditarEquipo} />
      
      {/* Técnicos */}
      <AdministradorStack.Screen name="TecnicoList" component={LazyTecnicoList} />
      <AdministradorStack.Screen name="DetalleTecnico" component={LazyDetalleTecnico} />
      <AdministradorStack.Screen name="CrearTecnico" component={LazyCrearTecnico} />
      <AdministradorStack.Screen name="EditarTecnico" component={LazyEditarTecnico} />
      
      {/* Coordinadores */}
      <AdministradorStack.Screen name="CoordinadorList" component={LazyCoordinadorList} />
      <AdministradorStack.Screen name="DetalleCoordinador" component={LazyDetalleCoordinador} />
      <AdministradorStack.Screen name="CrearCoordinador" component={LazyCrearCoordinador} />
      <AdministradorStack.Screen name="EditarCoordinador" component={LazyEditarCoordinador} />
    </AdministradorStack.Navigator>
  );
}

// Componente principal que decide qué navegador usar
export function RoleBasedNavigator() {
  const { user } = useAuth();

  // Logging para debugging de navegación
  React.useEffect(() => {
    if (user) {
      logger.navigation(`User role: ${user.role}, policy_accepted: ${user.policy_accepted}`);
    } else {
      logger.navigation('No user authenticated');
    }
  }, [user]);

  // No autenticado
  if (!user) {
    logger.navigation('Rendering AuthNavigator - no user');
    return <AuthNavigator />;
  }

  // No ha aceptado políticas - forzar pantalla de políticas
  if (!user.policy_accepted) {
    logger.navigation('Rendering AcceptPolicy screen - policy not accepted');
    return (
      <AuthStack.Navigator 
        screenOptions={commonScreenOptions}
        initialRouteName="AcceptPolicy"
      >
        <AuthStack.Screen name="AcceptPolicy" component={AcceptPolicyScreen} />
      </AuthStack.Navigator>
    );
  }

  // Navegadores por rol
  logger.navigation(`Rendering navigator for role: ${user.role}`);
  switch (user.role) {
    case 'cliente':
      return <ClienteNavigator />;
    case 'tecnico':
      return <TecnicoNavigator />;
    case 'coordinador':
      return <CoordinadorNavigator />;
    case 'administrador':
      return <AdministradorNavigator />;
    default:
      logger.warn(`Unknown user role: ${user.role}, falling back to AuthNavigator`);
      return <AuthNavigator />;
  }
}
