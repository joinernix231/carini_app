import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useActiveMaintenance } from '../hooks/useActiveMaintenance';
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
  LazyMantenimientosTecnicoList,
  LazyDetalleMantenimientoTecnico,
  LazyMantenimientosListAdmin,
  LazyCrearMantenimientoAdmin,
} from '../screens/NormalScreens';

// Importar pantallas no lazy (críticas o pequeñas)
import DetalleEquipoCliente from '../screens/client/MyDevices/DetalleEquipo';
import AgregarEquipo from '../screens/client/MyDevices/AgregarEquipo';
import CrearMantenimiento from '../screens/client/mantenimiento/CrearMantenimiento';
import FlujoMantenimientoInfo from '../screens/client/mantenimiento/FlujoMantenimientoInfo';
import DetalleMantenimiento from '../screens/client/mantenimiento/DetalleMantenimiento';
import MiPerfil from '../screens/client/MiPerfil/MiPerfil';
import MiCarnet from '../screens/Tecnico/MiCarnet';
import Parafiscales from '../screens/Tecnico/Parafiscales';
import DetalleMantenimientoTecnico from '../screens/Tecnico/DetalleMantenimiento';
import IniciarMantenimiento from '../screens/Tecnico/IniciarMantenimiento';
import MantenimientoEnProgreso from '../screens/Tecnico/MantenimientoEnProgreso';
import FinalizarMantenimiento from '../screens/Tecnico/FinalizarMantenimiento';
import MantenimientoCompletado from '../screens/Tecnico/MantenimientoCompletado';
import MantenimientosMainScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosMainScreen';
import MantenimientosSinCotizacionScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosSinCotizacionScreen';
import MantenimientosAprobadosScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosAprobadosScreen';
import MantenimientosAsignadosScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosAsignadosScreen';
import MantenimientosScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosScreen';
import DetalleMantenimientoScreen from '../screens/Coordinator/AsignarTecnico/DetalleMantenimientoScreen';
import AsignarTecnicoScreen from '../screens/Coordinator/AsignarTecnico/AsignarTecnicoScreen';
import MantenimientosRechazadosScreen from '../screens/Coordinator/AsignarTecnico/MantenimientosRechazadosScreen';
import MantenimientosSinConfirmar from '../screens/Coordinator/MantenimientosSinConfirmar';
import AsignarTecnicoMainScreen from '../screens/Coordinator/AsignarTecnico/AsignarTecnicoMainScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EquipmentMaintenanceHistory from '../screens/shared/EquipmentMaintenanceHistory';
import ClienteDevicesScreen from '../screens/Administrador/Cliente/ClienteDevicesScreen';
import DetalleEquipoClienteAdmin from '../screens/Administrador/Cliente/DetalleEquipoCliente';
import DetalleMantenimientoEquipo from '../screens/Administrador/Cliente/DetalleMantenimientoEquipo';

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
      <ClienteStack.Screen name="FlujoMantenimientoInfo" component={FlujoMantenimientoInfo} />
      <ClienteStack.Screen name="CrearMantenimiento" component={CrearMantenimiento} />
      <ClienteStack.Screen name="DetalleMantenimiento" component={DetalleMantenimiento} />
      <ClienteStack.Screen name="EquipmentMaintenanceHistory" component={EquipmentMaintenanceHistory} />
      <ClienteStack.Screen name="MiPerfil" component={MiPerfil} />
    </ClienteStack.Navigator>
  );
}

// Componente interno del stack del técnico
function TecnicoStackNavigator() {
  return (
    <TecnicoStack.Navigator 
      screenOptions={commonScreenOptions}
      initialRouteName="TecnicoDashboard"
    >
      <TecnicoStack.Screen name="TecnicoDashboard" component={LazyTecnicoDashboard} />
      <TecnicoStack.Screen name="MisMantenimientos" component={LazyMisMantenimientos} />
      <TecnicoStack.Screen name="DetalleMantenimiento" component={DetalleMantenimientoTecnico} />
      <TecnicoStack.Screen name="IniciarMantenimiento" component={IniciarMantenimiento} />
      <TecnicoStack.Screen name="MantenimientoEnProgreso" component={MantenimientoEnProgreso} />
      <TecnicoStack.Screen name="FinalizarMantenimiento" component={FinalizarMantenimiento} />
      <TecnicoStack.Screen name="MantenimientoCompletado" component={MantenimientoCompletado} />
      <TecnicoStack.Screen name="MiPerfil" component={MiPerfil} />
      <TecnicoStack.Screen name="MiCarnet" component={MiCarnet} />
      <TecnicoStack.Screen name="Parafiscales" component={Parafiscales} />
      <TecnicoStack.Screen name="GestionarDocumentos" component={LazyGestionarDocumentos} />
    </TecnicoStack.Navigator>
  );
}

