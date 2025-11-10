import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDateToLocal } from '../../utils/dateUtils';


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
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (value) {
      const [year, month, day] = value.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date();
  });


  const formatDate = (dateString: string) => {
    if (!dateString) return placeholder;
    
    try {
      const [year, month, day] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const formattedDate = date.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return formattedDate;
    } catch (error) {
      // Error log removed
      return dateString; // Devolver la fecha original si hay error
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    
    if (selectedDate) {
      setSelectedDate(selectedDate);
      // Formatear la fecha usando valores locales para evitar problemas de zona horaria
      const dateString = formatDateToLocal(selectedDate);
      onDateChange(dateString);
    }
  };

  const openCalendar = () => {
    if (!disabled) {
      setShowPicker(true);
    }
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

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate ? new Date(minimumDate + 'T00:00:00') : undefined}
          maximumDate={maximumDate ? new Date(maximumDate + 'T23:59:59') : undefined}
        />
      )}
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
});
