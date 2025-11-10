import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import BackButton from '../../../components/BackButton';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import { AvailableTechnician } from '../../../services/TecnicoService';
import { AsignarMantenimientoPayload, CoordinadorMantenimientoService } from '../../../services/CoordinadorMantenimientoService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayLocal } from '../../../utils/dateUtils';
import DateShiftSelector from '../../../components/Mantenimiento/DateShiftSelector';
import TechnicianSelector from '../../../components/Mantenimiento/TechnicianSelector';

type RootStackParamList = {
  AsignarTecnico: { mantenimientoId: number };
  DetalleMantenimiento: { mantenimientoId: number };
  CoordinadorDashboard: undefined;
};

type RouteParams = {
  mantenimientoId: number;
};

export default function AsignarTecnicoScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'AsignarTecnico'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuth();
  const { showError } = useError();
  const { mantenimientoId } = route.params;

  const [asignando, setAsignando] = useState(false);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<AvailableTechnician | null>(null);
  
  // Formulario de asignación
  const [fechaMantenimiento, setFechaMantenimiento] = useState('');
  const [turno, setTurno] = useState<'AM' | 'PM'>('AM');

  // Eliminado: manejo de repuestos

  const validarFormulario = useCallback(() => {
    if (!tecnicoSeleccionado) {
      Alert.alert('Error', 'Debe seleccionar un técnico');
      return false;
    }
    if (!fechaMantenimiento) {
      Alert.alert('Error', 'Debe seleccionar una fecha');
      return false;
    }
    return true;
  }, [tecnicoSeleccionado, fechaMantenimiento]);

  const handleAsignar = useCallback(async () => {
    if (!validarFormulario()) return;

    Alert.alert(
      'Confirmar Asignación',
      `¿Deseas asignar a ${tecnicoSeleccionado?.user.name} para este mantenimiento?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Asignar',
          onPress: async () => {
            try {
              setAsignando(true);
              
              const payload: AsignarMantenimientoPayload = {
                date_maintenance: fechaMantenimiento,
                shift: turno,
                technician_id: tecnicoSeleccionado!.id,
              };

              // Llamada real a la API
              if (!token) throw new Error('No hay token de autenticación');
              const result = await CoordinadorMantenimientoService.asignarTecnicoCoordinador(mantenimientoId, payload, token);
              
              Alert.alert(
                'Asignación Exitosa',
                `${tecnicoSeleccionado?.user.name} ha sido asignado al mantenimiento.`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('DetalleMantenimiento', { mantenimientoId }),
                  },
                ]
              );
            } catch (err: any) {
              // Error log removed
              showError(err, 'Error al asignar el técnico');
            } finally {
              setAsignando(false);
            }
          },
        },
      ]
    );
  }, [tecnicoSeleccionado, fechaMantenimiento, turno, validarFormulario, navigation, showError]);

  // Limpiar selección cuando cambien los filtros
  useEffect(() => {
    setTecnicoSeleccionado(null);
  }, [fechaMantenimiento, turno]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      <View style={styles.header}>
        <BackButton color="#fff" />
        <Text style={styles.headerTitle}>Asignar Técnico</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Información de Asignación</Text>
          
          {/* Fecha y Turno */}
          <DateShiftSelector
            fechaMantenimiento={fechaMantenimiento}
            turno={turno}
            onFechaChange={setFechaMantenimiento}
            onTurnoChange={setTurno}
            fechaLabel="Fecha del Mantenimiento *"
            turnoLabel="Turno *"
            fechaPlaceholder="Seleccionar fecha del mantenimiento"
            minimumDate={getTodayLocal()}
          />
        </View>

        {/* Selector de Técnico */}
        <View style={styles.formContainer}>
          <TechnicianSelector
            fechaMantenimiento={fechaMantenimiento}
            turno={turno}
            tecnicoSeleccionado={tecnicoSeleccionado}
            onTecnicoSeleccionado={setTecnicoSeleccionado}
            tecnicoOpcional={false}
            showLabel={true}
          />
        </View>

        {tecnicoSeleccionado && (
          <View style={styles.asignarContainer}>
            <TouchableOpacity
              style={[styles.asignarButton, asignando && styles.asignarButtonDisabled]}
              onPress={handleAsignar}
              disabled={asignando}
            >
              {asignando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="person-add" size={20} color="#fff" />
                  <Text style={styles.asignarButtonText}>
                    Asignar a {tecnicoSeleccionado.user.name}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1976D2',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  formContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 16,
  },
  asignarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  asignarButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  asignarButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  asignarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  noTecnicosContainer: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 16,
  },
  noTecnicosTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  noTecnicosText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
