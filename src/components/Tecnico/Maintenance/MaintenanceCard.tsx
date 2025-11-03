import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { TecnicoMaintenance } from '../../../services/TecnicoMantenimientosService';
import TecnicoMantenimientosService from '../../../services/TecnicoMantenimientosService';

interface MaintenanceCardProps {
  maintenance: TecnicoMaintenance;
  onPress: () => void;
}

export function MaintenanceCard({ maintenance, onPress }: MaintenanceCardProps) {
  const firstDevice = maintenance.device[0];
  const equipmentName = firstDevice 
    ? TecnicoMantenimientosService.getEquipmentName(firstDevice) 
    : 'Equipo no especificado';
  const equipmentType = firstDevice ? firstDevice.type : 'unknown';
  
  const statusConfig = getStatusConfig(maintenance.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header con cliente y estado */}
      <View style={styles.cardHeader}>
        <View style={styles.clientInfo}>
          <Ionicons name="business" size={20} color="#007AFF" />
          <Text style={styles.clientName}>{maintenance.client.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Equipo */}
      <View style={styles.equipmentSection}>
        <View style={styles.equipmentIconContainer}>
          <MaterialIcons
            name={TecnicoMantenimientosService.getEquipmentIcon(equipmentType) as any}
            size={32}
            color="#007AFF"
          />
        </View>
        <View style={styles.equipmentInfo}>
          <Text style={styles.equipmentName}>{equipmentName}</Text>
          <Text style={styles.equipmentType}>{firstDevice?.type || 'N/A'}</Text>
        </View>
      </View>

      {/* Información adicional */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
          <Text style={styles.infoText}>
            {new Date(maintenance.date_maintenance).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
            })}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color="#8E8E93" />
          <Text style={styles.infoText}>{maintenance.shift}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={16} color="#8E8E93" />
          <Text style={styles.infoText} numberOfLines={1}>
            {firstDevice ? firstDevice.address : maintenance.client.address}
          </Text>
        </View>
      </View>

      {/* Acción */}
      <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <Ionicons
          name={maintenance.status === 'in_progress' ? 'play-circle' : 'eye'}
          size={20}
          color="#fff"
        />
        <Text style={styles.actionButtonText}>
          {maintenance.status === 'in_progress' ? 'Continuar Trabajo' : 'Ver Detalle'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
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

  return configs[status] || configs.assigned;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  equipmentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  equipmentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  equipmentType: {
    fontSize: 13,
    color: '#8E8E93',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});


