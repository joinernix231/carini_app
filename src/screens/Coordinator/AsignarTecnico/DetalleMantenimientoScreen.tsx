import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';
import { useSmartNavigation } from '../../../hooks/useSmartNavigation';
import { useMantenimientoDetalle } from '../../../hooks/mantenimiento/useMantenimientoDetalle';
import { 
  MaintenanceType, 
  MaintenanceStatus, 
  PaymentStatus 
} from '../../../services/CoordinadorMantenimientoService';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  DetalleMantenimiento: { mantenimientoId: number };
  CoordinadorDashboard: undefined;
  TecnicoDashboard: undefined;
};

type DetalleMantenimientoRouteProp = RouteProp<RootStackParamList, 'DetalleMantenimiento'>;

interface MantenimientoDetalle {
  id: number;
  type: MaintenanceType;
  date_maintenance: string | null;
  shift: string | null;
  status: MaintenanceStatus;
  value: number | null;
  spare_parts: string | null;
  is_paid: PaymentStatus;
  payment_support: string | null; // PDF del soporte de pago
  created_at: string;
  description: string | null;
  photo: string | null;
  device: {
    id: number;
    model: string;
    brand: string;
    type: string;
    photo: string | null;
    pdf_url: string | null;
    description: string | null;
  };
  client: {
    id: number;
    name: string;
    phone: string;
    address: string;
    city: string;
    department: string;
  };
  technician?: {
    id: number;
    user: {
      name: string;
      email: string;
    };
    phone: string;
  };
}

