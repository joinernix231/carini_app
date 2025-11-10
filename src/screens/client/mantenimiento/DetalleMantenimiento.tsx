import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
  Share,
  Linking,
  RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSmartNavigation } from '../../../hooks/useSmartNavigation';
import { MaterialIcons } from '@expo/vector-icons';
import BackButton from '../../../components/BackButton';
import { uploadPaymentSupport } from '../../../services/MantenimientoService';
import { MantenimientoInformationService, MaintenanceInformation } from '../../../services/MantenimientoInformationService';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import DocumentUploader from '../../../components/DocumentUploader';
import SparePartSuggestionCard from '../../../components/Cliente/SparePartSuggestionCard';
import MantenimientoConfirmationService from '../../../services/MantenimientoConfirmationService';

const { width } = Dimensions.get('window');

interface MaintenanceStatus {
  color: string;
  backgroundColor: string;
  icon: string;
}

const STATUS_CONFIG: Record<string, MaintenanceStatus> = {
  pending: { color: '#F59E0B', backgroundColor: '#FEF3C7', icon: 'schedule' },
  assigned: { color: '#3B82F6', backgroundColor: '#DBEAFE', icon: 'assignment-ind' },
  in_progress: { color: '#8B5CF6', backgroundColor: '#EDE9FE', icon: 'build' },
  completed: { color: '#10B981', backgroundColor: '#D1FAE5', icon: 'check-circle' },
  canceled: { color: '#EF4444', backgroundColor: '#FEE2E2', icon: 'cancel' },
  payment_uploaded: { color: '#06B6D4', backgroundColor: '#CFFAFE', icon: 'receipt' },
  quoted: { color: '#EC4899', backgroundColor: '#FCE7F3', icon: 'request-quote' },
};

