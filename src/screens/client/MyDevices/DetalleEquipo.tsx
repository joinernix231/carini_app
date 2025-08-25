import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getEquipoVinculado } from '../../../services/EquipoClienteService';
import { useAuth } from '../../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type RouteParams = {
  deviceId: number;
};

// Función para obtener el icono según el tipo de equipo
const getEquipmentIcon = (type: string) => {
  const typeMap: { [key: string]: string } = {
    'aire_acondicionado': 'ac-unit',
    'refrigerador': 'kitchen',
    'lavadora': 'local-laundry-service',
    'secadora': 'dry',
    'horno': 'microwave',
    'default': 'settings'
  };
  return typeMap[type?.toLowerCase()] || typeMap['default'];
};

// Función para obtener el color según el tipo
const getEquipmentColor = (type: string) => {
  const colorMap: { [key: string]: string[] } = {
    'aire_acondicionado': ['#2196F3', '#1976D2'],
    'refrigerador': ['#4CAF50', '#388E3C'],
    'lavadora': ['#9C27B0', '#7B1FA2'],
    'secadora': ['#FF9800', '#F57C00'],
    'horno': ['#F44336', '#D32F2F'],
    'default': ['#607D8B', '#455A64']
  };
  return colorMap[type?.toLowerCase()] || colorMap['default'];
};

