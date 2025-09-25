import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface DatePickerProps {
  value: string;
  onDateChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minimumDate?: string;
  maximumDate?: string;
}

export default function DatePicker({
  value,
  onDateChange,
  placeholder = 'Seleccionar fecha',
  disabled = false,
  minimumDate,
  maximumDate,
}: DatePickerProps) {
  const [isVisible, setIsVisible] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return placeholder;
    
    // Parsear la fecha directamente sin conversiones de zona horaria
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const formattedDate = date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    console.log('📅 Formateando fecha:', {
      input: dateString,
      parsed: { year, month, day },
      formatted: formattedDate
    });
    
    return formattedDate;
  };

  const handleDateSelect = (day: any) => {
    // Usar directamente la fecha seleccionada sin conversiones
    const selectedDate = day.dateString;
    console.log('📅 Fecha seleccionada:', selectedDate);
    onDateChange(selectedDate);
    setIsVisible(false);
  };

  const openCalendar = () => {
    if (!disabled) {
      setIsVisible(true);
    }
  };

  const closeCalendar = () => {
    setIsVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.input, disabled && styles.inputDisabled]}
        onPress={openCalendar}
        disabled={disabled}
      >
        <View style={styles.inputContent}>
          <MaterialIcons 
            name="calendar-today" 
            size={20} 
            color={value ? '#1976D2' : '#9CA3AF'} 
          />
          <Text style={[styles.inputText, !value && styles.placeholderText]}>
            {formatDate(value)}
          </Text>
        </View>
        <MaterialIcons 
          name="keyboard-arrow-down" 
          size={20} 
          color="#9CA3AF" 
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeCalendar}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Fecha</Text>
              <TouchableOpacity onPress={closeCalendar} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [value]: {
                  selected: true,
                  selectedColor: '#1976D2',
                  selectedTextColor: '#fff',
                }
              }}
              theme={{
                backgroundColor: '#fff',
                calendarBackground: '#fff',
                textSectionTitleColor: '#1976D2',
                selectedDayBackgroundColor: '#1976D2',
                selectedDayTextColor: '#fff',
                todayTextColor: '#1976D2',
                dayTextColor: '#333',
                textDisabledColor: '#ccc',
                dotColor: '#1976D2',
                selectedDotColor: '#fff',
                arrowColor: '#1976D2',
                disabledArrowColor: '#ccc',
                monthTextColor: '#1976D2',
                indicatorColor: '#1976D2',
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              minDate={minimumDate}
              maxDate={maximumDate}
              firstDay={1} // Lunes como primer día
              hideExtraDays={true}
              disableMonthChange={false}
              enableSwipeMonths={true}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeCalendar}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inputText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976D2',
  },
  closeButton: {
    padding: 4,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
