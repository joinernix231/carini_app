import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  CoordinadorMantenimiento, 
  PaymentStatus, 
  MaintenanceType, 
  MaintenanceStatus 
} from '../../services/CoordinadorMantenimientoService';

interface MantenimientoCardProps {
  mantenimiento: CoordinadorMantenimiento;
  onPress: (mantenimiento: CoordinadorMantenimiento) => void;
}

export default function MantenimientoCard({ mantenimiento, onPress }: MantenimientoCardProps) {
  const getTipoText = (type: MaintenanceType) => {
    switch (type) {
      case 'preventive': return 'Preventivo';
      case 'corrective': return 'Correctivo';
    }
  };

  const getTipoColor = (type: MaintenanceType) => {
    switch (type) {
      case 'preventive': return '#4CAF50';
      case 'corrective': return '#FF9800';
    }
  };

  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'assigned': return '#2196F3';
      case 'in_progress': return '#9C27B0';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
    }
  };

  const getStatusText = (status: MaintenanceStatus) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'assigned': return 'Asignado';
      case 'in_progress': return 'En Proceso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatus = (isPaid: PaymentStatus) => {
    if (isPaid === null) {
      return { text: 'Sin pago', color: '#9E9E9E', icon: 'money-off' as keyof typeof MaterialIcons.glyphMap };
    } else if (isPaid === false) {
      return { text: 'Requiere pago', color: '#FF9800', icon: 'payment' as keyof typeof MaterialIcons.glyphMap };
    } else if (isPaid === true) {
      return { text: 'Pago aprobado', color: '#4CAF50', icon: 'check-circle' as keyof typeof MaterialIcons.glyphMap };
    } else {
      return { text: 'Sin pago', color: '#9E9E9E', icon: 'money-off' as keyof typeof MaterialIcons.glyphMap };
    }
  };


  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(mantenimiento)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.tipoContainer}>
          <MaterialIcons name="build" size={20} color={getTipoColor(mantenimiento.type)} />
          <Text style={[styles.tipoText, { color: getTipoColor(mantenimiento.type) }]}>
            {getTipoText(mantenimiento.type)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(mantenimiento.status) }]}>
          <Text style={styles.statusText}>{getStatusText(mantenimiento.status)}</Text>
        </View>
      </View>

      {mantenimiento.description && (
        <Text style={styles.descripcionText}>{mantenimiento.description}</Text>
      )}

      <View style={styles.clienteContainer}>
        <View style={styles.clienteHeader}>
          <MaterialIcons name="person" size={16} color="#666" />
          <Text style={styles.clienteLabel}>Cliente</Text>
        </View>
        <Text style={styles.clienteName}>{mantenimiento.client.name}</Text>
        <Text style={styles.clienteInfo}>
          {mantenimiento.client.city}, {mantenimiento.client.department}
        </Text>
        <Text style={styles.clientePhone}>{mantenimiento.client.phone}</Text>
      </View>

      <View style={styles.equipoContainer}>
        <View style={styles.equipoHeader}>
          <MaterialIcons name="devices" size={16} color="#666" />
          <Text style={styles.equipoLabel}>Equipo</Text>
        </View>
        <Text style={styles.equipoText}>
          {mantenimiento.device.brand} {mantenimiento.device.model}
        </Text>
        <Text style={styles.equipoType}>{mantenimiento.device.type}</Text>
        {mantenimiento.device.description && (
          <Text style={styles.equipoDescription}>Descripción: {mantenimiento.device.description}</Text>
        )}
      </View>

      {mantenimiento.photo && (
        <View style={styles.photoContainer}>
          <Image 
            source={{ uri: mantenimiento.photo }} 
            style={styles.photo}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.footerInfo}>
          <View style={styles.idContainer}>
            <Text style={styles.idText}>ID: {mantenimiento.id}</Text>
          </View>
          <View style={styles.dateContainer}>
            <MaterialIcons name="schedule" size={14} color="#666" />
            <Text style={styles.dateText}>
              Creado: {formatDate(mantenimiento.created_at)}
            </Text>
          </View>
          {mantenimiento.is_paid !== null && (
            <View style={styles.paymentContainer}>
              <MaterialIcons 
                name={getPaymentStatus(mantenimiento.is_paid).icon} 
                size={14} 
                color={getPaymentStatus(mantenimiento.is_paid).color} 
              />
              <Text style={[styles.paymentText, { color: getPaymentStatus(mantenimiento.is_paid).color }]}>
                {getPaymentStatus(mantenimiento.is_paid).text}
              </Text>
            </View>
          )}
        </View>
        <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  descripcionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  equipoContainer: {
    marginBottom: 12,
  },
  equipoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  equipoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  equipoText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  equipoType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  equipoDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  clienteContainer: {
    marginBottom: 12,
  },
  clienteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  clienteLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  clienteName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  clienteInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  clientePhone: {
    fontSize: 12,
    color: '#666',
  },
  photoContainer: {
    marginBottom: 12,
  },
  photo: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerInfo: {
    flex: 1,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  idText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '400',
  },
  paymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  paymentText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