export default function DetalleEquipo() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { deviceId } = route.params as RouteParams;

  const [equipo, setEquipo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (token && deviceId) fetchDetalle();
  }, [token, deviceId]);

  const fetchDetalle = async () => {
    try {
      const data = await getEquipoVinculado(token!, deviceId);
      setEquipo(data);
    } catch (error) {
      console.error('Error cargando equipo', error);
      Alert.alert('Error', 'No se pudo cargar el detalle del equipo.');
    } finally {
      setLoading(false);
    }
  };

  const abrirManualPDF = () => {
    const uri = equipo?.device?.pdf_url;

    if (!uri) {
      Alert.alert(
          'Manual no disponible',
          'El manual de este equipo no está disponible en este momento.',
          [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Linking.openURL(uri).catch((err) => {
      console.error('Error al abrir el PDF:', err);
      Alert.alert('Error', 'No se pudo abrir el manual. Verifica tu conexión a internet.');
    });
  };

  const solicitarMantenimiento = () => {
    Alert.alert(
        'Solicitar Mantenimiento',
        '¿Deseas solicitar mantenimiento para este equipo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Solicitar',
            style: 'default',
            onPress: () => {
              // Navegar a pantalla de solicitud de mantenimiento
              navigation.navigate('SolicitarMantenimiento', { equipoId: equipo.id });
            }
          },
        ]
    );
  };

  const compartirInformacion = () => {
    const info = `Equipo: ${equipo.device.model}\nMarca: ${equipo.device.brand}\nSerial: ${equipo.device.serial}\nUbicación: ${equipo.address}`;
    // Implementar función de compartir
    Alert.alert('Información copiada', 'La información del equipo ha sido preparada para compartir.');
  };

  if (loading) {
    return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0077b6" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0077b6" />
            <Text style={styles.loadingText}>Cargando información...</Text>
          </View>
        </SafeAreaView>
    );
  }

  if (!equipo) {
    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={60} color="#e74c3c" />
            <Text style={styles.errorTitle}>Equipo no encontrado</Text>
            <Text style={styles.errorText}>
              No se pudo cargar la información de este equipo.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDetalle}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    );
  }

  const equipmentColors = getEquipmentColor(equipo.device.type);
  const equipmentIcon = getEquipmentIcon(equipo.device.type);

  return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={equipmentColors[0]} />

        {/* Header con gradiente */}
        <LinearGradient colors={equipmentColors} style={styles.header}>
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <MaterialIcons name={equipmentIcon} size={40} color="#fff" />
            </View>
            <Text style={styles.title}>{equipo.device.model}</Text>
            <Text style={styles.brandText}>{equipo.device.brand}</Text>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={compartirInformacion}>
            <MaterialIcons name="share" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Imagen del equipo */}
          <View style={styles.imageContainer}>
            {equipo.device.photo ? (
                <View style={styles.imageWrapper}>
                  <Image
                      source={{ uri: equipo.device.photo }}
                      style={styles.image}
                      resizeMode="cover"
                      onLoadStart={() => setImageLoading(true)}
                      onLoadEnd={() => setImageLoading(false)}
                  />
                  {imageLoading && (
                      <View style={styles.imageLoadingOverlay}>
                        <ActivityIndicator size="small" color="#0077b6" />
                      </View>
                  )}
                </View>
            ) : (
                <View style={styles.placeholderImage}>
                  <MaterialIcons name={equipmentIcon} size={60} color="#ccc" />
                  <Text style={styles.placeholderText}>Sin imagen disponible</Text>
                </View>
            )}
          </View>

          {/* Estado del equipo */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: equipo.status ? '#27ae60' : '#e74c3c' }
            ]}>
              <MaterialIcons
                  name={equipo.status ? "check-circle" : "cancel"}
                  size={16}
                  color="#fff"
              />
              <Text style={styles.statusText}>
                {equipo.status ? 'Operativo' : 'Inactivo'}
              </Text>
            </View>
          </View>

          {/* Información detallada */}
          <View style={styles.infoContainer}>
            <Text style={styles.sectionTitle}>Información del Equipo</Text>

            <InfoCard>
              <InfoRow
                  label="Modelo"
                  value={equipo.device.model}
                  icon="settings"
                  color={equipmentColors[0]}
              />
              <InfoRow
                  label="Marca"
                  value={equipo.device.brand}
                  icon="business"
                  color={equipmentColors[0]}
              />
              <InfoRow
                  label="Tipo"
                  value={equipo.device.type}
                  icon="category"
                  color={equipmentColors[0]}
              />
              <InfoRow
                  label="Número de Serie"
                  value={equipo.serial}
                  icon="qr-code"
                  color={equipmentColors[0]}
              />
            </InfoCard>

            <InfoCard>
              <InfoRow
                  label="Ubicación"
                  value={equipo.address}
                  icon="location-on"
                  color="#e74c3c"
              />
              <InfoRow
                  label="Fecha de Fabricación"
                  value={new Date(equipo.device.manufactured_at).toLocaleDateString('es-ES')}
                  icon="event"
                  color="#e74c3c"
              />
              <InfoRow
                  label="Vinculado desde"
                  value={new Date(equipo.created_at).toLocaleDateString('es-ES')}
                  icon="link"
                  color="#e74c3c"
              />
            </InfoCard>
          </View>

          {/* Botones de acción */}
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Acciones Disponibles</Text>

            <View style={styles.actionGrid}>
              <ActionButton
                  icon="build"
                  label="Solicitar Mantenimiento"
                  subtitle="Programa una revisión"
                  color="#FF6B35"
                  onPress={solicitarMantenimiento}
              />

              <ActionButton
                  icon="file-download"
                  label="Manual de Usuario"
                  subtitle="Descargar PDF"
                  color="#6C5CE7"
                  onPress={abrirManualPDF}
              />

            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
}

// Componentes auxiliares
const InfoCard = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.infoCard}>
      {children}
    </View>
);

const InfoRow = ({
                   label,
                   value,
                   icon,
                   color = '#0077b6',
                 }: {
  label: string;
  value: string;
  icon: string;
  color?: string;
}) => (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconContainer, { backgroundColor: `${color}15` }]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
);

const ActionButton = ({
                        icon,
                        label,
                        subtitle,
                        color,
                        onPress,
                      }: {
  icon: string;
  label: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
        <MaterialIcons name={icon as any} size={24} color="#fff" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 15,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#0077b6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  imageContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  placeholderImage: {
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 50) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});