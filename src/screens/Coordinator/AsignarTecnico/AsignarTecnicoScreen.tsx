import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  
  StatusBar,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import BackButton from '../../../components/BackButton';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import { TecnicoService, AvailableTechnician } from '../../../services/TecnicoService';
import { AsignarMantenimientoPayload, CoordinadorMantenimientoService } from '../../../services/CoordinadorMantenimientoService';
import DatePicker from '../../../components/Calendar/DatePicker';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const [tecnicos, setTecnicos] = useState<AvailableTechnician[]>([]);
  const [tecnicosFiltrados, setTecnicosFiltrados] = useState<AvailableTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [asignando, setAsignando] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<AvailableTechnician | null>(null);
  
  // Formulario de asignación
  const [fechaMantenimiento, setFechaMantenimiento] = useState('');
  const [turno, setTurno] = useState<'AM' | 'PM'>('AM');
  // Eliminados: valor y repuestos

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      // Solo cargar técnicos si hay fecha seleccionada
      if (fechaMantenimiento) {
        const tecnicosData = await TecnicoService.getAvailableTechnicians(
          token, 
          fechaMantenimiento, 
          turno
        );
        setTecnicos(tecnicosData);
        setTecnicosFiltrados(tecnicosData);
      } else {
        // Si no hay fecha, limpiar la lista
        setTecnicos([]);
        setTecnicosFiltrados([]);
      }
    } catch (err: any) {
      // Error log removed
      showError(err, 'Error al cargar los técnicos');
    } finally {
      setLoading(false);
    }
  }, [token, fechaMantenimiento, turno, showError]);


  const filtrarTecnicos = useCallback((texto: string) => {
    setSearchText(texto);
    if (!texto.trim()) {
      setTecnicosFiltrados(tecnicos);
      return;
    }

    const filtrados = tecnicos.filter(tecnico =>
      tecnico.user.name.toLowerCase().includes(texto.toLowerCase()) ||
      tecnico.document.toLowerCase().includes(texto.toLowerCase())
    );
    setTecnicosFiltrados(filtrados);
  }, [tecnicos]);

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

  const getDisponibilidadColor = (disponibilidad: string) => {
    switch (disponibilidad) {
      case 'disponible': return '#4CAF50';
      case 'ocupado': return '#FF9800';
      case 'ausente': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getDisponibilidadText = (disponibilidad: string) => {
    switch (disponibilidad) {
      case 'disponible': return 'Disponible';
      case 'ocupado': return 'Ocupado';
      case 'ausente': return 'Ausente';
      default: return 'Desconocido';
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Limpiar selección cuando cambien los filtros
  useEffect(() => {
    setTecnicoSeleccionado(null);
  }, [fechaMantenimiento, turno]);

  useEffect(() => {
    filtrarTecnicos(searchText);
  }, [filtrarTecnicos, searchText]);

  const renderTecnico = ({ item }: { item: AvailableTechnician }) => (
    <TouchableOpacity
      style={[
        styles.tecnicoCard,
        tecnicoSeleccionado?.id === item.id && styles.tecnicoCardSelected
      ]}
      onPress={() => setTecnicoSeleccionado(item)}
      activeOpacity={0.7}
    >
      <View style={styles.tecnicoHeader}>
        <View style={styles.tecnicoInfo}>
          <Text style={styles.tecnicoName}>{item.user.name}</Text>
          <View style={styles.ratingContainer}>
            <MaterialIcons name="person" size={16} color="#666" />
            <Text style={styles.ratingText}>Técnico</Text>
          </View>
        </View>
        <View style={[
          styles.disponibilidadBadge,
          { backgroundColor: item.status === 'active' ? '#4CAF50' : '#F44336' }
        ]}>
          <Text style={styles.disponibilidadText}>
            {item.status === 'active' ? 'Disponible' : 'Inactivo'}
          </Text>
        </View>
      </View>

      <View style={styles.tecnicoDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="phone" size={16} color="#666" />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="email" size={16} color="#666" />
          <Text style={styles.detailText}>{item.user.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="badge" size={16} color="#666" />
          <Text style={styles.detailText}>Doc: {item.document}</Text>
        </View>
        {item.address && (
          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={16} color="#666" />
            <Text style={styles.detailText}>{item.address}</Text>
          </View>
        )}
        {item.specialty && (
          <View style={styles.detailRow}>
            <MaterialIcons name="engineering" size={16} color="#666" />
            <Text style={styles.detailText}>{item.specialty}</Text>
          </View>
        )}
        {item.blood_type && (
          <View style={styles.detailRow}>
            <MaterialIcons name="bloodtype" size={16} color="#666" />
            <Text style={styles.detailText}>RH: {item.blood_type}</Text>
          </View>
        )}
        {item.contract_type && (
          <View style={styles.detailRow}>
            <MaterialIcons name="work" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.contract_type === 'full_time' ? 'Tiempo Completo' : 
               item.contract_type === 'part_time' ? 'Medio Tiempo' : 'Contratista'}
            </Text>
          </View>
        )}
      </View>

      {tecnicoSeleccionado?.id === item.id && (
        <View style={styles.seleccionadoIndicator}>
          <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
          <Text style={styles.seleccionadoText}>Seleccionado</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        <View style={styles.header}>
          <BackButton color="#fff" />
          <Text style={styles.headerTitle}>Asignar Técnico</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      <View style={styles.header}>
        <BackButton color="#fff" />
        <Text style={styles.headerTitle}>Asignar Técnico</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Información de Asignación</Text>
          
          {/* Fecha del Mantenimiento */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Fecha del Mantenimiento *</Text>
            <DatePicker
              value={fechaMantenimiento}
              onDateChange={setFechaMantenimiento}
              placeholder="Seleccionar fecha del mantenimiento"
              minimumDate={new Date().toISOString().split('T')[0]} // Fecha mínima: hoy
            />
          </View>

          {/* Turno */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Turno *</Text>
            <View style={styles.turnoContainer}>
              <TouchableOpacity
                style={[styles.turnoButton, turno === 'AM' && styles.turnoButtonSelected]}
                onPress={() => setTurno('AM')}
              >
                <Text style={[styles.turnoText, turno === 'AM' && styles.turnoTextSelected]}>
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.turnoButton, turno === 'PM' && styles.turnoButtonSelected]}
                onPress={() => setTurno('PM')}
              >
                <Text style={[styles.turnoText, turno === 'PM' && styles.turnoTextSelected]}>
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Eliminados: Valor y Repuestos */}
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar técnico por nombre o especialidad..."
            value={searchText}
            onChangeText={filtrarTecnicos}
            placeholderTextColor="#999"
          />
        </View>

        {tecnicosFiltrados.length > 0 ? (
          <FlatList
            data={tecnicosFiltrados}
            renderItem={renderTecnico}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.noTecnicosContainer}>
            <MaterialIcons name="person-off" size={48} color="#9CA3AF" />
            <Text style={styles.noTecnicosTitle}>No hay técnicos disponibles</Text>
            <Text style={styles.noTecnicosText}>
              {fechaMantenimiento 
                ? `No hay técnicos disponibles para ${fechaMantenimiento} (${turno})`
                : 'Selecciona una fecha y turno para ver técnicos disponibles'
              }
            </Text>
          </View>
        )}

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
  formContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  turnoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  turnoButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  turnoButtonSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  turnoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  turnoTextSelected: {
    color: '#fff',
  },
  repuestosInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  repuestosInput: {
    flex: 1,
  },
  agregarButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repuestosList: {
    marginTop: 8,
    gap: 6,
  },
  repuestoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  repuestoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  tecnicoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  tecnicoCardSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  tecnicoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tecnicoInfo: {
    flex: 1,
  },
  tecnicoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  disponibilidadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  disponibilidadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tecnicoDetails: {
    gap: 4,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  especialidadesContainer: {
    marginBottom: 8,
  },
  especialidadesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  especialidadesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  especialidadTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  especialidadText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  seleccionadoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  seleccionadoText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
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
