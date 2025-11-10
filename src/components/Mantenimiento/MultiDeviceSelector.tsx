// src/components/Mantenimiento/MultiDeviceSelector.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Device } from '../../types/mantenimiento/mantenimiento';

interface MultiDeviceSelectorProps {
  devices: Device[];
  selectedDevices: { device_id: number; description?: string }[];
  onSelectionChange: (selected: { device_id: number; description?: string }[]) => void;
  onClose: () => void;
}

export const MultiDeviceSelector: React.FC<MultiDeviceSelectorProps> = ({
  devices,
  selectedDevices,
  onSelectionChange,
  onClose,
}) => {
  const [searchText, setSearchText] = useState('');
  const [localSelections, setLocalSelections] = useState<{ device_id: number; description?: string }[]>(selectedDevices);

  const filteredDevices = devices.filter(device =>
    device.model.toLowerCase().includes(searchText.toLowerCase()) ||
    device.brand.toLowerCase().includes(searchText.toLowerCase()) ||
    device.serial.toLowerCase().includes(searchText.toLowerCase())
  );

  const toggleDevice = (device: Device) => {
    const isSelected = localSelections.some(sel => sel.device_id === device.id);
    
    if (isSelected) {
      setLocalSelections(prev => prev.filter(sel => sel.device_id !== device.id));
    } else {
      setLocalSelections(prev => [...prev, { device_id: device.id }]);
    }
  };

  const updateDescription = (deviceId: number, description: string) => {
    // Permitir letras, números, guiones, guiones bajos y espacios
    const cleanDescription = description.replace(/[^a-zA-Z0-9\-_\s]/g, '');
    
    setLocalSelections(prev =>
      prev.map(sel =>
        sel.device_id === deviceId
          ? { ...sel, description: cleanDescription || undefined }
          : sel
      )
    );
  };

  const handleSave = () => {
    if (localSelections.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos un equipo');
      return;
    }
    onSelectionChange(localSelections);
    onClose();
  };

  const renderDeviceItem = ({ item: device }: { item: Device }) => {
    const isSelected = localSelections.some(sel => sel.device_id === device.id);
    const selection = localSelections.find(sel => sel.device_id === device.id);

    return (
      <View style={styles.deviceItem}>
        <TouchableOpacity
          style={styles.deviceInfo}
          onPress={() => toggleDevice(device)}
          activeOpacity={0.7}
        >
          <View style={styles.deviceHeader}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View style={styles.deviceDetails}>
              <Text style={styles.deviceModel}>{device.model}</Text>
              <Text style={styles.deviceBrand}>{device.brand}</Text>
              <Text style={styles.deviceSerial}>S/N: {device.serial}</Text>
              <Text style={styles.deviceAddress}>{device.address}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {isSelected && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Descripción específica (opcional):</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe el problema o mantenimiento específico para este equipo..."
              value={selection?.description || ''}
              onChangeText={(text) => updateDescription(device.id, text)}
              multiline
              numberOfLines={2}
            />
          </View>
        )}
      </View>
    );
  };

  const renderSelectedSummary = () => {
    if (localSelections.length === 0) return null;

    return (
      <View style={styles.selectedSummary}>
        <Text style={styles.selectedCount}>
          {localSelections.length} equipo{localSelections.length !== 1 ? 's' : ''} seleccionado{localSelections.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setLocalSelections([])}
        >
          <Text style={styles.clearButtonText}>Limpiar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>Seleccionar Equipos</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar equipos..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Selected Summary */}
      {renderSelectedSummary()}

      {/* Devices List */}
      <FlatList
        data={filteredDevices}
        renderItem={renderDeviceItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.devicesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="hardware-chip-outline" size={48} color="#C0C0C0" />
            <Text style={styles.emptyText}>No se encontraron equipos</Text>
            <Text style={styles.emptySubtext}>
              {searchText ? 'Intenta con otros términos de búsqueda' : 'No hay equipos disponibles'}
            </Text>
          </View>
        }
      />

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
        <Text style={styles.instructionsText}>
          Selecciona uno o más equipos para el mantenimiento. Puedes agregar una descripción específica para cada equipo.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1C1C1E',
  },
  selectedSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6F3FF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  devicesList: {
    flex: 1,
    marginTop: 12,
  },
  deviceItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  deviceDetails: {
    flex: 1,
  },
  deviceModel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  deviceBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  deviceSerial: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  deviceAddress: {
    fontSize: 12,
    color: '#8E8E93',
  },
  descriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  descriptionInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    textAlignVertical: 'top',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C0C0C0',
    marginTop: 4,
    textAlign: 'center',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E6F3FF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    lineHeight: 20,
  },
});
