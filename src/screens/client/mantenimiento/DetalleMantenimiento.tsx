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
import { getMantenimientoById, uploadPaymentSupport } from '../../../services/MantenimientoService';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import DocumentUploader from '../../../components/DocumentUploader';
import SparePartSuggestionCard from '../../../components/Cliente/SparePartSuggestionCard';

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
  const [mantenimiento, setMantenimiento] = useState<any>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPaymentSupport, setUploadingPaymentSupport] = useState(false);

  useEffect(() => {
    fetchMantenimiento();
  }, [id, token]);

  const fetchMantenimiento = async () => {
    try {
      setLoading(true);
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      const data = await getMantenimientoById(id, token as string);
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
    Alert.alert(
        'Llamar al técnico',
        `¿Deseas llamar a ${mantenimiento.technician?.user?.name}?`,
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
    try {
      const message = `
🔧 Mantenimiento ${traducirTipo(mantenimiento.type)}
📋 Estado: ${traducirEstado(mantenimiento.status)}
🏷️ ID: #${mantenimiento.id}
📅 Fecha: ${mantenimiento.date_maintenance ? formatearFecha(mantenimiento.date_maintenance) : 'No programada'}
🔧 Equipo: ${mantenimiento.device?.model || 'N/A'}
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

        {/* Estado prominente mejorado */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
            <View style={[styles.statusIconContainer, { backgroundColor: statusConfig.color }]}>
              <MaterialIcons name={statusConfig.icon as any} size={22} color="#FFFFFF" />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusLabel}>Estado actual</Text>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {traducirEstado(mantenimiento.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Timeline/Progreso */}
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

        {/* Información principal */}
        <View style={styles.mainInfo}>
          {/* Fecha */}
          {mantenimiento.date_maintenance && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="event" size={20} color="#0077b6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Fecha programada</Text>
                  <Text style={styles.infoValue}>{formatearFecha(mantenimiento.date_maintenance)}</Text>
                </View>
              </View>
          )}

          {/* Turno */}
          {mantenimiento.shift && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="schedule" size={20} color="#0077b6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Turno</Text>
                  <Text style={styles.infoValue}>
                    {mantenimiento.shift === 'AM' ? 'Mañana: 8:30 AM - 12:30 PM' : 
                     mantenimiento.shift === 'PM' ? 'Tarde: 1:30 PM - 5:30 PM' : mantenimiento.shift}
                  
                  </Text>
                </View>
              </View>
          )}

          {/* Valor */}
          {mantenimiento.value && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="attach-money" size={20} color="#0077b6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Valor del mantenimiento</Text>
                  <Text style={styles.infoValue}>
                    ${mantenimiento.value.toLocaleString('es-CO')} COP
                  </Text>
                </View>
              </View>
          )}

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
                    ${parseFloat(mantenimiento.value).toLocaleString('es-CO')} COP
                  </Text>
                </View>
                
                {mantenimiento.price_support && (
                  <TouchableOpacity 
                    style={styles.pdfButton}
                    onPress={() => handleViewPDF(mantenimiento.price_support)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="picture-as-pdf" size={20} color="#FFFFFF" />
                    <Text style={styles.pdfButtonText}>Ver cotización PDF</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Equipos */}
          {mantenimiento.device && mantenimiento.device.length > 0 && (
            <View style={styles.devicesContainer}>
              <View style={styles.devicesHeader}>
                <MaterialIcons name="precision-manufacturing" size={20} color="#0077b6" />
                <Text style={styles.devicesTitle}>Equipos ({mantenimiento.device.length})</Text>
              </View>
              
              {mantenimiento.device.map((device: any, index: number) => (
                <View key={`maintenance-${mantenimiento.id}-device-${index}`} style={styles.deviceCard}>
                  <View style={styles.deviceHeader}>
                    <MaterialIcons name="hardware" size={18} color="#0077b6" />
                    <Text style={styles.deviceModel}>{device.model || 'Sin modelo'}</Text>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceLabel}>Marca:</Text>
                    <Text style={styles.deviceValue}>{device.brand || '-'}</Text>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceLabel}>Tipo:</Text>
                    <Text style={styles.deviceValue}>{device.type || '-'}</Text>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceLabel}>Serie:</Text>
                    <Text style={styles.deviceValue}>{device.serial || '-'}</Text>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceLabel}>Dirección:</Text>
                    <Text style={styles.deviceValue}>{device.address || '-'}</Text>
                  </View>
                  {device.pivot_description && (
                    <View style={styles.deviceDescription}>
                      <Text style={styles.deviceDescriptionLabel}>Descripción:</Text>
                      <Text style={styles.deviceDescriptionText}>{device.pivot_description}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Sugerencias de Repuesto */}
          {mantenimiento.spare_part_suggestions && mantenimiento.spare_part_suggestions.length > 0 && (
            <View style={styles.sparePartSuggestionsContainer}>
              <View style={styles.sparePartSuggestionsHeader}>
                <View style={styles.sparePartSuggestionsHeaderLeft}>
                  <View style={styles.sparePartSuggestionsIconContainer}>
                    <MaterialIcons name="build-circle" size={24} color="#FF9500" />
                  </View>
                  <View>
                    <Text style={styles.sparePartSuggestionsTitle}>
                      Sugerencias de Repuesto
                    </Text>
                    <Text style={styles.sparePartSuggestionsSubtitle}>
                      {mantenimiento.spare_part_suggestions.length} sugerencia{mantenimiento.spare_part_suggestions.length !== 1 ? 's' : ''} del técnico
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.sparePartSuggestionsList}>
                {mantenimiento.spare_part_suggestions.map((suggestion: any) => (
                  <SparePartSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                  />
                ))}
              </View>
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
              <Text style={styles.infoValue}>
              {'Cedula: ' + (mantenimiento.technician?.document || 'No asignado')}
              </Text>
              {mantenimiento.technician?.phone && (
                  <TouchableOpacity
                      style={styles.phoneButton}
                      onPress={() => handleCallTechnician(mantenimiento.technician.phone)}
                  > 
                    <MaterialIcons name="phone" size={16} color="#0077b6" />
                    <Text style={styles.phoneText}>{mantenimiento.technician.phone} Llamar Tecnico</Text>
                  </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Descripción */}
          {mantenimiento.description && (
              <View style={styles.descriptionContainer}>
                <View style={styles.descriptionHeader}>
                  <MaterialIcons name="description" size={20} color="#0077b6" />
                  <Text style={styles.descriptionTitle}>Descripción</Text>
                </View>
                <Text style={styles.descriptionText}>{mantenimiento.description}</Text>
              </View>
          )}

          {/* Repuestos - Solo mostrar si hay repuestos */}
          {mantenimiento.spare_parts && mantenimiento.spare_parts.length > 0 && (
            <View style={styles.sparePartsContainer}>
              <View style={styles.sparePartsHeader}>
                <MaterialIcons name="build" size={20} color="#0077b6" />
                <Text style={styles.sparePartsTitle}>Repuestos requeridos</Text>
              </View>

              <View style={styles.sparePartsList}>
                {mantenimiento.spare_parts.map((repuesto: any, index: number) => {
                  console.log('🔧 Repuesto:', repuesto);

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

                  // Si es un objeto con más información (ejemplo)
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

                  return null; // en caso de que no sea string ni objeto
                })}
              </View>
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

          {/* Imagen */}
          {mantenimiento.photo && (
              <View style={styles.imageSection}>
                <View style={styles.imageSectionHeader}>
                  <MaterialIcons name="photo" size={20} color="#0077b6" />
                  <Text style={styles.imageSectionTitle}>Foto del equipo</Text>
                </View>
                <TouchableOpacity
                    style={styles.imageContainer}
                    onPress={() => setImageModalVisible(true)}
                >
                  <Image
                      source={{ uri: mantenimiento.photo }}
                      style={styles.image}
                      resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <MaterialIcons name="zoom-in" size={24} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
          )}
        </View>

        {/* Modal para imagen ampliada */}
        <Modal
            visible={imageModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={styles.imageModalContainer}>
            <TouchableOpacity
                style={styles.imageModalOverlay}
                activeOpacity={1}
                onPress={() => setImageModalVisible(false)}
            >
              <View style={styles.imageModalContent}>
                <Image
                    source={{ uri: mantenimiento.photo }}
                    style={styles.fullscreenImage}
                    resizeMode="contain"
                />
                <TouchableOpacity
                    style={styles.closeImageButton}
                    onPress={() => setImageModalVisible(false)}
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
  imageSection: {
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
  imageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  imageSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
});