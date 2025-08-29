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
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import BackButton from '../../../components/BackButton';
import { getMantenimientoById } from '../../../services/MantenimientoService';
import { useAuth } from '../../../context/AuthContext';

const { width } = Dimensions.get('window');

interface MaintenanceStatus {
  color: string;
  backgroundColor: string;
  icon: string;
}

const STATUS_CONFIG: Record<string, MaintenanceStatus> = {
  pending: { color: '#ff9f00', backgroundColor: '#fff3cd', icon: 'schedule' },
  assigned: { color: '#0077b6', backgroundColor: '#cce7ff', icon: 'assignment-ind' },
  in_progress: { color: '#007200', backgroundColor: '#d4edda', icon: 'build' },
  completed: { color: '#28a745', backgroundColor: '#d1ecf1', icon: 'check-circle' },
  canceled: { color: '#dc3545', backgroundColor: '#f8d7da', icon: 'cancel' },
};

export default function DetalleMantenimiento() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useAuth();
  const { id } = route.params as { id: number };

  const [loading, setLoading] = useState(true);
  const [mantenimiento, setMantenimiento] = useState<any>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMantenimiento();
  }, [id, token]);

  const fetchMantenimiento = async () => {
    try {
      setLoading(true);
      const data = await getMantenimientoById(id, token);
      setMantenimiento(data);
    } catch (error) {
      console.error('Error al obtener mantenimiento:', error);
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
      console.error('Error al compartir:', error);
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
            <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
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
            <Text style={styles.headerTitle}>Mantenimiento {mantenimiento.device.model}</Text>
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

        {/* Estado prominente */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
            <MaterialIcons name={statusConfig.icon as any} size={24} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {traducirEstado(mantenimiento.status)}
            </Text>
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

          {/* Equipo */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="precision-manufacturing" size={20} color="#0077b6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Equipo</Text>
              <Text style={styles.infoValue}>{mantenimiento.device?.model || 'Sin modelo'}</Text>
              {mantenimiento.device?.serial && (
                  <Text style={styles.infoSubvalue}>Serie: {mantenimiento.device.serial}</Text>
              )}
            </View>
          </View>

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
                {'Cedula: ' + mantenimiento.technician?.document || 'No asignado'}
              </Text>
              {mantenimiento.technician?.phone && (
                  <TouchableOpacity
                      style={styles.phoneButton}
                      onPress={() => handleCallTechnician(mantenimiento.technician.user.phone)}
                  >
                    <MaterialIcons name="phone" size={16} color="#0077b6" />
                    <Text style={styles.phoneText}>{mantenimiento.technician.user.phone} Llamar Tecnico</Text>
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

          {mantenimiento.status === 'pending' && (
              <TouchableOpacity style={styles.primaryButton}>
                <MaterialIcons name="edit" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Editar</Text>
              </TouchableOpacity>
          )}
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0077b6',
    borderRadius: 2,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
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
});