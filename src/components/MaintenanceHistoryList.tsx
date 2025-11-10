import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

export interface MaintenanceItem {
  id: number;
  type: string;
  status: string;
  date_maintenance?: string | null;
  shift?: string | null;
  value?: number | null;
  technician?: {
    user?: {
      name?: string;
    };
  } | null;
  device?: any[];
}

interface MaintenanceHistoryListProps {
  maintenances: MaintenanceItem[];
  onMaintenancePress: (maintenanceId: number) => void;
  emptyMessage?: string;
  emptySubmessage?: string;
}

export default function MaintenanceHistoryList({
  maintenances,
  onMaintenancePress,
  emptyMessage = 'No hay mantenimientos registrados',
  emptySubmessage = 'Los mantenimientos de este equipo aparecerán aquí',
}: MaintenanceHistoryListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'assigned': return '#F59E0B';
      case 'pending': return '#6B7280';
      case 'quoted': return '#8B5CF6';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En Progreso';
      case 'assigned': return 'Asignado';
      case 'pending': return 'Pendiente';
      case 'quoted': return 'Cotizado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'preventive': return 'Preventivo';
      case 'corrective': return 'Correctivo';
      default: return type;
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const renderMaintenance = (item: MaintenanceItem) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.maintenanceCard}
        onPress={() => onMaintenancePress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.maintenanceHeader}>
          <View style={styles.maintenanceIdContainer}>
            <MaterialIcons name="build" size={20} color="#3B82F6" />
            <Text style={styles.maintenanceId}>#{item.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.maintenanceBody}>
          <View style={styles.maintenanceRow}>
            <MaterialIcons name="category" size={16} color="#6B7280" />
            <Text style={styles.maintenanceType}>{getTypeText(item.type)}</Text>
          </View>

          {item.date_maintenance && (
            <View style={styles.maintenanceRow}>
              <MaterialIcons name="calendar-today" size={16} color="#6B7280" />
              <Text style={styles.maintenanceDate}>{formatDate(item.date_maintenance)}</Text>
              {item.shift && (
                <Text style={styles.maintenanceShift}>({item.shift})</Text>
              )}
            </View>
          )}

          {item.value && (
            <View style={styles.maintenanceRow}>
              <MaterialIcons name="attach-money" size={16} color="#6B7280" />
              <Text style={styles.maintenanceValue}>{formatCurrency(item.value)}</Text>
            </View>
          )}

          {item.technician && (
            <View style={styles.maintenanceRow}>
              <MaterialIcons name="person" size={16} color="#6B7280" />
              <Text style={styles.maintenanceTechnician}>
                {item.technician.user?.name || 'Sin técnico asignado'}
              </Text>
            </View>
          )}

          {item.device && Array.isArray(item.device) && item.device.length > 0 && (
            <View style={styles.maintenanceRow}>
              <MaterialIcons name="devices" size={16} color="#6B7280" />
              <Text style={styles.maintenanceDevices}>
                {item.device.length} equipo{item.device.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.maintenanceFooter}>
          <Text style={styles.viewDetailText}>Ver detalle</Text>
          <Ionicons name="arrow-forward" size={18} color="#3B82F6" />
        </View>
      </TouchableOpacity>
    );
  };

  if (maintenances.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="build" size={64} color="#D1D5DB" />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        <Text style={styles.emptySubtext}>{emptySubmessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {maintenances.map(renderMaintenance)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  maintenanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  maintenanceIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  maintenanceId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  maintenanceBody: {
    gap: 8,
    marginBottom: 12,
  },
  maintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  maintenanceType: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  maintenanceDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  maintenanceShift: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  maintenanceValue: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  maintenanceTechnician: {
    fontSize: 14,
    color: '#6B7280',
  },
  maintenanceDevices: {
    fontSize: 14,
    color: '#6B7280',
  },
  maintenanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  viewDetailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});

