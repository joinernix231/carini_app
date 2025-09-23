import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import AcceptPolicyScreen from "../screens/AcceptPolicyScreen";
import ClienteDashboard from '../screens/client/ClienteDashboard';
import MisEquipos from '../screens/client/MyDevices/MisEquipos';
import TecnicoDashboard from '../screens/Tecnico/TecnicoDashboard';
import CoordinadorDashboard from '../screens/Coordinator/CoordinadorDashboard';
import AsignarEquipos from '../screens/Coordinator/AsignarEquipos';
import DetalleEquipoCliente from '../screens/client/MyDevices/DetalleEquipo';
import AgregarEquipo from '../screens/client/MyDevices/AgregarEquipo';
import MantenimientosList from '../screens/client/mantenimiento/MantenimientosList';
import CrearMantenimiento from '../screens/client/mantenimiento/CrearMantenimiento';
import DetalleMantenimiento from '../screens/client/mantenimiento/DetalleMantenimiento';
import MiPerfil from '../screens/client/MiPerfil/MiPerfil';
import MisMantenimientos from '../screens/Tecnico/MisMantenimientos';

import AdminDashboard from '../screens/Administrador/AdministradorDashboard';
import ClienteList from '../screens/Administrador/Cliente/ClienteList';
import DetalleCliente from '../screens/Administrador/Cliente/DetalleCliente';
import CrearCliente from '../screens/Administrador/Cliente/CrearCliente';
import EditarCliente from '../screens/Administrador/Cliente/EditarCliente';
import EquipoList from '../screens/Administrador/Equipo/EquipoList';
import CrearEquipo from '../screens/Administrador/Equipo/CrearEquipo';
import DetalleEquipo from '../screens/Administrador/Equipo/DetalleEquipo';
import EditarEquipo from '../screens/Administrador/Equipo/EditarEquipo';
import TecnicoList from '../screens/Administrador/Tecnico/TecnicoList';
import DetalleTecnicoScreen from "../screens/Administrador/Tecnico/DetalleTecnico";
import CrearTecnico from "../screens/Administrador/Tecnico/CrearTecnico";
import EditarTecnico from "../screens/Administrador/Tecnico/EditarTecnico";
import CoordinadorList from "../screens/Administrador/Coordinador/CoordinadorList";
import DetalleCoordinador from "../screens/Administrador/Coordinador/DetalleCoordinador";
import CrearCoordinador from "../screens/Administrador/Coordinador/CrearCoordinador";
import EditarCoordinador from "../screens/Administrador/Coordinador/EditarCoordinador";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user } = useAuth();

  if (!user) {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
    );
  }

  if (user && !user.policy_accepted) {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AcceptPolicy" component={AcceptPolicyScreen} />
        </Stack.Navigator>
    );
  }

  return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user.role === 'cliente' && (
            <>
              <Stack.Screen name="Cliente" component={ClienteDashboard} />
              <Stack.Screen name="MisEquipos" component={MisEquipos} />
              <Stack.Screen name="SolicitarMantenimiento" component={MantenimientosList} />
              <Stack.Screen name="Historial" component={LoginScreen} />
              <Stack.Screen name="Productos" component={LoginScreen} />
              <Stack.Screen name="DetalleEquipo" component={DetalleEquipoCliente} />
              <Stack.Screen name="AgregarEquipo" component={AgregarEquipo} />
              <Stack.Screen name="CrearMantenimiento" component={CrearMantenimiento} />
              <Stack.Screen name="DetalleMantenimiento" component={DetalleMantenimiento} />
              <Stack.Screen name="MiPerfil" component={MiPerfil} />
            </>
        )}

        {user.role === 'tecnico' && (
          <>
            <Stack.Screen name="Tecnico" component={TecnicoDashboard} />
            <Stack.Screen name="MisMantenimientos" component={MisMantenimientos} />
            <Stack.Screen name="MiPerfil" component={MiPerfil} />
          </>
        )}

        {user.role === 'coordinador' && (
            <>
              <Stack.Screen name="Coordinador" component={CoordinadorDashboard} />
              <Stack.Screen name="AsignarEquipos" component={AsignarEquipos} />
            </>
        )}

        {user.role === 'administrador' && (
            <>
              <Stack.Screen name="Admin" component={AdminDashboard} />
              <Stack.Screen name="ClienteList" component={ClienteList} />
              <Stack.Screen name="CrearCliente" component={CrearCliente} />
              <Stack.Screen name="DetalleCliente" component={DetalleCliente} />
              <Stack.Screen name="EditarCliente" component={EditarCliente} />
              <Stack.Screen name="EquipoList" component={EquipoList} />
              <Stack.Screen name="CrearEquipo" component={CrearEquipo} />
              <Stack.Screen name="DetalleEquipoAdmin" component={DetalleEquipo} />
              <Stack.Screen name="EditarEquipo" component={EditarEquipo} />
              <Stack.Screen name="TecnicoList" component={TecnicoList} />
              <Stack.Screen name="DetalleTecnico" component={DetalleTecnicoScreen} />
              <Stack.Screen name="CrearTecnico" component={CrearTecnico} />
              <Stack.Screen name="EditarTecnico" component={EditarTecnico} />
              <Stack.Screen name="CoordinadorList" component={CoordinadorList} />
              <Stack.Screen name="DetalleCoordinador" component={DetalleCoordinador} />
              <Stack.Screen name="CrearCoordinador" component={CrearCoordinador} />
              <Stack.Screen name="EditarCoordinador" component={EditarCoordinador} />
            </>
        )}
      </Stack.Navigator>
  );
}
