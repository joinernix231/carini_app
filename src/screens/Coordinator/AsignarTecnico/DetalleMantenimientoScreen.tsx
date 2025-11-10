import React, { useEffect, useState, useRef } from 'react';
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
  AppState,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';
import DocumentUploader from '../../../components/DocumentUploader';
import EditQuotationModal from '../../../components/EditQuotationModal';
import ReagendarModal from '../../../components/Mantenimiento/ReagendarModal';
import { useSmartNavigation } from '../../../hooks/useSmartNavigation';
import { useMantenimientoDetalle } from '../../../hooks/mantenimiento/useMantenimientoDetalle';
import { getImageUrl } from '../../../utils/imageUtils';
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
  const [reagendarModalVisible, setReagendarModalVisible] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState<boolean>(false);
  const route = useRoute<DetalleMantenimientoRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { goBack } = useSmartNavigation();
  const { mantenimientoId } = route.params;
  const appState = useRef(AppState.currentState);
  const pendingCallMark = useRef<number | null>(null);
  
  const {
    mantenimiento,
    loading,
    refreshing,
    error,
    onRefresh,
    handleVerifyPayment,
  } = useMantenimientoDetalle(mantenimientoId);

  // Listener para detectar cuando la app regresa al foreground después de una llamada
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        pendingCallMark.current !== null
      ) {
        // La app regresó al foreground y hay una llamada pendiente de marcar
        const maintenanceIdToMark = pendingCallMark.current;
        pendingCallMark.current = null;
        
        // Esperar un momento para asegurar que la app está completamente activa
        setTimeout(async () => {
          if (!token) return;
          
          try {
            await CoordinadorMantenimientoService.markAsCalled(maintenanceIdToMark, token);
            Alert.alert('Éxito', 'Llamada al cliente registrada correctamente');
            onRefresh();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'No se pudo registrar la llamada');
          }
        }, 500);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [token, onRefresh]);

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

  // Funciones auxiliares para los action logs
  const getLogActionText = (action: string) => {
    switch (action) {
      case 'assign':
        return 'Asignado';
      case 'on_the_way':
        return 'En Camino';
      case 'start':
        return 'Inicio';
      case 'pause':
        return 'Pausa';
      case 'resume':
        return 'Reanudación';
      case 'end':
        return 'Finalización';
      default:
        return action;
    }
  };

  const getLogActionColor = (action: string) => {
    switch (action) {
      case 'assign':
        return '#007AFF';
      case 'on_the_way':
        return '#FFC107';
      case 'start':
        return '#10B981';
      case 'pause':
        return '#F59E0B';
      case 'resume':
        return '#3B82F6';
      case 'end':
        return '#34C759';
      default:
        return '#6B7280';
    }
  };

  const getLogActionIcon = (action: string) => {
    switch (action) {
      case 'assign':
        return 'document-text';
      case 'on_the_way':
        return 'car';
      case 'start':
        return 'play-circle';
      case 'pause':
        return 'pause-circle';
      case 'resume':
        return 'play-forward-circle';
      case 'end':
        return 'checkmark-circle';
      default:
        return 'ellipse';
    }
  };

  const formatLogDateTime = (dateString: string | null) => {
    if (!dateString) return 'No disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateString;
    }
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

  const handleMarkAsCalled = async () => {
    if (!token) {
      Alert.alert('Error', 'No hay token de autenticación');
      return;
    }

    if (!mantenimiento?.client?.phone) {
      Alert.alert('Error', 'No hay número de teléfono disponible para el cliente');
      return;
    }

    const phoneNumber = mantenimiento.client.phone.trim();
    
    // Formatear el número de teléfono (remover espacios, guiones, etc.)
    const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Verificar que el número sea válido
    if (!cleanPhoneNumber || cleanPhoneNumber.length < 7) {
      Alert.alert('Error', 'El número de teléfono no es válido');
      return;
    }

    // Formato para iOS y Android: tel:numero
    const phoneUrl = `tel:${cleanPhoneNumber}`;

    // Verificar si se puede abrir el teléfono
    const canOpen = await Linking.canOpenURL(phoneUrl);
    
    if (!canOpen) {
      Alert.alert('Error', 'No se puede abrir la aplicación de teléfono en este dispositivo');
      return;
    }

    // Guardar el ID del mantenimiento para marcarlo cuando regrese
    pendingCallMark.current = mantenimiento.id;
    
    try {
      // Abrir la aplicación de teléfono
      await Linking.openURL(phoneUrl);
      
      // Mostrar un mensaje informativo
      Alert.alert(
        'Llamando al Cliente',
        'La llamada se registrará automáticamente cuando regreses a la aplicación.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      pendingCallMark.current = null;
      Alert.alert('Error', 'No se pudo abrir la aplicación de teléfono');
    }
  };

  const handleCancelMaintenance = async () => {
    if (!token) {
      Alert.alert('Error', 'No hay token de autenticación');
      return;
    }

    if (!mantenimiento) {
      Alert.alert('Error', 'No hay información del mantenimiento');
      return;
    }

    // Verificar si el mantenimiento ya está cancelado o completado
    if (mantenimiento.status === 'cancelled') {
      Alert.alert('Información', 'Este mantenimiento ya está cancelado');
      return;
    }

    if (mantenimiento.status === 'completed') {
      Alert.alert('Error', 'No se puede cancelar un mantenimiento completado');
      return;
    }

    const clientName = mantenimiento.client?.name || 'el cliente';
    
    Alert.alert(
      'Cancelar Mantenimiento',
      `¿Estás seguro de que deseas cancelar este mantenimiento?\n\nEsta acción:\n• Cambiará el estado a "Cancelado"\n• Liberará al técnico asignado\n• Limpiará la fecha y turno programados\n• Limpiará los campos de confirmación\n\nEsta acción no se puede deshacer.`,
      [
        {
          text: 'No, mantener',
          style: 'cancel',
        },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await CoordinadorMantenimientoService.cancelMaintenance(mantenimiento.id, token);
              Alert.alert(
                'Éxito',
                'El mantenimiento ha sido cancelado correctamente.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onRefresh();
                      // Opcional: regresar a la pantalla anterior después de cancelar
                      // goBack();
                    },
                  },
                ]
              );
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.message || 'No se pudo cancelar el mantenimiento'
              );
            }
          },
        },
      ]
    );
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
            <Text style={styles.quotationInfoValue}>${parseFloat(mantenimiento.value).toLocaleString()}</Text>
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

        {/* Sección de Confirmación Requerida - Botón para Llamar al Cliente */}
        {mantenimiento.confirmation_required === true && 
         mantenimiento.confirmed_at === null && 
         mantenimiento.coordinator_called === false && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirmación Requerida</Text>
            <View style={styles.confirmationCard}>
              <View style={styles.confirmationHeader}>
                <MaterialIcons name="phone" size={24} color="#FF6B6B" />
                <Text style={styles.confirmationTitle}>Cliente No Ha Confirmado</Text>
              </View>
              <Text style={styles.confirmationDescription}>
                El cliente no ha confirmado el mantenimiento programado. Por favor, llámalo para confirmar la cita.
              </Text>
              {mantenimiento.confirmation_deadline && (
                <View style={styles.deadlineContainer}>
                  <MaterialIcons name="schedule" size={16} color="#FF9800" />
                  <Text style={styles.deadlineText}>
                    Fecha límite: {formatDateWithTime(mantenimiento.confirmation_deadline)}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleMarkAsCalled}
              >
                <MaterialIcons name="phone" size={20} color="#fff" />
                <Text style={styles.callButtonText}>
                  {mantenimiento.client?.phone 
                    ? `Llamar a ${mantenimiento.client.phone}` 
                    : 'Llamar al Cliente'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Información de Estado de Confirmación - Se muestra después de llamar al cliente */}
        {mantenimiento.coordinator_called === true && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estado de Confirmación</Text>
            <View style={styles.infoCard}>
              <View style={styles.confirmationStatusHeader}>
                <MaterialIcons 
                  name={mantenimiento.confirmed_at ? "check-circle" : "schedule"} 
                  size={24} 
                  color={mantenimiento.confirmed_at ? "#4CAF50" : "#FF9800"} 
                />
                <Text style={[
                  styles.confirmationStatusTitle,
                  { color: mantenimiento.confirmed_at ? "#4CAF50" : "#FF9800" }
                ]}>
                  {mantenimiento.confirmed_at ? "Confirmado por el Cliente" : "Pendiente de Confirmación"}
                </Text>
              </View>

              <View style={styles.confirmationInfoContainer}>
                <View style={styles.confirmationInfoRow}>
                  <Text style={styles.confirmationInfoLabel}>Confirmación Requerida:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: mantenimiento.confirmation_required ? "#4CAF50" : "#9E9E9E" }
                  ]}>
                    <Text style={styles.statusText}>
                      {mantenimiento.confirmation_required ? "Sí" : "No"}
                    </Text>
                  </View>
                </View>

                <View style={styles.confirmationInfoRow}>
                  <Text style={styles.confirmationInfoLabel}>Confirmado por Cliente:</Text>
                  <Text style={styles.confirmationInfoValue}>
                    {mantenimiento.confirmed_at 
                      ? formatDateWithTime(mantenimiento.confirmed_at)
                      : "Pendiente"}
                  </Text>
                </View>

                {mantenimiento.confirmation_deadline && (
                  <View style={styles.confirmationInfoRow}>
                    <Text style={styles.confirmationInfoLabel}>Fecha Límite:</Text>
                    <Text style={[
                      styles.confirmationInfoValue,
                      !mantenimiento.confirmed_at && new Date(mantenimiento.confirmation_deadline) < new Date() && styles.warningText
                    ]}>
                      {formatDateWithTime(mantenimiento.confirmation_deadline)}
                    </Text>
                  </View>
                )}

                <View style={styles.confirmationInfoRow}>
                  <Text style={styles.confirmationInfoLabel}>Coordinador Notificado:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: mantenimiento.coordinator_notified ? "#4CAF50" : "#9E9E9E" }
                  ]}>
                    <Text style={styles.statusText}>
                      {mantenimiento.coordinator_notified ? "Sí" : "No"}
                    </Text>
                  </View>
                </View>

                {mantenimiento.coordinator_notified_at && (
                  <View style={styles.confirmationInfoRow}>
                    <Text style={styles.confirmationInfoLabel}>Notificado el:</Text>
                    <Text style={styles.confirmationInfoValue}>
                      {formatDateWithTime(mantenimiento.coordinator_notified_at)}
                    </Text>
                  </View>
                )}

                <View style={styles.confirmationInfoRow}>
                  <Text style={styles.confirmationInfoLabel}>Coordinador Llamó:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: mantenimiento.coordinator_called ? "#4CAF50" : "#9E9E9E" }
                  ]}>
                    <Text style={styles.statusText}>
                      {mantenimiento.coordinator_called ? "Sí" : "No"}
                    </Text>
                  </View>
                </View>

                {mantenimiento.coordinator_called_at && (
                  <View style={styles.confirmationInfoRow}>
                    <Text style={styles.confirmationInfoLabel}>Llamado el:</Text>
                    <Text style={styles.confirmationInfoValue}>
                      {formatDateWithTime(mantenimiento.coordinator_called_at)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Información de los Equipos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Equipos ({mantenimiento.devices?.length || 0})
          </Text>
          {mantenimiento.devices && mantenimiento.devices.length > 0 ? (
            mantenimiento.devices.map((deviceItem, index) => (
              <View key={deviceItem.id} style={[styles.infoCard, index > 0 && styles.deviceCardSpacing]}>
                <View style={styles.deviceHeader}>
                  <MaterialIcons name="devices" size={20} color="#1976D2" />
                  <Text style={styles.deviceTitle}>Equipo #{deviceItem.id}</Text>
                </View>
                
                <View style={styles.deviceGrid}>
                  <View style={styles.deviceInfoItem}>
                    <Text style={styles.deviceInfoLabel}>Marca</Text>
                    <Text style={styles.deviceInfoValue}>{deviceItem.device?.brand || 'N/A'}</Text>
                  </View>
                  <View style={styles.deviceInfoItem}>
                    <Text style={styles.deviceInfoLabel}>Modelo</Text>
                    <Text style={styles.deviceInfoValue}>{deviceItem.device?.model || 'N/A'}</Text>
                  </View>
                  <View style={styles.deviceInfoItem}>
                    <Text style={styles.deviceInfoLabel}>Tipo</Text>
                    <Text style={styles.deviceInfoValue}>{deviceItem.device?.type || 'N/A'}</Text>
                  </View>
                  <View style={styles.deviceInfoItem}>
                    <Text style={styles.deviceInfoLabel}>Serial</Text>
                    <Text style={styles.deviceInfoValue}>{deviceItem.serial || 'N/A'}</Text>
                  </View>
                  <View style={[styles.deviceInfoItem, styles.deviceInfoItemFull]}>
                    <Text style={styles.deviceInfoLabel}>Dirección</Text>
                    <Text style={styles.deviceInfoValue}>{deviceItem.address || 'N/A'}</Text>
                  </View>
                  {deviceItem.pivot?.description && (
                    <View style={[styles.deviceInfoItem, styles.deviceInfoItemFull]}>
                      <Text style={styles.deviceInfoLabel}>Descripción del Mantenimiento</Text>
                      <Text style={styles.deviceInfoValue}>{deviceItem.pivot.description}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.emptyText}>No hay información de equipos disponible</Text>
            </View>
          )}
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

        {/* Historial de Actividad (Action Logs) */}
        {mantenimiento.action_logs && mantenimiento.action_logs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Historial de Actividad ({mantenimiento.action_logs.length})
            </Text>
            <View style={styles.infoCard}>
              {mantenimiento.action_logs.map((log: any, index: number) => {
                const isLast = index === mantenimiento.action_logs.length - 1;
                const actionColor = getLogActionColor(log.action);
                const actionText = getLogActionText(log.action);
                const actionIcon = getLogActionIcon(log.action);

                return (
                  <View key={log.id || index} style={styles.logItem}>
                    <View style={styles.logTimeline}>
                      <View style={[styles.logDot, { backgroundColor: actionColor }]} />
                      {!isLast && <View style={styles.logLine} />}
                    </View>
                    <View style={styles.logContent}>
                      <View style={styles.logHeader}>
                        <View style={styles.logActionHeader}>
                          <Ionicons name={actionIcon as any} size={18} color={actionColor} />
                          <Text style={[styles.logAction, { color: actionColor }]}>{actionText}</Text>
                          {log.is_last && (
                            <View style={[styles.lastBadge, { backgroundColor: actionColor }]}>
                              <Text style={styles.lastBadgeText}>Última</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.logDate}>
                          {formatLogDateTime(log.timestamp || log.created_at)}
                        </Text>
                      </View>
                      {log.reason && (
                        <View style={[styles.logReason, { backgroundColor: `${actionColor}15` }]}>
                          <Text style={[styles.logReasonText, { color: actionColor }]}>
                            {log.reason}
                          </Text>
                        </View>
                      )}
                      {log.latitude && log.longitude && (
                        <TouchableOpacity
                          style={styles.logLocation}
                          onPress={() => {
                            const { openOpenStreetMap } = require('../../../utils/mapUtils');
                            openOpenStreetMap(log.latitude, log.longitude);
                          }}
                        >
                          <Ionicons name="location" size={14} color="#0EA5E9" />
                          <Text style={[styles.logLocationText, { color: '#0EA5E9', textDecorationLine: 'underline' }]}>
                            Ver ubicación en mapa
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
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
                  <Text style={styles.infoValue}>${parseFloat(mantenimiento.value).toLocaleString()}</Text>
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

        {/* Firma del Cliente - Solo cuando está completado */}
        {mantenimiento.status === 'completed' && mantenimiento.signature_photo && (() => {
          const signatureUrl = getImageUrl(mantenimiento.signature_photo);
          if (!signatureUrl) return null;
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Firma del Cliente</Text>
              <View style={styles.infoCard}>
                <TouchableOpacity
                  style={styles.signatureContainer}
                  onPress={() => {
                    setSelectedImageUrl(signatureUrl);
                    setImageModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: signatureUrl }}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                  <View style={styles.signatureOverlay}>
                    <Ionicons name="expand" size={20} color="#fff" />
                    <Text style={styles.signatureOverlayText}>Ver firma completa</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

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

        {/* Botón de Reagendar - Disponible si tiene fecha y turno asignados */}
        {mantenimiento?.date_maintenance && mantenimiento?.shift && 
         mantenimiento?.status !== 'completed' && mantenimiento?.status !== 'cancelled' && (
          <View style={styles.section}>
            <View style={styles.rescheduleSection}>
              <View style={styles.rescheduleHeader}>
                <MaterialIcons name="schedule" size={24} color="#FF9800" />
                <Text style={styles.rescheduleSectionTitle}>Reagendar Mantenimiento</Text>
              </View>
              <Text style={styles.rescheduleDescription}>
                Si necesitas cambiar la fecha, turno o técnico asignado a este mantenimiento.
              </Text>
              <TouchableOpacity
                style={styles.rescheduleButton}
                onPress={() => setReagendarModalVisible(true)}
              >
                <MaterialIcons name="event" size={20} color="#fff" />
                <Text style={styles.rescheduleButtonText}>Reagendar Mantenimiento</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Botón de Cancelar Mantenimiento - Disponible si no está completado o cancelado */}
        {mantenimiento?.status !== 'completed' && mantenimiento?.status !== 'cancelled' && (
          <View style={styles.section}>
            <View style={styles.cancelSection}>
              <View style={styles.cancelHeader}>
                <MaterialIcons name="cancel" size={24} color="#F44336" />
                <Text style={styles.cancelSectionTitle}>Cancelar Mantenimiento</Text>
              </View>
              <Text style={styles.cancelDescription}>
                Si necesitas cancelar este mantenimiento, se liberará al técnico asignado y se limpiarán los campos de programación.
              </Text>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelMaintenance}
              >
                <MaterialIcons name="cancel" size={20} color="#fff" />
                <Text style={styles.cancelButtonText}>Cancelar Mantenimiento</Text>
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

      {/* Modal de Reagendar */}
      <ReagendarModal
        visible={reagendarModalVisible}
        onClose={() => setReagendarModalVisible(false)}
        onSuccess={() => {
          setReagendarModalVisible(false);
          onRefresh();
        }}
        maintenanceId={mantenimiento?.id || 0}
        currentDate={mantenimiento?.date_maintenance || null}
        currentShift={mantenimiento?.shift || null}
        currentTechnicianId={mantenimiento?.technician?.id || null}
      />

      {/* Modal para ver imagen en tamaño completo */}
      {imageModalVisible && selectedImageUrl && (
        <View style={styles.imageModal}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => {
              setImageModalVisible(false);
              setSelectedImageUrl(null);
            }}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImageUrl }}
            style={styles.imageModalImage}
            resizeMode="contain"
          />
        </View>
      )}
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
  confirmationCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
    marginLeft: 8,
  },
  confirmationDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  deadlineText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 6,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelSection: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F44336',
    marginLeft: 8,
  },
  cancelDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  cancelButton: {
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
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  rescheduleSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rescheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rescheduleSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9800',
    marginLeft: 8,
  },
  rescheduleDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  rescheduleButton: {
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
  rescheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmationStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  confirmationStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  confirmationInfoContainer: {
    gap: 12,
  },
  confirmationInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  confirmationInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  confirmationInfoValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  warningText: {
    color: '#F44336',
    fontWeight: '700',
  },
  // Estilos para action logs
  logItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  logTimeline: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
  },
  logDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 1,
  },
  logLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
    minHeight: 20,
  },
  logContent: {
    flex: 1,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logAction: {
    fontSize: 15,
    fontWeight: '700',
  },
  logDate: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    flexShrink: 0,
    marginLeft: 8,
  },
  logReason: {
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  logReasonText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  logLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  logLocationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  lastBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  lastBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  // Estilos para firma del cliente
  signatureContainer: {
    position: 'relative',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  signatureOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  signatureOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Estilos para modal de imagen
  imageModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  imageModalClose: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
    right: 20,
    zIndex: 1001,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageModalImage: {
    width: width - 40,
    height: '80%',
    borderRadius: 12,
  },
});
