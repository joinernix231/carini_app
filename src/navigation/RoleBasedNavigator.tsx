import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Importar todas las pantallas
import LoginScreen from '../screens/LoginScreen';
import AcceptPolicyScreen from '../screens/AcceptPolicyScreen';

// Cliente screens
import ClienteDashboard from '../screens/client/ClienteDashboard';
import MisEquipos from '../screens/client/MyDevices/MisEquipos';
import DetalleEquipoCliente from '../screens/client/MyDevices/DetalleEquipo';
import AgregarEquipo from '../screens/client/MyDevices/AgregarEquipo';
import MantenimientosList from '../screens/client/mantenimiento/MantenimientosList';
import CrearMantenimiento from '../screens/client/mantenimiento/CrearMantenimiento';
import DetalleMantenimiento from '../screens/client/mantenimiento/DetalleMantenimiento';
import MiPerfil from '../screens/client/MiPerfil/MiPerfil';

// Técnico screens
import TecnicoDashboard from '../screens/Tecnico/TecnicoDashboard';
import MisMantenimientos from '../screens/Tecnico/MisMantenimientos';

// Coordinador screens
import CoordinadorDashboard from '../screens/Coordinator/CoordinadorDashboard';
import AsignarEquipos from '../screens/Coordinator/AsignarEquipos';
import MantenimientosSinAsignarScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosSinAsignarScreen';
import MantenimientosAsignadosScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosAsignadosScreen';
import DetalleMantenimientoScreen from '../screens/Coordinator/AsignarTecnico/DetalleMantenimientoScreen';
import AsignarTecnicoScreen from '../screens/Coordinator/AsignarTecnico/AsignarTecnicoScreen';

// Administrador screens
import AdminDashboard from '../screens/Administrador/AdministradorDashboard';
import ClienteList from '../screens/Administrador/Cliente/ClienteList';
import DetalleCliente from '../screens/Administrador/Cliente/DetalleCliente';
import ClienteDevicesScreen from '../screens/Administrador/Cliente/ClienteDevicesScreen';
import CrearCliente from '../screens/Administrador/Cliente/CrearCliente';
import EditarCliente from '../screens/Administrador/Cliente/EditarCliente';
import EquipoList from '../screens/Administrador/Equipo/EquipoList';
import CrearEquipo from '../screens/Administrador/Equipo/CrearEquipo';
import DetalleEquipo from '../screens/Administrador/Equipo/DetalleEquipo';
import EditarEquipo from '../screens/Administrador/Equipo/EditarEquipo';
import TecnicoList from '../screens/Administrador/Tecnico/TecnicoList';
import DetalleTecnicoScreen from '../screens/Administrador/Tecnico/DetalleTecnico';
import CrearTecnico from '../screens/Administrador/Tecnico/CrearTecnico';
import EditarTecnico from '../screens/Administrador/Tecnico/EditarTecnico';
import CoordinadorList from '../screens/Administrador/Coordinador/CoordinadorList';
import DetalleCoordinador from '../screens/Administrador/Coordinador/DetalleCoordinador';
import CrearCoordinador from '../screens/Administrador/Coordinador/CrearCoordinador';
import EditarCoordinador from '../screens/Administrador/Coordinador/EditarCoordinador';

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
      <ClienteStack.Screen name="ClienteDashboard" component={ClienteDashboard} />
      <ClienteStack.Screen name="MisEquipos" component={MisEquipos} />
      <ClienteStack.Screen name="DetalleEquipo" component={DetalleEquipoCliente} />
      <ClienteStack.Screen name="AgregarEquipo" component={AgregarEquipo} />
      <ClienteStack.Screen name="SolicitarMantenimiento" component={MantenimientosList} />
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
      <TecnicoStack.Screen name="TecnicoDashboard" component={TecnicoDashboard} />
      <TecnicoStack.Screen name="MisMantenimientos" component={MisMantenimientos} />
      <TecnicoStack.Screen name="DetalleMantenimiento" component={DetalleMantenimientoScreen} />
      <TecnicoStack.Screen name="MiPerfil" component={MiPerfil} />
    </TecnicoStack.Navigator>
  );
}

