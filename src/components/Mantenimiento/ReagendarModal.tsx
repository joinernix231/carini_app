import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { AvailableTechnician } from '../../services/TecnicoService';
import { AsignarMantenimientoPayload, CoordinadorMantenimientoService } from '../../services/CoordinadorMantenimientoService';
import { getTodayLocal } from '../../utils/dateUtils';
import DateShiftSelector from './DateShiftSelector';
import TechnicianSelector from './TechnicianSelector';

interface ReagendarModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  maintenanceId: number;
  currentDate?: string | null;
  currentShift?: string | null;
  currentTechnicianId?: number | null;
}

export default function ReagendarModal({
  visible,
  onClose,
  onSuccess,
  maintenanceId,
  currentDate,
  currentShift,
  currentTechnicianId,
}: ReagendarModalProps) {
  const { token } = useAuth();
  const { showError } = useError();
  
  // Función para convertir fecha ISO a formato YYYY-MM-DD
  const formatDateToYYYYMMDD = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      // Si ya está en formato YYYY-MM-DD, retornarlo
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      // Si viene en formato ISO, extraer solo la fecha
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return '';
    }
  };

  const [fechaMantenimiento, setFechaMantenimiento] = useState(formatDateToYYYYMMDD(currentDate));
  const [turno, setTurno] = useState<'AM' | 'PM'>((currentShift as 'AM' | 'PM') || 'AM');
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<AvailableTechnician | null>(null);
  const [saving, setSaving] = useState(false);

  const handleReagendar = async () => {
    if (!fechaMantenimiento) {
      Alert.alert('Error', 'Debe seleccionar una fecha');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'No hay token de autenticación');
      return;
    }

    Alert.alert(
      'Confirmar Reagendamiento',
      `¿Deseas reagendar este mantenimiento para ${fechaMantenimiento} en turno ${turno}?${tecnicoSeleccionado ? `\n\nTécnico: ${tecnicoSeleccionado.user.name}` : '\n\nSe mantendrá el técnico actual.'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reagendar',
          onPress: async () => {
            try {
              setSaving(true);
              
              const payload: AsignarMantenimientoPayload = {
                date_maintenance: fechaMantenimiento,
                shift: turno,
                ...(tecnicoSeleccionado && { technician_id: tecnicoSeleccionado.id }),
              };

              await CoordinadorMantenimientoService.asignarTecnicoCoordinador(
                maintenanceId,
                payload,
                token
              );
              
              Alert.alert(
                'Éxito',
                'El mantenimiento ha sido reagendado correctamente.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      handleClose();
                      onSuccess();
                    },
                  },
                ]
              );
            } catch (err: any) {
              showError(err, 'Error al reagendar el mantenimiento');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    setFechaMantenimiento(formatDateToYYYYMMDD(currentDate));
    setTurno((currentShift as 'AM' | 'PM') || 'AM');
    setTecnicoSeleccionado(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reagendar Mantenimiento</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Información Actual */}
          {(currentDate || currentShift) && (
            <View style={styles.currentInfoCard}>
              <MaterialIcons name="info" size={20} color="#1976D2" />
              <View style={styles.currentInfoContent}>
                <Text style={styles.currentInfoTitle}>Programación Actual</Text>
                {currentDate && (
                  <Text style={styles.currentInfoText}>
                    Fecha: {new Date(currentDate).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                )}
                {currentShift && (
                  <Text style={styles.currentInfoText}>
                    Turno: {currentShift} {currentShift === 'AM' ? '(8:00 AM - 12:30 PM)' : '(1:30 PM - 6:00 PM)'}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Nueva Fecha y Turno */}
          <DateShiftSelector
            fechaMantenimiento={fechaMantenimiento}
            turno={turno}
            onFechaChange={setFechaMantenimiento}
            onTurnoChange={setTurno}
            fechaLabel="Nueva Fecha *"
            turnoLabel="Nuevo Turno *"
            fechaPlaceholder="Seleccionar nueva fecha"
            minimumDate={getTodayLocal()}
          />

          {/* Cambiar Técnico (Opcional) */}
          <TechnicianSelector
            fechaMantenimiento={fechaMantenimiento}
            turno={turno}
            tecnicoSeleccionado={tecnicoSeleccionado}
            onTecnicoSeleccionado={setTecnicoSeleccionado}
            currentTechnicianId={currentTechnicianId}
            tecnicoOpcional={true}
            showLabel={true}
          />
        </ScrollView>

        {/* Botones de Acción */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cancelButton, saving && styles.buttonDisabled]}
            onPress={handleClose}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, (!fechaMantenimiento || saving) && styles.buttonDisabled]}
            onPress={handleReagendar}
            disabled={!fechaMantenimiento || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="schedule" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Reagendar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  currentInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  currentInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  currentInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 8,
  },
  currentInfoText: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1976D2',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

