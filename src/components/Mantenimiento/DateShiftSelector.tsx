import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DatePicker from '../Calendar/DatePicker';
import { getTodayLocal } from '../../utils/dateUtils';

interface DateShiftSelectorProps {
  fechaMantenimiento: string;
  turno: 'AM' | 'PM';
  onFechaChange: (fecha: string) => void;
  onTurnoChange: (turno: 'AM' | 'PM') => void;
  fechaLabel?: string;
  turnoLabel?: string;
  fechaPlaceholder?: string;
  minimumDate?: string;
}

export default function DateShiftSelector({
  fechaMantenimiento,
  turno,
  onFechaChange,
  onTurnoChange,
  fechaLabel = 'Fecha *',
  turnoLabel = 'Turno *',
  fechaPlaceholder = 'Seleccionar fecha',
  minimumDate,
}: DateShiftSelectorProps) {
  return (
    <>
      {/* Fecha */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{fechaLabel}</Text>
        <DatePicker
          value={fechaMantenimiento}
          onDateChange={onFechaChange}
          placeholder={fechaPlaceholder}
          minimumDate={minimumDate || getTodayLocal()}
        />
      </View>

      {/* Turno */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{turnoLabel}</Text>
        <View style={styles.shiftContainer}>
          <TouchableOpacity
            style={[styles.shiftButton, turno === 'AM' && styles.shiftButtonActive]}
            onPress={() => onTurnoChange('AM')}
          >
            <MaterialIcons
              name="wb-sunny"
              size={20}
              color={turno === 'AM' ? '#fff' : '#666'}
            />
            <Text style={[styles.shiftText, turno === 'AM' && styles.shiftTextActive]}>
              AM (8:00 - 12:30)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shiftButton, turno === 'PM' && styles.shiftButtonActive]}
            onPress={() => onTurnoChange('PM')}
          >
            <MaterialIcons
              name="brightness-3"
              size={20}
              color={turno === 'PM' ? '#fff' : '#666'}
            />
            <Text style={[styles.shiftText, turno === 'PM' && styles.shiftTextActive]}>
              PM (13:30 - 18:00)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  shiftContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  shiftButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  shiftButtonActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  shiftText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  shiftTextActive: {
    color: '#FFFFFF',
  },
});