export default function DetalleMantenimientoScreen() {
  const route = useRoute<DetalleMantenimientoRouteProp>();
  const { goBack } = useSmartNavigation();
  const { mantenimientoId } = route.params;
  
  const {
    mantenimiento,
    loading,
    refreshing,
    error,
    onRefresh,
    handleVerifyPayment,
  } = useMantenimientoDetalle(mantenimientoId);

  const handleVerifyPaymentPress = async () => {
    try {
      const result = await handleVerifyPayment();
      if (result?.success) {
        Alert.alert(
          'Pago Verificado',
          result.message,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleViewPaymentSupport = async () => {
    if (!mantenimiento?.payment_support) {
      Alert.alert('Sin Soporte', 'No hay soporte de pago disponible para este mantenimiento.');
      return;
    }
    
    try {
      // Construir la URL completa del PDF
      const pdfUrl = mantenimiento.payment_support.startsWith('http') 
        ? mantenimiento.payment_support 
        : `https://cariniservice-production.up.railway.app/storage/${mantenimiento.payment_support}`;
      
      console.log('🔍 Abriendo PDF:', pdfUrl);
      
      // Verificar si se puede abrir la URL
      const canOpen = await Linking.canOpenURL(pdfUrl);
      
      if (canOpen) {
        // Abrir el PDF
        await Linking.openURL(pdfUrl);
        console.log('✅ PDF abierto exitosamente');
      } else {
        Alert.alert(
          'Error',
          'No se puede abrir el PDF. Verifica que tengas una aplicación de PDF instalada.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error al abrir PDF:', error);
      Alert.alert(
        'Error',
        'No se pudo abrir el soporte de pago. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    }
  };

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

  const getPaymentStatus = (isPaid: PaymentStatus, paymentSupport: string | null) => {
    if (isPaid === null) {
      return { text: 'No es necesario el pago', color: '#9E9E9E', icon: 'money-off' as keyof typeof MaterialIcons.glyphMap };
    } else if (isPaid === false) {
      if (!paymentSupport) {
        return { text: 'Cliente aún no ha pagado', color: '#FF9800', icon: 'payment' as keyof typeof MaterialIcons.glyphMap };
      } else {
        return { text: 'Requiere pago', color: '#FF9800', icon: 'payment' as keyof typeof MaterialIcons.glyphMap };
      }
    } else if (isPaid === true) {
      return { text: 'Pago aprobado', color: '#4CAF50', icon: 'check-circle' as keyof typeof MaterialIcons.glyphMap };
    } else {
      return { text: 'No es necesario el pago', color: '#9E9E9E', icon: 'money-off' as keyof typeof MaterialIcons.glyphMap };
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        <View style={styles.header}>
          <BackButton color="#fff" />
          <Text style={styles.headerTitle}>Detalle del Mantenimiento</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Cargando detalles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!mantenimiento) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        <View style={styles.header}>
          <BackButton color="#fff" />
          <Text style={styles.headerTitle}>Detalle del Mantenimiento</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Mantenimiento no encontrado</Text>
          <Text style={styles.errorText}>El mantenimiento solicitado no existe o no tienes permisos para verlo.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      <View style={styles.header}>
        <BackButton color="#fff" />
        <Text style={styles.headerTitle}>Detalle del Mantenimiento</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1976D2']}
            tintColor="#1976D2"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Información General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID:</Text>
              <Text style={styles.infoValue}>#{mantenimiento.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <View style={styles.typeContainer}>
                <MaterialIcons name="build" size={16} color={getTipoColor(mantenimiento.type)} />
                <Text style={[styles.typeText, { color: getTipoColor(mantenimiento.type) }]}>
                  {getTipoText(mantenimiento.type)}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estado:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(mantenimiento.status) }]}>
                <Text style={styles.statusText}>{getStatusText(mantenimiento.status)}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Creado:</Text>
              <Text style={styles.infoValue}>{formatDate(mantenimiento.created_at)}</Text>
            </View>
            {mantenimiento.date_maintenance && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha Programada:</Text>
                <Text style={styles.infoValue}>{formatDate(mantenimiento.date_maintenance)}</Text>
              </View>
            )}
            {mantenimiento.shift && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Turno:</Text>
                <Text style={styles.infoValue}>{mantenimiento.shift}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Estado de Pago */}
        {mantenimiento.is_paid !== null && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estado de Pago</Text>
            <View style={styles.infoCard}>
              <View style={styles.paymentContainer}>
                <MaterialIcons 
                  name={getPaymentStatus(mantenimiento.is_paid, mantenimiento.payment_support).icon} 
                  size={24} 
                  color={getPaymentStatus(mantenimiento.is_paid, mantenimiento.payment_support).color} 
                />
                <Text style={[styles.paymentText, { color: getPaymentStatus(mantenimiento.is_paid, mantenimiento.payment_support).color }]}>
                  {getPaymentStatus(mantenimiento.is_paid, mantenimiento.payment_support).text}
                </Text>
              </View>
              
              {/* Botones de acción para el pago */}
              <View style={styles.paymentActions}>
                {mantenimiento.is_paid === false && (
                  <TouchableOpacity 
                    style={styles.verifyButton}
                    onPress={handleVerifyPaymentPress}
                  >
                    <MaterialIcons name="check-circle" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Verificar Pago</Text>
                  </TouchableOpacity>
                )}
                
                {mantenimiento.payment_support && (
                  <TouchableOpacity 
                    style={styles.supportButton}
                    onPress={handleViewPaymentSupport}
                  >
                    <MaterialIcons name="picture-as-pdf" size={20} color="#1976D2" />
                    <Text style={styles.supportButtonText}>Ver Soporte</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Información del Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>{mantenimiento.client.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>{mantenimiento.client.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dirección:</Text>
              <Text style={styles.infoValue}>{mantenimiento.client.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ciudad:</Text>
              <Text style={styles.infoValue}>{mantenimiento.client.city}, {mantenimiento.client.department}</Text>
            </View>
          </View>
        </View>

        {/* Información del Equipo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipo</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Marca:</Text>
              <Text style={styles.infoValue}>{mantenimiento.device.brand}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Modelo:</Text>
              <Text style={styles.infoValue}>{mantenimiento.device.model}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <Text style={styles.infoValue}>{mantenimiento.device.type}</Text>
            </View>
            {mantenimiento.device.description && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Descripción:</Text>
                <Text style={styles.infoValue}>{mantenimiento.device.description}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Técnico Asignado */}
        {mantenimiento.technician && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Técnico Asignado</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nombre:</Text>
                <Text style={styles.infoValue}>{mantenimiento.technician.user.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{mantenimiento.technician.user.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValue}>{mantenimiento.technician.phone}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Descripción */}
        {mantenimiento.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <View style={styles.infoCard}>
              <Text style={styles.descriptionText}>{mantenimiento.description}</Text>
            </View>
          </View>
        )}

        {/* Valor y Repuestos */}
        {(mantenimiento.value || mantenimiento.spare_parts) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles del Servicio</Text>
            <View style={styles.infoCard}>
              {mantenimiento.value && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Valor:</Text>
                  <Text style={styles.infoValue}>${mantenimiento.value.toLocaleString()}</Text>
                </View>
              )}
              {mantenimiento.spare_parts && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Repuestos:</Text>
                  <Text style={styles.infoValue}>{mantenimiento.spare_parts}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Foto del Mantenimiento */}
        {mantenimiento.photo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Foto del Mantenimiento</Text>
            <View style={styles.photoContainer}>
              <Image 
                source={{ uri: mantenimiento.photo }} 
                style={styles.photo}
                resizeMode="cover"
              />
            </View>
          </View>
        )}

        {/* Espacio inferior */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 16,
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    justifyContent: 'center',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  supportButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  photoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F44336',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});
