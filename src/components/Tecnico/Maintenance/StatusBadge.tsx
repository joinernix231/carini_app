import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaintenanceStatus } from '../../../services/TecnicoMantenimientosService';

interface StatusBadgeProps {
  status: MaintenanceStatus;
  size?: 'small' | 'medium' | 'large';
}

export function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, sizeStyles.container]}>
      <Ionicons name={config.icon} size={sizeStyles.iconSize} color={config.color} />
      <Text style={[styles.text, { color: config.color }, sizeStyles.text]}>
        {config.label}
      </Text>
    </View>
  );
}

function getStatusConfig(status: MaintenanceStatus) {
  const configs: Record<MaintenanceStatus, { label: string; color: string; bgColor: string; icon: any }> = {
    assigned: {
      label: 'Asignado',
      color: '#007AFF',
      bgColor: '#E6F3FF',
      icon: 'checkmark-circle',
    },
    in_progress: {
      label: 'En Progreso',
      color: '#FF9500',
      bgColor: '#FFF3E0',
      icon: 'time',
    },
    completed: {
      label: 'Completado',
      color: '#34C759',
      bgColor: '#E8F5E8',
      icon: 'checkmark-done',
    },
  };

  return configs[status];
}

function getSizeStyles(size: 'small' | 'medium' | 'large') {
  const sizes = {
    small: {
      container: { paddingHorizontal: 8, paddingVertical: 4 },
      iconSize: 12,
      text: { fontSize: 11 },
    },
    medium: {
      container: { paddingHorizontal: 12, paddingVertical: 6 },
      iconSize: 14,
      text: { fontSize: 12 },
    },
    large: {
      container: { paddingHorizontal: 16, paddingVertical: 8 },
      iconSize: 16,
      text: { fontSize: 14 },
    },
  };

  return sizes[size];
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    gap: 4,
  },
  text: {
    fontWeight: '600',
  },
});


