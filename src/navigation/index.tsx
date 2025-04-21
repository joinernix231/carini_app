import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import ClienteDashboard from '../screens/client/ClienteDashboard';
import MisEquipos from '../screens/client/MisEquipos';
import TecnicoDashboard from '../screens/TecnicoDashboard';
import CoordinadorDashboard from '../screens/CoordinadorDashboard';
import DetalleEquipo from '../screens/client/DetalleEquipo';
import MantenimientosList from '../screens/client/mantenimiento/MantenimientosList';  
import CrearMantenimiento from '../screens/client/mantenimiento/CrearMantenimiento';

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

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user.role === 'cliente' && (
        <>
          <Stack.Screen name="Cliente" component={ClienteDashboard} />
          <Stack.Screen name="MisEquipos" component={MisEquipos} />
          <Stack.Screen name="SolicitarMantenimiento" component={MantenimientosList} />
          <Stack.Screen name="Historial" component={LoginScreen} />
          <Stack.Screen name="Productos" component={LoginScreen} />
          <Stack.Screen name="DetalleEquipo" component={DetalleEquipo} />
          <Stack.Screen name="CrearMantenimiento" component={CrearMantenimiento} />
        </>
      )}
      {user.role === 'tecnico' && <Stack.Screen name="Tecnico" component={TecnicoDashboard} />}
      {user.role === 'coordinador' && <Stack.Screen name="Coordinador" component={CoordinadorDashboard} />}
    </Stack.Navigator>
  );
}