export default function DetalleMantenimiento() {
  const { goBack } = useSmartNavigation();
  const route = useRoute();
  const { token } = useAuth();
  const { showError } = useError();
  const { id } = route.params as { id: number };

  const [loading, setLoading] = useState(true);
  const [mantenimiento, setMantenimiento] = useState<MaintenanceInformation | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPaymentSupport, setUploadingPaymentSupport] = useState(false);
  const [confirming, setConfirming] = useState(false);
  
  // Estados para secciones colapsables
  const [expandedSections, setExpandedSections] = useState({
    devices: false, // Equipos colapsados por defecto
    photos: true, // Fotos expandidas por defecto
    workInfo: true, // Información del trabajo expandida por defecto
    spareParts: false, // Repuestos colapsados por defecto
    sparePartSuggestions: true, // Sugerencias expandidas por defecto
    description: false, // Descripción colapsada por defecto
  });

  useEffect(() => {
    fetchMantenimiento();
  }, [id, token]);

  const fetchMantenimiento = async () => {
    try {
      setLoading(true);
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      const data = await MantenimientoInformationService.getMaintenanceInformation(id, token as string);
      console.log('🔧 Datos del mantenimiento:', data);
      console.log('🔧 Spare parts:', data.spare_parts);
      console.log('🔧 Spare part suggestions:', data.spare_part_suggestions);
      setMantenimiento(data);
    } catch (error) {
      // Error log removed
      Alert.alert('Error', 'No se pudo cargar la información del mantenimiento.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMantenimiento();
  };

  const traducirEstado = (estadoIngles: string): string => {
    const traducciones: Record<string, string> = {
      pending: 'Pendiente',
      assigned: 'Asignado',
      in_progress: 'En progreso',
      completed: 'Completado',
      canceled: 'Cancelado',
      payment_uploaded: 'Pago cargado',
      quoted: 'Cotizado',
    };
    return traducciones[estadoIngles] || estadoIngles;
  };

  const traducirTipo = (tipo: string): string => {
    return tipo === 'preventive' ? 'Preventivo' : 'Correctivo';
  };

  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCallTechnician = (phone: string) => {
    if (!mantenimiento) return;
    Alert.alert(
        'Llamar al técnico',
        `¿Deseas llamar a ${mantenimiento.technician?.user?.name || 'el técnico'}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Llamar', onPress: () => Linking.openURL(`tel:${phone}`) },
        ]
    );
  };

  const handleViewPDF = (pdfUrl: string) => {
    Alert.alert(
      'Ver cotización PDF',
      '¿Deseas abrir la cotización en PDF?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Abrir PDF', 
          onPress: () => {
            Linking.openURL(pdfUrl).catch(() => {
              Alert.alert('Error', 'No se pudo abrir el PDF. Verifica tu conexión a internet.');
            });
          }
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!mantenimiento) return;
    try {
      const deviceInfo = mantenimiento.devices && mantenimiento.devices.length > 0 
        ? mantenimiento.devices[0]?.device?.model || 'N/A'
        : 'N/A';
      const message = `
🔧 Mantenimiento ${traducirTipo(mantenimiento.type)}
📋 Estado: ${traducirEstado(mantenimiento.status)}
🏷️ ID: #${mantenimiento.id}
📅 Fecha: ${mantenimiento.date_maintenance ? formatearFecha(mantenimiento.date_maintenance) : 'No programada'}
🔧 Equipo: ${deviceInfo}
👨‍🔧 Técnico: ${mantenimiento.technician?.user?.name || 'No asignado'}
📝 Descripción: ${mantenimiento.description || 'Sin descripción'}
      `.trim();

      await Share.share({ message });
    } catch (error) {
      // Error log removed
    }
  };

  const handlePaymentSupportUpload = async (documentUrl: string | null) => {
    if (!token || !documentUrl) return;
    
    try {
      setUploadingPaymentSupport(true);
      
      const response = await uploadPaymentSupport(id, documentUrl, token);
      
      // Actualizar el mantenimiento localmente
      setMantenimiento((prev: any) => ({
        ...prev,
        payment_support: documentUrl
      }));
      
      Alert.alert(
        'Soporte de Pago Subido',
        'El soporte de pago ha sido subido exitosamente.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      // Error log removed
      showError(error, 'Error al subir el soporte de pago');
    } finally {
      setUploadingPaymentSupport(false);
    }
  };

  const handleConfirmMaintenance = async () => {
    if (!token) return;

    Alert.alert(
      'Confirmar Mantenimiento',
      '¿Estás seguro de que deseas confirmar este mantenimiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setConfirming(true);
              const response = await MantenimientoConfirmationService.confirmMaintenance(
                id,
                token
              );

              if (response.success) {
                // Actualizar el mantenimiento localmente
                setMantenimiento((prev: any) => ({
                  ...prev,
                  confirmation_required: false,
                  confirmed_at: response.data.confirmed_at,
                }));

                Alert.alert(
                  'Mantenimiento Confirmado',
                  'El mantenimiento ha sido confirmado exitosamente.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error: any) {
              showError(error, 'Error al confirmar el mantenimiento');
            } finally {
              setConfirming(false);
            }
          },
        },
      ]
    );
  };

  const getTimeRemaining = () => {
    if (!mantenimiento?.confirmation_deadline) return null;
    
    const deadline = new Date(mantenimiento.confirmation_deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) return 'Tiempo agotado';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Función para toggle de secciones
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Si el estado es "assigned" y no está confirmado, mostrar el botón de confirmación
  const isConfirmationPending = mantenimiento?.status === 'assigned' && !mantenimiento?.confirmed_at;
  const isConfirmationOverdue = isConfirmationPending && mantenimiento?.confirmation_deadline && 
    new Date(mantenimiento.confirmation_deadline) < new Date();

  if (loading) {
    return (
        <View style={styles.loaderContainer}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#0077b6" />
            <Text style={styles.loaderText}>Cargando detalles...</Text>
          </View>
        </View>
    );
  }

  if (!mantenimiento) {
    return (
        <View style={styles.loaderContainer}>
          <View style={styles.errorCard}>
            <MaterialIcons name="error-outline" size={48} color="#dc3545" />
            <Text style={styles.errorTitle}>No encontrado</Text>
            <Text style={styles.errorMessage}>No se encontró el mantenimiento solicitado.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={goBack}>
              <MaterialIcons name="arrow-back" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
    );
  }

  const statusConfig = STATUS_CONFIG[mantenimiento.status] || STATUS_CONFIG.pending;

  return (
      <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#0077b6']}
                tintColor="#0077b6"
            />
          }
      >
        {/* Header con gradiente */}
        <View style={styles.header}>
          <BackButton color="#fff" size={24} style={{ marginRight: 10 }} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mantenimiento #{mantenimiento.id}</Text>
            <Text style={styles.headerSubtitle}>{traducirTipo(mantenimiento.type)}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleShare}>
              <MaterialIcons name="share" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleRefresh}>
              <MaterialIcons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>


        {/* Sección de Confirmación */}
        {mantenimiento.status === 'assigned' && (
          <View style={styles.confirmationContainer}>
            {mantenimiento.confirmed_at ? (
              <View style={[styles.confirmationCard, styles.confirmationCardConfirmed]}>
                <View style={styles.confirmationHeader}>
                  <MaterialIcons name="check-circle" size={24} color="#10B981" />
                  <Text style={styles.confirmationTitle}>Mantenimiento Confirmado</Text>
                </View>
                <Text style={styles.confirmationText}>
                  Confirmado el {new Date(mantenimiento.confirmed_at).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            ) : isConfirmationPending ? (
              <View style={[styles.confirmationCard, isConfirmationOverdue ? styles.confirmationCardOverdue : styles.confirmationCardPending]}>
                <View style={styles.confirmationHeader}>
                  <MaterialIcons 
                    name={isConfirmationOverdue ? "warning" : "schedule"} 
                    size={24} 
                    color={isConfirmationOverdue ? "#EF4444" : "#F59E0B"} 
                  />
                  <Text style={[styles.confirmationTitle, { color: isConfirmationOverdue ? "#EF4444" : "#F59E0B" }]}>
                    {isConfirmationOverdue ? 'Confirmación Pendiente' : 'Pendiente de Confirmación'}
                  </Text>
                </View>
                <Text style={styles.confirmationText}>
                  {mantenimiento.technician?.user?.name 
                    ? `Se ha asignado el técnico ${mantenimiento.technician.user.name} para el ${mantenimiento.date_maintenance ? formatearFecha(mantenimiento.date_maintenance) : 'fecha programada'} (${mantenimiento.shift === 'AM' ? 'Mañana' : 'Tarde'}). Por favor confirma tu mantenimiento.`
                    : 'Por favor confirma este mantenimiento para que el técnico pueda iniciar.'}
                </Text>
                {mantenimiento.confirmation_deadline && (
                  <View style={styles.timeRemainingContainer}>
                    <MaterialIcons name="access-time" size={16} color={isConfirmationOverdue ? "#EF4444" : "#F59E0B"} />
                    <Text style={[styles.timeRemainingText, { color: isConfirmationOverdue ? "#EF4444" : "#F59E0B" }]}>
                      {isConfirmationOverdue 
                        ? 'Tiempo de confirmación agotado' 
                        : `Tiempo restante: ${getTimeRemaining()}`}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
                  onPress={handleConfirmMaintenance}
                  disabled={confirming}
                >
                  {confirming ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="check-circle" size={20} color="#fff" />
                      <Text style={styles.confirmButtonText}>Confirmar Mantenimiento</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        {/* Timeline/Progreso - Solo mostrar si está en progreso o completado */}
        {(mantenimiento.status === 'in_progress' || mantenimiento.status === 'completed' || mantenimiento.status === 'assigned') && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                  style={[
                    styles.progressFill,
                    {
                      width: mantenimiento.status === 'completed' ? '100%' :
                          mantenimiento.status === 'in_progress' ? '75%' :
                              mantenimiento.status === 'assigned' ? '50%' : '25%'
                    }
                  ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>Creado</Text>
              <Text style={styles.progressLabel}>Asignado</Text>
              <Text style={styles.progressLabel}>En proceso</Text>
              <Text style={styles.progressLabel}>Completado</Text>
            </View>
          </View>
        )}

        {/* Resumen Principal - Siempre visible */}
        <View style={styles.mainInfo}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryTitleRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
                  <View style={[styles.statusIconContainer, { backgroundColor: statusConfig.color }]}>
                    <MaterialIcons name={statusConfig.icon as any} size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusLabel}>Estado actual</Text>
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {traducirEstado(mantenimiento.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.summaryId}>#{mantenimiento.id}</Text>
              </View>
              <View style={styles.summaryInfoGrid}>
                {mantenimiento.date_maintenance && (
                  <View style={styles.summaryInfoItem}>
                    <MaterialIcons name="event" size={14} color="#666" />
                    <Text style={styles.summaryInfoText}>{formatearFecha(mantenimiento.date_maintenance)}</Text>
                  </View>
                )}
                {mantenimiento.shift && (
                  <View style={styles.summaryInfoItem}>
                    <MaterialIcons name="schedule" size={14} color="#666" />
                    <Text style={styles.summaryInfoText}>
                      {mantenimiento.shift === 'AM' ? 'Mañana' : mantenimiento.shift === 'PM' ? 'Tarde' : mantenimiento.shift}
                    </Text>
                  </View>
                )}
                {mantenimiento.devices && mantenimiento.devices.length > 0 && (
                  <View style={styles.summaryInfoItem}>
                    <MaterialIcons name="precision-manufacturing" size={14} color="#666" />
                    <Text style={styles.summaryInfoText}>{mantenimiento.devices.length} equipos</Text>
                  </View>
                )}
                {mantenimiento.technician?.user?.name && (
                  <View style={styles.summaryInfoItem}>
                    <MaterialIcons name="person" size={14} color="#666" />
                    <Text style={styles.summaryInfoText} numberOfLines={1}>
                      {mantenimiento.technician.user.name}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Información básica en una sola tarjeta */}
          <View style={styles.infoCard}>
            {(mantenimiento.date_maintenance || mantenimiento.shift || mantenimiento.value) && (
              <>
                {mantenimiento.date_maintenance && (
                  <View style={styles.infoRowCompact}>
                    <MaterialIcons name="event" size={18} color="#0077b6" />
                    <Text style={styles.infoLabelCompact}>Fecha:</Text>
                    <Text style={styles.infoValueCompact}>{formatearFecha(mantenimiento.date_maintenance)}</Text>
                  </View>
                )}
                {mantenimiento.shift && (
                  <View style={styles.infoRowCompact}>
                    <MaterialIcons name="schedule" size={18} color="#0077b6" />
                    <Text style={styles.infoLabelCompact}>Turno:</Text>
                    <Text style={styles.infoValueCompact}>
                      {mantenimiento.shift === 'AM' ? 'Mañana (8:30 AM - 12:30 PM)' : 
                       mantenimiento.shift === 'PM' ? 'Tarde (1:30 PM - 5:30 PM)' : mantenimiento.shift}
                    </Text>
                  </View>
                )}
                {mantenimiento.value && (
                  <View style={styles.infoRowCompact}>
                    <MaterialIcons name="attach-money" size={18} color="#0077b6" />
                    <Text style={styles.infoLabelCompact}>Valor:</Text>
                    <Text style={styles.infoValueCompact}>
                      ${parseFloat(mantenimiento.value).toLocaleString('es-CO')} COP
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Sección de Cotización */}
          {mantenimiento.status === 'quoted' && mantenimiento.value && (
            <View style={styles.quotationContainer}>
              <View style={styles.quotationHeader}>
                <MaterialIcons name="request-quote" size={24} color="#EC4899" />
                <Text style={styles.quotationTitle}>Cotización</Text>
              </View>
              
              <View style={styles.quotationCard}>
                <View style={styles.quotationInfo}>
                  <Text style={styles.quotationLabel}>Valor cotizado</Text>
                  <Text style={styles.quotationValue}>
                    ${parseFloat(mantenimiento.value || '0').toLocaleString('es-CO')} COP
                  </Text>
                </View>
                
                {mantenimiento.price_support && (
                  <TouchableOpacity 
                    style={styles.pdfButton}
                    onPress={() => handleViewPDF(mantenimiento.price_support || '')}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="picture-as-pdf" size={20} color="#FFFFFF" />
                    <Text style={styles.pdfButtonText}>Ver cotización PDF</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Equipos - Colapsable */}
          {mantenimiento.devices && mantenimiento.devices.length > 0 && (
            <View style={styles.devicesContainer}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => toggleSection('devices')}
                activeOpacity={0.7}
              >
                <View style={styles.collapsibleHeaderLeft}>
                  <MaterialIcons name="precision-manufacturing" size={20} color="#0077b6" />
                  <Text style={styles.collapsibleHeaderTitle}>
                    Equipos ({mantenimiento.devices.length})
                  </Text>
                </View>
                <MaterialIcons
                  name={expandedSections.devices ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
              
              {expandedSections.devices && (
                <>
                  {mantenimiento.devices.map((deviceItem: any, index: number) => (
                <View key={`maintenance-${mantenimiento.id}-device-${index}`} style={styles.deviceCard}>
                  <View style={styles.deviceHeader}>
                    <MaterialIcons name="hardware" size={18} color="#0077b6" />
                    <Text style={styles.deviceModel}>{deviceItem.device?.model || 'Sin modelo'}</Text>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceLabel}>Marca:</Text>
                    <Text style={styles.deviceValue}>{deviceItem.device?.brand || '-'}</Text>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceLabel}>Tipo:</Text>
                    <Text style={styles.deviceValue}>{deviceItem.device?.type || '-'}</Text>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceLabel}>Serie:</Text>
                    <Text style={styles.deviceValue}>{deviceItem.serial || '-'}</Text>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceLabel}>Dirección:</Text>
                    <Text style={styles.deviceValue}>{deviceItem.address || '-'}</Text>
                  </View>
                  {deviceItem.pivot?.description && (
                    <View style={styles.deviceDescription}>
                      <Text style={styles.deviceDescriptionLabel}>Descripción:</Text>
                      <Text style={styles.deviceDescriptionText}>{deviceItem.pivot.description}</Text>
                    </View>
                  )}
                </View>
              ))}
                </>
              )}
            </View>
          )}

          {/* Sugerencias de Repuesto - Colapsable */}
          {mantenimiento.spare_part_suggestions && mantenimiento.spare_part_suggestions.length > 0 && (
            <View style={styles.sparePartSuggestionsContainer}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => toggleSection('sparePartSuggestions')}
                activeOpacity={0.7}
              >
                <View style={styles.collapsibleHeaderLeft}>
                  <View style={styles.sparePartSuggestionsIconContainer}>
                    <MaterialIcons name="build-circle" size={24} color="#FF9500" />
                  </View>
                  <View>
                    <Text style={styles.collapsibleHeaderTitle}>
                      Sugerencias de Repuesto ({mantenimiento.spare_part_suggestions.length})
                    </Text>
                    <Text style={styles.sparePartSuggestionsSubtitle}>
                      {mantenimiento.spare_part_suggestions.length} sugerencia{mantenimiento.spare_part_suggestions.length !== 1 ? 's' : ''} del técnico
                    </Text>
                  </View>
                </View>
                <MaterialIcons
                  name={expandedSections.sparePartSuggestions ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
              
              {expandedSections.sparePartSuggestions && (
                <View style={styles.sparePartSuggestionsList}>
                {mantenimiento.spare_part_suggestions.map((suggestion: any) => (
                  <SparePartSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                  />
                ))}
                </View>
              )}
            </View>
          )}

          {/* Técnico */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="person" size={20} color="#0077b6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Técnico asignado</Text>
              <Text style={styles.infoValue}>
                {mantenimiento.technician?.user?.name || 'No asignado'}
              </Text>
              {mantenimiento.technician?.phone && (
                <TouchableOpacity
                  style={styles.phoneButton}
                  onPress={() => mantenimiento.technician && handleCallTechnician(mantenimiento.technician.phone)}
                > 
                  <MaterialIcons name="phone" size={16} color="#0077b6" />
                  <Text style={styles.phoneText}>{mantenimiento.technician.phone} - Llamar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Descripción - Colapsable */}
          {mantenimiento.description && (
            <View style={styles.descriptionContainer}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => toggleSection('description')}
                activeOpacity={0.7}
              >
                <View style={styles.collapsibleHeaderLeft}>
                  <MaterialIcons name="description" size={20} color="#0077b6" />
                  <Text style={styles.collapsibleHeaderTitle}>Descripción</Text>
                </View>
                <MaterialIcons
                  name={expandedSections.description ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
              {expandedSections.description && (
                <Text style={styles.descriptionText}>{mantenimiento.description}</Text>
              )}
            </View>
          )}

          {/* Repuestos - Solo mostrar si hay repuestos - Colapsable */}
          {mantenimiento.spare_parts && mantenimiento.spare_parts.length > 0 && (
            <View style={styles.sparePartsContainer}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => toggleSection('spareParts')}
                activeOpacity={0.7}
              >
                <View style={styles.collapsibleHeaderLeft}>
                  <MaterialIcons name="build" size={20} color="#0077b6" />
                  <Text style={styles.collapsibleHeaderTitle}>
                    Repuestos requeridos ({mantenimiento.spare_parts.length})
                  </Text>
                </View>
                <MaterialIcons
                  name={expandedSections.spareParts ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>

              {expandedSections.spareParts && (
                <View style={styles.sparePartsList}>
                {Array.isArray(mantenimiento.spare_parts) ? mantenimiento.spare_parts.map((repuesto: any, index: number) => {
                  // Si el repuesto es un string simple
                  if (typeof repuesto === 'string') {
                    return (
                      <View key={index} style={styles.sparePartItem}>
                        <View style={styles.sparePartInfo}>
                          <Text style={styles.sparePartName}>{repuesto}</Text>
                        </View>
                      </View>
                    );
                  }

                  // Si es un objeto con más información
                  if (typeof repuesto === 'object' && repuesto !== null) {
                    return (
                      <View key={index} style={styles.sparePartItem}>
                        <View style={styles.sparePartInfo}>
                          <Text style={styles.sparePartName}>{repuesto.name || 'Repuesto sin nombre'}</Text>
                          {repuesto.quantity && (
                            <Text style={styles.sparePartQuantity}>Cantidad: {repuesto.quantity}</Text>
                          )}
                        </View>
                      </View>
                    );
                  }

                  return null;
                }) : null}
                </View>
              )}
            </View>
          )}

          {/* Soporte de Pago - Solo mostrar si is_paid es false */}
          {mantenimiento.is_paid === false && (
            <View style={styles.paymentSupportContainer}>
              <View style={styles.paymentSupportHeader}>
                <MaterialIcons name="payment" size={20} color="#0077b6" />
                <Text style={styles.paymentSupportTitle}>Soporte de Pago</Text>
              </View>
              
              <Text style={styles.paymentSupportDescription}>
                Sube el comprobante de pago (PDF) para que podamos verificar tu pago.
              </Text>
              
              <DocumentUploader
                title="Comprobante de Pago"
                initialDocumentUri={mantenimiento.payment_support || null}
                onDocumentUploaded={handlePaymentSupportUpload}
                customDocumentName={`payment_support_${mantenimiento.id}`}
                disabled={uploadingPaymentSupport}
                options={{
                  type: 'application/pdf',
                  copyToCacheDirectory: true,
                }}
              />
              
              {uploadingPaymentSupport && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color="#0077b6" />
                  <Text style={styles.uploadingText}>Subiendo comprobante...</Text>
                </View>
              )}
            </View>
          )}

          {/* Fotos del Mantenimiento - Colapsable */}
          {mantenimiento.photos && mantenimiento.photos.length > 0 && (
            <View style={styles.photosSection}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => toggleSection('photos')}
                activeOpacity={0.7}
              >
                <View style={styles.collapsibleHeaderLeft}>
                  <MaterialIcons name="camera-alt" size={20} color="#0077b6" />
                  <Text style={styles.collapsibleHeaderTitle}>
                    Fotos del Mantenimiento ({mantenimiento.photos.length})
                  </Text>
                </View>
                <MaterialIcons
                  name={expandedSections.photos ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
              
              {expandedSections.photos && (
                <>
                  {/* Agrupar fotos por equipo */}
              {mantenimiento.devices && mantenimiento.devices.map((deviceItem: any) => {
                const devicePhotos = mantenimiento.photos.filter((p: any) => 
                  p.client_device_id === deviceItem.id
                );
                
                if (devicePhotos.length === 0) return null;
                
                const deviceName = `${deviceItem.device?.brand || ''} ${deviceItem.device?.model || ''}`.trim() || 'Equipo sin nombre';
                
                return (
                  <View key={deviceItem.id} style={styles.devicePhotoGroup}>
                    <Text style={styles.devicePhotoGroupTitle}>{deviceName}</Text>
                    
                    {/* Fotos Iniciales del Equipo */}
                    {devicePhotos.filter((p: any) => p.photo_type === 'initial').length > 0 && (
                      <View style={styles.photoGroup}>
                        <Text style={styles.photoGroupTitle}>Fotos Iniciales</Text>
                        <View style={styles.photoGrid}>
                          {devicePhotos
                            .filter((p: any) => p.photo_type === 'initial')
                            .map((photo: any) => (
                              <View key={photo.id} style={styles.photoItemWrapper}>
                                <TouchableOpacity
                                  style={styles.photoItem}
                                  onPress={() => {
                                    setSelectedImageUrl(photo.photo_url || photo.photo);
                                    setImageModalVisible(true);
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <Image
                                    source={{ uri: photo.photo_url || photo.photo }}
                                    style={styles.photoThumbnail}
                                    resizeMode="cover"
                                  />
                                  <View style={styles.photoThumbnailOverlay}>
                                    <MaterialIcons name="zoom-in" size={16} color="#fff" />
                                  </View>
                                </TouchableOpacity>
                              </View>
                            ))}
                        </View>
                      </View>
                    )}

                    {/* Fotos Finales del Equipo */}
                    {devicePhotos.filter((p: any) => p.photo_type === 'final').length > 0 && (
                      <View style={styles.photoGroup}>
                        <Text style={styles.photoGroupTitle}>Fotos Finales</Text>
                        <View style={styles.photoGrid}>
                          {devicePhotos
                            .filter((p: any) => p.photo_type === 'final')
                            .map((photo: any) => (
                              <View key={photo.id} style={styles.photoItemWrapper}>
                                <TouchableOpacity
                                  style={styles.photoItem}
                                  onPress={() => {
                                    setSelectedImageUrl(photo.photo_url || photo.photo);
                                    setImageModalVisible(true);
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <Image
                                    source={{ uri: photo.photo_url || photo.photo }}
                                    style={styles.photoThumbnail}
                                    resizeMode="cover"
                                  />
                                  <View style={styles.photoThumbnailOverlay}>
                                    <MaterialIcons name="zoom-in" size={16} color="#fff" />
                                  </View>
                                </TouchableOpacity>
                              </View>
                            ))}
                        </View>
                      </View>
                    )}

                    {/* Fotos de Repuestos del Equipo */}
                    {devicePhotos.filter((p: any) => p.photo_type === 'part').length > 0 && (
                      <View style={styles.photoGroup}>
                        <Text style={styles.photoGroupTitle}>Fotos de Repuestos</Text>
                        <View style={styles.photoGrid}>
                          {devicePhotos
                            .filter((p: any) => p.photo_type === 'part')
                            .map((photo: any) => (
                              <View key={photo.id} style={styles.photoItemWrapper}>
                                <TouchableOpacity
                                  style={styles.photoItem}
                                  onPress={() => {
                                    setSelectedImageUrl(photo.photo_url || photo.photo);
                                    setImageModalVisible(true);
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <Image
                                    source={{ uri: photo.photo_url || photo.photo }}
                                    style={styles.photoThumbnail}
                                    resizeMode="cover"
                                  />
                                  <View style={styles.photoThumbnailOverlay}>
                                    <MaterialIcons name="zoom-in" size={16} color="#fff" />
                                  </View>
                                </TouchableOpacity>
                              </View>
                            ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
                </>
              )}
            </View>
          )}

          {/* Información del Trabajo Realizado - Solo si está completado - Colapsable */}
          {(mantenimiento.status === 'completed' || mantenimiento.statistics?.is_completed) && (
            <View style={styles.workInfoSection}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => toggleSection('workInfo')}
                activeOpacity={0.7}
              >
                <View style={styles.collapsibleHeaderLeft}>
                  <MaterialIcons name="work" size={20} color="#0077b6" />
                  <Text style={styles.collapsibleHeaderTitle}>Información del Trabajo</Text>
                </View>
                <MaterialIcons
                  name={expandedSections.workInfo ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
              
              {expandedSections.workInfo && (
                <View style={styles.workInfoContent}>
                {/* Fecha de inicio */}
                {mantenimiento.started_at && (
                  <View style={styles.workInfoRow}>
                    <MaterialIcons name="play-arrow" size={18} color="#10B981" />
                    <View style={styles.workInfoTextContainer}>
                      <Text style={styles.workInfoLabel}>Inicio del trabajo</Text>
                      <Text style={styles.workInfoValue}>
                        {new Date(mantenimiento.started_at).toLocaleString('es-CO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Tiempo total de trabajo */}
                {mantenimiento.total_work_time && (
                  <View style={styles.workInfoRow}>
                    <MaterialIcons name="timer" size={18} color="#0077b6" />
                    <View style={styles.workInfoTextContainer}>
                      <Text style={styles.workInfoLabel}>Tiempo total de trabajo</Text>
                      <Text style={styles.workInfoValue}>{mantenimiento.total_work_time}</Text>
                    </View>
                  </View>
                )}

                {/* Tiempo de pausa */}
                {mantenimiento.total_pause_formatted && mantenimiento.total_pause_formatted !== '00:00' && (
                  <View style={styles.workInfoRow}>
                    <MaterialIcons name="pause-circle" size={18} color="#F59E0B" />
                    <View style={styles.workInfoTextContainer}>
                      <Text style={styles.workInfoLabel}>Tiempo de pausa</Text>
                      <Text style={styles.workInfoValue}>{mantenimiento.total_pause_formatted}</Text>
                    </View>
                  </View>
                )}

                {/* Firma de quien recibe el mantenimiento */}
                {mantenimiento.signature_photo && (
                  <View style={styles.signatureSection}>
                    <Text style={styles.signatureLabel}>Firma de quien recibe el mantenimiento</Text>
                    <TouchableOpacity
                      style={styles.signatureContainer}
                      onPress={() => {
                        setSelectedImageUrl(mantenimiento.signature_photo);
                        setImageModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: mantenimiento.signature_photo }}
                        style={styles.signatureImage}
                        resizeMode="contain"
                      />
                      <View style={styles.signatureOverlay}>
                        <MaterialIcons name="zoom-in" size={20} color="#fff" />
                        <Text style={styles.signatureOverlayText}>Ver firma completa</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Observaciones del técnico */}
                {mantenimiento.observations && (
                  <View style={styles.observationsSection}>
                    <View style={styles.observationsHeader}>
                      <MaterialIcons name="note" size={18} color="#0077b6" />
                      <Text style={styles.observationsTitle}>Observaciones del técnico</Text>
                    </View>
                    <Text style={styles.observationsText}>{mantenimiento.observations}</Text>
                  </View>
                )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Modal para imagen ampliada */}
        <Modal
            visible={imageModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
              setImageModalVisible(false);
              setSelectedImageUrl(null);
            }}
        >
          <View style={styles.imageModalContainer}>
            <TouchableOpacity
                style={styles.imageModalOverlay}
                activeOpacity={1}
                onPress={() => {
                  setImageModalVisible(false);
                  setSelectedImageUrl(null);
                }}
            >
              <View style={styles.imageModalContent}>
                {selectedImageUrl && (
                  <Image
                      source={{ uri: selectedImageUrl }}
                      style={styles.fullscreenImage}
                      resizeMode="contain"
                  />
                )}
                <TouchableOpacity
                    style={styles.closeImageButton}
                    onPress={() => {
                      setImageModalVisible(false);
                      setSelectedImageUrl(null);
                    }}
                >
                  <MaterialIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <BackButton
              style={styles.secondaryButton}
              color="#0077b6"
              size={20}
              label="Volver"
              labelStyle={styles.secondaryButtonText}
          />

        
        </View>

        {/* Espaciado inferior */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loaderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0077b6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#0077b6',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#cce7ff',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  progressLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  mainInfo: {
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  infoLabelCompact: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    minWidth: 60,
  },
  infoValueCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  devicePhotoGroup: {
    marginBottom: 24,
  },
  devicePhotoGroupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0077b6',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD',
  },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoSubvalue: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  phoneText: {
    fontSize: 14,
    color: '#0077b6',
    fontWeight: '500',
  },
  descriptionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  descriptionText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  quotationContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quotationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quotationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  quotationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#EC4899',
  },
  quotationInfo: {
    marginBottom: 16,
  },
  quotationLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  quotationValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EC4899',
    letterSpacing: 0.5,
  },
  pdfButton: {
    backgroundColor: '#EC4899',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  devicesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  devicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  devicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deviceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0077b6',
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  deviceModel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0077b6',
  },
  deviceInfo: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  deviceLabel: {
    fontSize: 13,
    color: '#6B7280',
    width: 80,
    fontWeight: '500',
  },
  deviceValue: {
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
    fontWeight: '400',
  },
  deviceDescription: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  deviceDescriptionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  deviceDescriptionText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  photosSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  photosSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  photosSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  photoGroup: {
    marginBottom: 20,
  },
  photoGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0077b6',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoItemWrapper: {
    width: (width - 72) / 3, // 3 columnas
  },
  photoItem: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoThumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workInfoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  workInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  workInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  workInfoContent: {
    gap: 16,
  },
  workInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  workInfoTextContainer: {
    flex: 1,
  },
  workInfoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  workInfoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  signatureSection: {
    marginTop: 8,
  },
  signatureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  signatureContainer: {
    position: 'relative',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E3F2FD',
    borderStyle: 'dashed',
  },
  signatureImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  signatureOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signatureOverlayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  observationsSection: {
    marginTop: 8,
    padding: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0077b6',
  },
  observationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  observationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0077b6',
  },
  observationsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  imageModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: width - 40,
    height: width - 40,
    position: 'relative',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  closeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0077b6',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#0077b6',
    fontWeight: '600',
    fontSize: 16,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0077b6',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  bottomSpacing: {
    height: 30,
  },
  sparePartsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sparePartsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sparePartsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sparePartsList: {
    gap: 8,
  },
  sparePartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0077b6',
  },
  sparePartInfo: {
    flex: 1,
  },
  sparePartName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sparePartQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  sparePartDescription: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  sparePartPrice: {
    alignItems: 'flex-end',
  },
  sparePartPriceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
  noSparePartsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    gap: 8,
  },
  noSparePartsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  sparePartSuggestionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sparePartSuggestionsHeader: {
    marginBottom: 16,
  },
  sparePartSuggestionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sparePartSuggestionsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparePartSuggestionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  sparePartSuggestionsSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  sparePartSuggestionsList: {
    gap: 12,
  },
  paymentSupportContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  paymentSupportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  paymentSupportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentSupportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: '#0077b6',
    fontWeight: '500',
  },
  confirmationContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  confirmationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
  },
  confirmationCardPending: {
    borderLeftColor: '#F59E0B',
  },
  confirmationCardOverdue: {
    borderLeftColor: '#EF4444',
  },
  confirmationCardConfirmed: {
    borderLeftColor: '#10B981',
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  confirmationText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  timeRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  timeRemainingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0077b6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#0077b6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#0077b6',
  },
  summaryHeader: {
    gap: 12,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  summaryInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  summaryInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: '45%',
  },
  summaryInfoText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  collapsibleHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
});