export function CoordinadorNavigator() {
  return (
    <CoordinadorStack.Navigator 
      screenOptions={commonScreenOptions}
      initialRouteName="CoordinadorDashboard"
    >
      <CoordinadorStack.Screen name="CoordinadorDashboard" component={CoordinadorDashboard} />
      <CoordinadorStack.Screen name="AsignarEquipos" component={AsignarEquipos} />
      <CoordinadorStack.Screen name="MantenimientosSinAsignar" component={MantenimientosSinAsignarScreen} />
      <CoordinadorStack.Screen name="MantenimientosAsignados" component={MantenimientosAsignadosScreen} />
      <CoordinadorStack.Screen name="DetalleMantenimiento" component={DetalleMantenimientoScreen} />
      <CoordinadorStack.Screen name="AsignarTecnico" component={AsignarTecnicoScreen} />
      
      {/* Pantallas compartidas con Administrador */}
      {/* Técnicos */}
      <CoordinadorStack.Screen name="TecnicoList" component={TecnicoList} />
      <CoordinadorStack.Screen name="DetalleTecnico" component={DetalleTecnicoScreen} />
      <CoordinadorStack.Screen name="CrearTecnico" component={CrearTecnico} />
      <CoordinadorStack.Screen name="EditarTecnico" component={EditarTecnico} />
      
      {/* Equipos */}
      <CoordinadorStack.Screen name="EquipoList" component={EquipoList} />
      <CoordinadorStack.Screen name="CrearEquipo" component={CrearEquipo} />
      <CoordinadorStack.Screen name="DetalleEquipoAdmin" component={DetalleEquipo} />
      <CoordinadorStack.Screen name="EditarEquipo" component={EditarEquipo} />
    </CoordinadorStack.Navigator>
  );
}

export function AdministradorNavigator() {
  return (
    <AdministradorStack.Navigator 
      screenOptions={commonScreenOptions}
      initialRouteName="AdminDashboard"
    >
      <AdministradorStack.Screen name="AdminDashboard" component={AdminDashboard} />
      
      {/* Clientes */}
      <AdministradorStack.Screen name="ClienteList" component={ClienteList} />
      <AdministradorStack.Screen name="CrearCliente" component={CrearCliente} />
      <AdministradorStack.Screen name="DetalleCliente" component={DetalleCliente} />
      <AdministradorStack.Screen name="ClienteDevices" component={ClienteDevicesScreen} />
      <AdministradorStack.Screen name="EditarCliente" component={EditarCliente} />
      
      {/* Equipos */}
      <AdministradorStack.Screen name="EquipoList" component={EquipoList} />
      <AdministradorStack.Screen name="CrearEquipo" component={CrearEquipo} />
      <AdministradorStack.Screen name="DetalleEquipoAdmin" component={DetalleEquipo} />
      <AdministradorStack.Screen name="EditarEquipo" component={EditarEquipo} />
      
      {/* Técnicos */}
      <AdministradorStack.Screen name="TecnicoList" component={TecnicoList} />
      <AdministradorStack.Screen name="DetalleTecnico" component={DetalleTecnicoScreen} />
      <AdministradorStack.Screen name="CrearTecnico" component={CrearTecnico} />
      <AdministradorStack.Screen name="EditarTecnico" component={EditarTecnico} />
      
      {/* Coordinadores */}
      <AdministradorStack.Screen name="CoordinadorList" component={CoordinadorList} />
      <AdministradorStack.Screen name="DetalleCoordinador" component={DetalleCoordinador} />
      <AdministradorStack.Screen name="CrearCoordinador" component={CrearCoordinador} />
      <AdministradorStack.Screen name="EditarCoordinador" component={EditarCoordinador} />
    </AdministradorStack.Navigator>
  );
}

// Componente principal que decide qué navegador usar
export function RoleBasedNavigator() {
  const { user } = useAuth();

  // No autenticado
  if (!user) {
    return <AuthNavigator />;
  }

  // No ha aceptado políticas - forzar pantalla de políticas
  if (!user.policy_accepted) {
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
      return <AuthNavigator />;
  }
}
