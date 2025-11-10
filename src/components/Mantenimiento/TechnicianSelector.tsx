import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { TecnicoService, AvailableTechnician } from '../../services/TecnicoService';

interface TechnicianSelectorProps {
  fechaMantenimiento: string;
  turno: 'AM' | 'PM';
  tecnicoSeleccionado: AvailableTechnician | null;
  onTecnicoSeleccionado: (tecnico: AvailableTechnician | null) => void;
  currentTechnicianId?: number | null;
  tecnicoOpcional?: boolean;
  showLabel?: boolean;
}

export default function TechnicianSelector({
  fechaMantenimiento,
  turno,
  tecnicoSeleccionado,
  onTecnicoSeleccionado,
  currentTechnicianId,
  tecnicoOpcional = false,
  showLabel = true,
}: TechnicianSelectorProps) {
  const { token } = useAuth();
  const { showError } = useError();
  
  const [tecnicos, setTecnicos] = useState<AvailableTechnician[]>([]);
  const [tecnicosFiltrados, setTecnicosFiltrados] = useState<AvailableTechnician[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Cargar técnicos cuando cambia la fecha o turno
  useEffect(() => {
    if (fechaMantenimiento && token) {
      loadTecnicos();
    } else {
      setTecnicos([]);
      setTecnicosFiltrados([]);
      onTecnicoSeleccionado(null);
    }
  }, [fechaMantenimiento, turno, token]);

  // Si hay técnico actual, intentar seleccionarlo cuando carguen los técnicos
  useEffect(() => {
    if (currentTechnicianId && tecnicos.length > 0) {
      const currentTecnico = tecnicos.find(t => t.id === currentTechnicianId);
      if (currentTecnico) {
        onTecnicoSeleccionado(currentTecnico);
      }
    }
  }, [tecnicos, currentTechnicianId]);

  const loadTecnicos = async () => {
    if (!token || !fechaMantenimiento) return;

    try {
      setLoadingTecnicos(true);
      const tecnicosData = await TecnicoService.getAvailableTechnicians(
        token,
        fechaMantenimiento,
        turno
      );
      setTecnicos(tecnicosData);
      setTecnicosFiltrados(tecnicosData);
    } catch (err: any) {
      showError(err, 'Error al cargar los técnicos');
    } finally {
      setLoadingTecnicos(false);
    }
  };

  const filtrarTecnicos = (texto: string) => {
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
  };

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

  if (!fechaMantenimiento) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={styles.sectionTitle}>
          Técnico {tecnicoOpcional ? '(Opcional)' : '*'}
        </Text>
      )}
      {tecnicoOpcional && showLabel && (
        <Text style={styles.sectionSubtitle}>
          Si no seleccionas un técnico, se mantendrá el actual
        </Text>
      )}

      {loadingTecnicos ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#1976D2" />
          <Text style={styles.loadingText}>Cargando técnicos disponibles...</Text>
        </View>
      ) : (
        <>
          {/* Buscador */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar técnico..."
              value={searchText}
              onChangeText={filtrarTecnicos}
              placeholderTextColor="#999"
            />
          </View>

          {/* Lista de Técnicos */}
          {tecnicosFiltrados.length > 0 ? (
            <ScrollView style={styles.tecnicosList} nestedScrollEnabled>
              {tecnicosFiltrados.map((tecnico) => (
                <TouchableOpacity
                  key={tecnico.id}
                  style={[
                    styles.tecnicoCard,
                    tecnicoSeleccionado?.id === tecnico.id && styles.tecnicoCardSelected
                  ]}
                  onPress={() => onTecnicoSeleccionado(tecnico)}
                  activeOpacity={0.7}
                >
                  <View style={styles.tecnicoHeader}>
                    <View style={styles.tecnicoInfo}>
                      <Text style={styles.tecnicoName}>{tecnico.user.name}</Text>
                      <Text style={styles.tecnicoDocument}>CC: {tecnico.document}</Text>
                    </View>
                    <View
                      style={[
                        styles.disponibilidadBadge,
                        { backgroundColor: `${getDisponibilidadColor(tecnico.disponibilidad)}20` }
                      ]}
                    >
                      <View
                        style={[
                          styles.disponibilidadDot,
                          { backgroundColor: getDisponibilidadColor(tecnico.disponibilidad) }
                        ]}
                      />
                      <Text
                        style={[
                          styles.disponibilidadText,
                          { color: getDisponibilidadColor(tecnico.disponibilidad) }
                        ]}
                      >
                        {getDisponibilidadText(tecnico.disponibilidad)}
                      </Text>
                    </View>
                  </View>
                  {tecnicoSeleccionado?.id === tecnico.id && (
                    <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="person-off" size={48} color="#CCC" />
              <Text style={styles.emptyText}>
                {searchText ? 'No se encontraron técnicos' : 'No hay técnicos disponibles para esta fecha y turno'}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  tecnicosList: {
    maxHeight: 400,
  },
  tecnicoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  tecnicoCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  tecnicoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tecnicoInfo: {
    flex: 1,
  },
  tecnicoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  tecnicoDocument: {
    fontSize: 14,
    color: '#666',
  },
  disponibilidadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  disponibilidadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  disponibilidadText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
});