// Wrapper del TecnicoNavigator con verificación de mantenimiento activo
export function TecnicoNavigator() {
  const navigation = useNavigation();
  const { hasActiveMaintenance, activeMaintenance, isLoading } = useActiveMaintenance();

  useEffect(() => {
    if (!isLoading && hasActiveMaintenance && activeMaintenance) {
      const lastAction = activeMaintenance.last_action_log?.action;
      
      // Si está pausado, NO redirigir automáticamente (el usuario debe ir al detalle manualmente)
      if (lastAction === 'pause') {
        console.log('⏸️ Mantenimiento pausado detectado, no redirigiendo automáticamente');
        return;
      }
      
      // Solo redirigir si está realmente en progreso (start, resume, on_the_way)
      if (lastAction === 'start' || lastAction === 'resume' || lastAction === 'on_the_way') {
        console.log('🚨 REDIRIGIENDO A MANTENIMIENTO ACTIVO:', activeMaintenance.id);
        
        // Redirigir automáticamente al mantenimiento en progreso
        // Usar setTimeout para asegurar que la navegación está lista
        setTimeout(() => {
          (navigation as any).reset({
            index: 0,
            routes: [
              {
                name: 'MantenimientoEnProgreso',
                params: { maintenanceId: activeMaintenance.id },
              },
            ],
          });
        }, 100);
      }
    }
  }, [isLoading, hasActiveMaintenance, activeMaintenance, navigation]);

  // Mostrar loading mientras verifica
  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={loadingStyles.text}>Verificando mantenimientos activos...</Text>
      </View>
    );
  }

  return <TecnicoStackNavigator />;
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
      <CoordinadorStack.Screen name="AsignarTecnicoMain" component={AsignarTecnicoMainScreen} />
      <CoordinadorStack.Screen name="MantenimientosAprobados" component={MantenimientosAprobadosScreen} />
      <CoordinadorStack.Screen name="Mantenimientos" component={MantenimientosScreen} />
      <CoordinadorStack.Screen name="MantenimientosAsignados" component={MantenimientosAsignadosScreen} />
      <CoordinadorStack.Screen name="MantenimientosRechazados" component={MantenimientosRechazadosScreen} />
      <CoordinadorStack.Screen name="MantenimientosSinConfirmar" component={MantenimientosSinConfirmar} />
      <CoordinadorStack.Screen name="DetalleMantenimiento" component={DetalleMantenimientoScreen} />
      <CoordinadorStack.Screen name="AsignarTecnico" component={AsignarTecnicoScreen} />
      <CoordinadorStack.Screen name="Notifications" component={NotificationsScreen} />
      
      {/* Pantallas compartidas con Administrador */}
      {/* Técnicos */}
      <CoordinadorStack.Screen name="TecnicoList" component={LazyTecnicoList} />
      <CoordinadorStack.Screen name="DetalleTecnico" component={LazyDetalleTecnico} />
      <CoordinadorStack.Screen name="MantenimientosTecnicoList" component={LazyMantenimientosTecnicoList} />
      <CoordinadorStack.Screen name="DetalleMantenimientoTecnico" component={LazyDetalleMantenimientoTecnico} />
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
      <AdministradorStack.Screen name="DetalleEquipoCliente" component={DetalleEquipoClienteAdmin} />
      <AdministradorStack.Screen name="DetalleMantenimientoEquipo" component={DetalleMantenimientoEquipo} />
      <AdministradorStack.Screen name="EquipmentMaintenanceHistory" component={EquipmentMaintenanceHistory} />
      <AdministradorStack.Screen name="EditarCliente" component={LazyEditarCliente} />
      
      {/* Equipos */}
      <AdministradorStack.Screen name="EquipoList" component={LazyEquipoList} />
      <AdministradorStack.Screen name="CrearEquipo" component={LazyCrearEquipo} />
      <AdministradorStack.Screen name="DetalleEquipoAdmin" component={LazyDetalleEquipo} />
      <AdministradorStack.Screen name="EditarEquipo" component={LazyEditarEquipo} />
      
      {/* Técnicos */}
      <AdministradorStack.Screen name="TecnicoList" component={LazyTecnicoList} />
      <AdministradorStack.Screen name="DetalleTecnico" component={LazyDetalleTecnico} />
      <AdministradorStack.Screen name="MantenimientosTecnicoList" component={LazyMantenimientosTecnicoList} />
      <AdministradorStack.Screen name="DetalleMantenimientoTecnico" component={LazyDetalleMantenimientoTecnico} />
      <AdministradorStack.Screen name="CrearTecnico" component={LazyCrearTecnico} />
      <AdministradorStack.Screen name="EditarTecnico" component={LazyEditarTecnico} />
      
      {/* Coordinadores */}
      <AdministradorStack.Screen name="CoordinadorList" component={LazyCoordinadorList} />
      <AdministradorStack.Screen name="DetalleCoordinador" component={LazyDetalleCoordinador} />
      <AdministradorStack.Screen name="CrearCoordinador" component={LazyCrearCoordinador} />
      <AdministradorStack.Screen name="EditarCoordinador" component={LazyEditarCoordinador} />
      
      {/* Mantenimientos */}
      <AdministradorStack.Screen name="VerMantenimientos" component={LazyMantenimientosListAdmin} />
      <AdministradorStack.Screen name="CrearMantenimiento" component={LazyCrearMantenimientoAdmin} />
    </AdministradorStack.Navigator>
  );
}

// Estilos para pantalla de loading
const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});

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
