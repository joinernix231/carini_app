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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';
import DocumentUploader from '../../../components/DocumentUploader';
import EditQuotationModal from '../../../components/EditQuotationModal';
import { useSmartNavigation } from '../../../hooks/useSmartNavigation';
import { useMantenimientoDetalle } from '../../../hooks/mantenimiento/useMantenimientoDetalle';
import { 
  MaintenanceType, 
  MaintenanceStatus, 
  PaymentStatus 
} from '../../../services/CoordinadorMantenimientoService';
import { CoordinadorMantenimientoService } from '../../../services/CoordinadorMantenimientoService';
import { useAuth } from '../../../context/AuthContext';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  DetalleMantenimiento: { mantenimientoId: number };
  CoordinadorDashboard: undefined;
  TecnicoDashboard: undefined;
  AsignarTecnico: { mantenimientoId: number };
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
  const { token } = useAuth();
  const [quotationUrl, setQuotationUrl] = useState<string | null>(null);
  const [maintenanceValue, setMaintenanceValue] = useState<string>('');
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const route = useRoute<DetalleMantenimientoRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
        // Log removed
      } else {
        Alert.alert(
          'Error',
          'No se puede abrir el PDF. Verifica que tengas una aplicación de PDF instalada.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Error log removed
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
      case 'quoted': return '#FFC107';
      case 'payment_uploaded': return '#FFB300';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#E53935';
      case 'assigned': return '#2196F3';
      case 'in_progress': return '#9C27B0';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
    }
  };

  const getStatusText = (status: MaintenanceStatus) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'quoted': return 'Cotizado';
      case 'payment_uploaded': return 'Pago Subido';
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
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
      year: 'numeric'
    });
  };

  const formatDateWithTime = (dateString: string) => {
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

  const handleUploadPriceSupport = async () => {
    if (!token || !quotationUrl) {
      Alert.alert('Falta información', 'Selecciona un PDF de cotización antes de enviar.');
      return;
    }
    if (!maintenanceValue || maintenanceValue.trim() === '') {
      Alert.alert('Falta información', 'Ingresa el valor del mantenimiento antes de enviar.');
      return;
    }
    try {
      const value = parseFloat(maintenanceValue);
      if (isNaN(value) || value <= 0) {
        Alert.alert('Valor inválido', 'Ingresa un valor numérico válido mayor a 0.');
        return;
      }
      await CoordinadorMantenimientoService.uploadPriceSupport(
        mantenimiento.id, 
        quotationUrl, 
        token,
        { 
          is_paid: false,  // Requiere pago
          value: value
        }
      );
      Alert.alert('Éxito', 'Cotización enviada correctamente.');
      goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo enviar la cotización');
    }
  };

  const handleNoPaymentRequired = async () => {
    if (!token) {
      Alert.alert('Error', 'No hay token de autenticación');
      return;
    }
    try {
      await CoordinadorMantenimientoService.uploadPriceSupport(
        mantenimiento.id, 
        null,  // No hay PDF
        token,
        { 
          is_paid: null,  // No requiere pago
          value: null
        }
      );
      Alert.alert('Éxito', 'Mantenimiento marcado como no requiere pago');
      goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo procesar');
    }
  };

  const handleEditQuotation = () => {
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (data: {
    is_paid: boolean | null;
    value: number | null;
    price_support: string | null;
  }) => {
    if (!token) {
      Alert.alert('Error', 'No hay token de autenticación');
      return;
    }
    
    try {
      await CoordinadorMantenimientoService.updateQuotation(
        mantenimiento.id,
        token,
        data
      );
      Alert.alert('Éxito', 'Cotización actualizada correctamente');
      setEditModalVisible(false);
      onRefresh(); // Refrescar datos
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo actualizar la cotización');
    }
  };

  const handlePaymentVerification = async (verified: boolean) => {
    if (!token) {
      Alert.alert('Error', 'No hay token de autenticación');
      return;
    }
    
    try {
      // Aquí iría el endpoint para verificar pago
      // await CoordinadorMantenimientoService.verifyPayment(mantenimiento.id, verified, token);
      Alert.alert('Éxito', verified ? 'Pago verificado correctamente' : 'Pago marcado como no realizado');
      onRefresh();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo verificar el pago');
    }
  };

  const renderActionSection = () => {
    const status = mantenimiento?.status;
    const isPaid = mantenimiento?.is_paid;
    
    switch (status) {
      case 'pending':
        return renderQuotationSection();
      case 'quoted':
        if (isPaid === null) {
          // No requiere pago - puede asignar técnico directamente
          return renderAssignTechnicianSection();
        } else if (isPaid === false) {
          // Requiere pago - esperando que el cliente pague
          return renderPaymentPendingSection();
        } else if (isPaid === true) {
          // Pago verificado - puede asignar técnico
          return renderAssignTechnicianSection();
        }
        return null;
      case 'payment_uploaded':
        // Cliente subió soporte de pago - coordinador debe verificar
        return renderPaymentVerificationSection();
      case 'assigned':
      case 'in_progress':
        return renderProgressSection();
      case 'completed':
        return renderCompletedSection();
      default:
        return null;
    }
  };

  const renderQuotationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Verificación y Cotización</Text>
      <View style={styles.verificationCard}>
        <View style={styles.verificationHeader}>
          <MaterialIcons name="assignment-turned-in" size={24} color="#1976D2" />
          <Text style={styles.verificationTitle}>Adjuntar Cotización</Text>
        </View>
        <Text style={styles.verificationDescription}>
          Sube el archivo PDF del soporte de precio para este mantenimiento. Una vez enviado, el precio será registrado en el sistema.
        </Text>
        
        <View style={styles.uploadSection}>
          <DocumentUploader
            title="Cotización PDF"
            onDocumentUploaded={(url) => setQuotationUrl(url)}
            options={{ mimeTypes: ['application/pdf'] }}
            required
          />
          
          <View style={styles.valueInputContainer}>
            <Text style={styles.valueLabel}>Valor del Mantenimiento *</Text>
            <TextInput
              style={styles.valueInput}
              placeholder="Ej: 150000"
              value={maintenanceValue}
              onChangeText={setMaintenanceValue}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.verifyButton, (!quotationUrl || !maintenanceValue) && styles.verifyButtonDisabled]}
            onPress={handleUploadPriceSupport}
            disabled={!quotationUrl || !maintenanceValue}
          >
            <MaterialIcons name="send" size={20} color="#fff" />
            <Text style={styles.verifyButtonText}>
              {quotationUrl && maintenanceValue ? 'Enviar Cotización' : 'Completa todos los campos'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.noPaymentButton}
            onPress={handleNoPaymentRequired}
          >
            <MaterialIcons name="money-off" size={20} color="#fff" />
            <Text style={styles.noPaymentButtonText}>No Requiere Pago</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPaymentVerificationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Verificación de Pago</Text>
      <View style={styles.verificationCard}>
        <View style={styles.verificationHeader}>
          <MaterialIcons name="payment" size={24} color="#FF9800" />
          <Text style={styles.verificationTitle}>Soporte de Pago Recibido</Text>
        </View>
        <Text style={styles.verificationDescription}>
          El cliente ha subido un soporte de pago. Verifica si el pago es válido y procede con la asignación del técnico.
        </Text>
        
        {mantenimiento?.payment_support && (
          <View style={styles.paymentSupportSection}>
            <Text style={styles.paymentSupportLabel}>Soporte de Pago:</Text>
            <TouchableOpacity
              style={styles.paymentSupportButton}
              onPress={() => Linking.openURL(mantenimiento.payment_support)}
            >
              <MaterialIcons name="picture-as-pdf" size={20} color="#1976D2" />
              <Text style={styles.paymentSupportText}>Ver PDF</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.verifyPaymentButton}
            onPress={() => handlePaymentVerification(true)}
          >
            <MaterialIcons name="check-circle" size={20} color="#fff" />
            <Text style={styles.verifyPaymentButtonText}>Pago Verificado</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.rejectPaymentButton}
            onPress={() => handlePaymentVerification(false)}
          >
            <MaterialIcons name="cancel" size={20} color="#fff" />
            <Text style={styles.rejectPaymentButtonText}>Pago No Realizado</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderAssignTechnicianSection = () => {
    const isPaid = mantenimiento?.is_paid;
    const isPaymentVerified = isPaid === true;
    const isNoPaymentRequired = isPaid === null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Asignar Técnico</Text>
        <View style={styles.verificationCard}>
          <View style={styles.verificationHeader}>
            <MaterialIcons name="engineering" size={24} color="#4CAF50" />
            <Text style={styles.verificationTitle}>
              {isPaymentVerified ? 'Pago Verificado' : 'Sin Pago Requerido'}
            </Text>
          </View>
          <Text style={styles.verificationDescription}>
            {isPaymentVerified 
              ? 'El pago ha sido verificado. Puedes proceder a asignar un técnico.'
              : 'Este mantenimiento no requiere pago. Puedes asignar un técnico directamente.'
            }
          </Text>
          
          <TouchableOpacity
            style={styles.assignTechnicianButton}
            onPress={() => navigation.navigate('AsignarTecnico', { mantenimientoId: mantenimiento.id })}
          >
            <MaterialIcons name="person-add" size={20} color="#fff" />
            <Text style={styles.assignTechnicianButtonText}>Asignar Técnico</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPaymentPendingSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Esperando Pago</Text>
      <View style={styles.verificationCard}>
        <View style={styles.verificationHeader}>
          <MaterialIcons name="schedule" size={24} color="#FF9800" />
          <Text style={styles.verificationTitle}>Cotización Enviada</Text>
        </View>
        <Text style={styles.verificationDescription}>
          La cotización ha sido enviada al cliente. El cliente debe subir el soporte de pago antes de poder asignar un técnico.
        </Text>
        
        {mantenimiento?.value && (
          <View style={styles.quotationInfo}>
            <Text style={styles.quotationInfoLabel}>Valor de la cotización:</Text>
            <Text style={styles.quotationInfoValue}>${mantenimiento.value.toLocaleString()}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderProgressSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>En Progreso</Text>
      <View style={styles.verificationCard}>
        <View style={styles.verificationHeader}>
          <MaterialIcons name="build" size={24} color="#2196F3" />
          <Text style={styles.verificationTitle}>Mantenimiento en Progreso</Text>
        </View>
        <Text style={styles.verificationDescription}>
          El técnico está trabajando en este mantenimiento.
        </Text>
        
        {mantenimiento?.technician && (
          <View style={styles.technicianInfo}>
            <Text style={styles.technicianInfoLabel}>Técnico asignado:</Text>
            <Text style={styles.technicianInfoValue}>{mantenimiento.technician.user.name}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderCompletedSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Completado</Text>
      <View style={styles.verificationCard}>
        <View style={styles.verificationHeader}>
          <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
          <Text style={styles.verificationTitle}>Mantenimiento Completado</Text>
        </View>
        <Text style={styles.verificationDescription}>
          Este mantenimiento ha sido completado exitosamente.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      <View style={styles.header}>
        <BackButton color="#fff" />
        <Text style={styles.headerTitle}>Detalle del Mantenimiento</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
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
                <Text style={styles.infoValue}>{formatDateWithTime(mantenimiento.date_maintenance)}</Text>
              </View>
            )}
            {mantenimiento.shift && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Turno:</Text>
                <Text style={styles.infoValue}>
                  {mantenimiento.shift} {mantenimiento.shift === 'AM' ? '(8:00 AM - 12:30 PM)' : '(1:30 PM - 6:00 PM)'}
                </Text>
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
        {mantenimiento.client && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nombre:</Text>
                <Text style={styles.infoValue}>{mantenimiento.client.name || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValue}>{mantenimiento.client.phone || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dirección:</Text>
                <Text style={styles.infoValue}>{mantenimiento.client.address || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ciudad:</Text>
                <Text style={styles.infoValue}>{mantenimiento.client.city || 'N/A'}, {mantenimiento.client.department || 'N/A'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Información de los Equipos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Equipos ({Array.isArray(mantenimiento.device) ? mantenimiento.device.length : 1})
          </Text>
          {(() => {
            const devices = Array.isArray(mantenimiento.device) ? mantenimiento.device : (mantenimiento.device ? [mantenimiento.device] : []);
            return devices.length > 0 ? (
              devices.map((device, index) => (
                <View key={device.id} style={[styles.infoCard, index > 0 && styles.deviceCardSpacing]}>
                  <View style={styles.deviceHeader}>
                    <MaterialIcons name="devices" size={20} color="#1976D2" />
                    <Text style={styles.deviceTitle}>Equipo #{device.id}</Text>
                  </View>
                  
                  <View style={styles.deviceGrid}>
                    <View style={styles.deviceInfoItem}>
                      <Text style={styles.deviceInfoLabel}>Marca</Text>
                      <Text style={styles.deviceInfoValue}>{device.brand || 'N/A'}</Text>
                    </View>
                    <View style={styles.deviceInfoItem}>
                      <Text style={styles.deviceInfoLabel}>Modelo</Text>
                      <Text style={styles.deviceInfoValue}>{device.model || 'N/A'}</Text>
                    </View>
                    <View style={styles.deviceInfoItem}>
                      <Text style={styles.deviceInfoLabel}>Tipo</Text>
                      <Text style={styles.deviceInfoValue}>{device.type || 'N/A'}</Text>
                    </View>
                    <View style={styles.deviceInfoItem}>
                      <Text style={styles.deviceInfoLabel}>Serial</Text>
                      <Text style={styles.deviceInfoValue}>{device.serial || 'N/A'}</Text>
                    </View>
                    <View style={[styles.deviceInfoItem, styles.deviceInfoItemFull]}>
                      <Text style={styles.deviceInfoLabel}>Dirección</Text>
                      <Text style={styles.deviceInfoValue}>{device.address || 'N/A'}</Text>
                    </View>
                    {device.pivot_description && (
                      <View style={[styles.deviceInfoItem, styles.deviceInfoItemFull]}>
                        <Text style={styles.deviceInfoLabel}>Descripción del Mantenimiento</Text>
                        <Text style={styles.deviceInfoValue}>{device.pivot_description}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.infoCard}>
                <Text style={styles.emptyText}>No hay información de equipos disponible</Text>
              </View>
            );
          })()}
        </View>

        {/* Técnico Asignado */}
        {mantenimiento.technician && mantenimiento.technician.user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Técnico Asignado</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nombre:</Text>
                <Text style={styles.infoValue}>{mantenimiento.technician.user.name || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{mantenimiento.technician.user.email || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValue}>{mantenimiento.technician.phone || 'N/A'}</Text>
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

        {/* Sección de Acciones según el Estado */}
        {renderActionSection()}

        {/* Botón de Editar Cotización - Si tiene cotización (quoted o payment_uploaded) */}
        {(mantenimiento?.status === 'quoted' || mantenimiento?.status === 'payment_uploaded') && (
          <View style={styles.section}>
            <View style={styles.editSection}>
              <View style={styles.editHeader}>
                <MaterialIcons name="edit" size={24} color="#FF9800" />
                <Text style={styles.editSectionTitle}>Editar Cotización</Text>
              </View>
              <Text style={styles.editDescription}>
                Puedes modificar el tipo de mantenimiento, valor o documento de cotización
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditQuotation}
              >
                <MaterialIcons name="edit" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Editar Cotización</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Edición */}
      <EditQuotationModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveEdit}
        currentData={{
          is_paid: mantenimiento?.is_paid || null,
          value: mantenimiento?.value || null,
          price_support: mantenimiento?.price_support || null,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  keyboardAvoidingView: {
    flex: 1,
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
  // Estilos para equipos
  deviceCardSpacing: {
    marginTop: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  deviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
    marginLeft: 8,
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  deviceInfoItem: {
    width: '48%',
    marginBottom: 12,
  },
  deviceInfoItemFull: {
    width: '100%',
  },
  deviceInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceInfoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Estilos para verificación
  verificationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976D2',
    marginLeft: 8,
  },
  verificationDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  uploadSection: {
    marginBottom: 20,
  },
  valueInputContainer: {
    marginTop: 16,
  },
  valueLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  valueInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#374151',
  },
  buttonContainer: {
    gap: 12,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  noPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  noPaymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  editSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  editSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9800',
    marginLeft: 8,
  },
  editDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  paymentSupportSection: {
    marginBottom: 16,
  },
  paymentSupportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  paymentSupportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  paymentSupportText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  verifyPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyPaymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  rejectPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rejectPaymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  assignTechnicianButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  assignTechnicianButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  quotationInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  quotationInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  quotationInfoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976D2',
  },
  technicianInfo: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  technicianInfoLabel: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
  technicianInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
});
