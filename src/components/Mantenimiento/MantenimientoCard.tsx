// src/components/Mantenimiento/MantenimientoCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { MantenimientoListItem } from '../../types/mantenimiento/mantenimiento';

interface MantenimientoCardProps {
  item: MantenimientoListItem;
  onPress: () => void;
  onDelete?: () => void;
}

export const MantenimientoCard: React.FC<MantenimientoCardProps> = ({
  item,
  onPress,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const getLockedMessage = () => {
    if (item.status === 'completed') {
      return 'Completado - No editable';
    }
    if (item.status === 'cancelled') {
      return 'Cancelado - No editable';
    }
    if (item.status === 'assigned') {
      return 'Asignado - No editable';
    }
    if (item.status === 'in_progress') {
      return 'En progreso - No editable';
    }
    if (item.status === 'quoted') {
      return 'Cotizado - No editable';
    }
    if (item.status === 'payment_uploaded') {
      return 'Pago cargado - No editable';
    }
    return 'No editable';
  };

  const toggleExpanded = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const traducirEstado = (estadoIngles: string): string => {
    const traducciones: Record<string, string> = {
      pending: 'Pendiente',
      assigned: 'Asignado',
      in_progress: 'En progreso',
      completed: 'Completado',
      cancelled: 'Cancelado',
      payment_uploaded: 'Pago cargado',
      quoted: 'Cotizado',
    };
    return traducciones[estadoIngles] || estadoIngles;
  };

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return {
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          icon: 'time-outline' as const,
        };
      case 'Asignado':
        return {
          color: '#3B82F6',
          bgColor: '#DBEAFE',
          icon: 'person-outline' as const,
        };
      case 'En progreso':
        return {
          color: '#8B5CF6',
          bgColor: '#EDE9FE',
          icon: 'play-outline' as const,
        };
      case 'Completado':
        return {
          color: '#10B981',
          bgColor: '#D1FAE5',
          icon: 'checkmark-circle-outline' as const,
        };
      case 'Cancelado':
        return {
          color: '#EF4444',
          bgColor: '#FEE2E2',
          icon: 'close-circle-outline' as const,
        };
      case 'Pago cargado':
        return {
          color: '#06B6D4',
          bgColor: '#CFFAFE',
          icon: 'receipt-outline' as const,
        };
      case 'Cotizado':
        return {
          color: '#EC4899',
          bgColor: '#FCE7F3',
          icon: 'pricetag-outline' as const,
        };
      default:
        return {
          color: '#6B7280',
          bgColor: '#F3F4F6',
          icon: 'help-circle-outline' as const,
        };
    }
  };

  const getTipoConfig = (tipo: string) => {
    return tipo === 'preventive'
      ? {
          color: '#34C759',
          bgColor: '#E6F7E6',
          icon: 'shield-checkmark-outline' as const,
          label: 'Preventivo'
        }
      : {
          color: '#FF6B47',
          bgColor: '#FFF0ED',
          icon: 'warning-outline' as const,
          label: 'Correctivo'
        };
  };

  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Fecha no válida';
    }
  };

  const estadoTraducido = traducirEstado(item.status);
  const estadoConfig = getEstadoConfig(estadoTraducido);
  const tipoConfig = getTipoConfig(item.type);

  const maxHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, item.devices.length * 60 + 20], // Altura aproximada por dispositivo
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Indicador de estado lateral */}
      <View style={[styles.statusIndicator, { backgroundColor: estadoConfig.color }]} />

      {/* Contenido de la tarjeta */}
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.equipoSection}>
            <View style={[styles.tipoIcon, { backgroundColor: tipoConfig.bgColor }]}>
              <Ionicons
                name={tipoConfig.icon}
                size={24}
                color={tipoConfig.color}
              />
            </View>
            <View style={styles.equipoInfo}>
              <Text style={styles.equipoNombre} numberOfLines={1}>
                {item.clientName || `${item.primaryDevice.brand} ${item.primaryDevice.model}`}
              </Text>
              <View style={styles.badgesContainer}>
                <View style={[styles.tipoBadge, { backgroundColor: tipoConfig.bgColor }]}>
                  <Text style={[styles.tipoText, { color: tipoConfig.color }]}>
                    {tipoConfig.label}
                  </Text>
                </View>
                {item.deviceCount > 1 && (
                  <View style={styles.countBadge}>
                    <Ionicons name="hardware-chip-outline" size={12} color="#007AFF" />
                    <Text style={styles.countText}>{item.deviceCount} equipos</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Descripción */}
        {item.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        )}

        {/* Info section */}
        <View style={styles.infoSection}>
          <View style={styles.fechaContainer}>
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <Text style={styles.fechaText}>
              {formatearFecha(item.date_maintenance || item.created_at)}
            </Text>
          </View>

          <View style={[styles.estadoBadge, { backgroundColor: estadoConfig.bgColor }]}>
            <Ionicons name={estadoConfig.icon} size={16} color={estadoConfig.color} />
            <Text style={[styles.estadoText, { color: estadoConfig.color }]}>
              {estadoTraducido}
            </Text>
          </View>
        </View>

        {/* Lista de equipos expandible */}
        {item.deviceCount > 1 && (
          <View style={styles.expandableSection}>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={toggleExpanded}
              activeOpacity={0.7}
            >
              <Text style={styles.expandButtonText}>
                {expanded ? 'Ocultar equipos' : 'Ver todos los equipos'}
              </Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#007AFF"
              />
            </TouchableOpacity>

            <Animated.View style={[styles.devicesList, { maxHeight }]}>
              {item.devices.map((device, index) => (
                <View key={`${item.id}-device-${index}`} style={styles.deviceItem}>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceModel}>{device.model}</Text>
                    <Text style={styles.deviceDetails}>
                      {device.brand} • {device.serial}
                    </Text>
                    {device.pivot_description && (
                      <Text style={styles.deviceDescription} numberOfLines={1}>
                        {device.pivot_description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.deviceType}>
                    <Ionicons name="hardware-chip-outline" size={16} color="#666" />
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>
        )}

        {/* Footer con acciones */}
        <View style={styles.cardFooter}>
          {onDelete ? (
            <>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={onDelete}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="delete-outline" size={20} color="#FF3B30" />
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
            </>
          ) : (
            <View style={styles.completedFooter}>
              <View style={styles.completedBadge}>
                <Ionicons name="lock-closed" size={14} color="#6B7280" />
                <Text style={styles.completedText}>{getLockedMessage()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  statusIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  equipoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  equipoInfo: {
    flex: 1,
  },
  equipoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  tipoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fechaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  expandableSection: {
    marginBottom: 12,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  expandButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
    fontWeight: '500',
  },
  devicesList: {
    overflow: 'hidden',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 4,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceModel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  deviceDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  deviceDescription: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
    fontStyle: 'italic',
  },
  deviceType: {
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 4,
  },
  completedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completedText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
});