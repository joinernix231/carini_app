import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { getCliente } from '../../../services/ClienteService';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '../../../components/BackButton';

const { width } = Dimensions.get('window');

type RouteParams = {
  id: number;
};

type ClienteDetalle = {
  id: number;
  identifier: string | null;
  name: string;
  email?: string | null;
  legal_representative: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  user_id: number;
  created_at: string | null;
  updated_at: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

export default function DetalleCliente() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { id } = route.params as RouteParams;

  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && id) fetchDetalle();
  }, [token, id]);

  const fetchDetalle = async () => {
    try {
      const data: any = await getCliente(id, token!);
      const normalized: ClienteDetalle = {
        ...(data || {}),
        email: (data?.email ?? data?.user?.email ?? null),
      };
      setCliente(normalized);
    } catch (error) {
      console.error('Error cargando cliente', error);
      Alert.alert('Error', 'No se pudo cargar el detalle del cliente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando cliente...</Text>
          </View>
        </SafeAreaView>
    );
  }

  if (!cliente) {
    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={60} color="#e74c3c" />
            <Text style={styles.errorTitle}>Cliente no encontrado</Text>
            <Text style={styles.errorText}>
              No se pudo cargar la información de este cliente.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDetalle}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    );
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    // If backend sends 'YYYY-MM-DD HH:mm:ss', show localized date & time
    const normalized = value.replace(' ', 'T');
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />

        {/* Header con gradiente */}
        <LinearGradient colors={['#007AFF', '#005BBB']} style={styles.header}>
          <BackButton style={styles.backButton} />

          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-circle-outline" size={60} color="#fff" />
            </View>
            <Text style={styles.title}>{cliente.name}</Text>
            <Text style={styles.subTitle}>{cliente.email || cliente.identifier || cliente.phone || ''}</Text>
          </View>

          <TouchableOpacity
              style={styles.shareButton}
              onPress={() =>
                  Alert.alert(
                      'Compartir',
                      `Cliente: ${cliente.name}\nEmail: ${cliente.email ?? '-'}\nIdentificador: ${cliente.identifier ?? '-'}\nTeléfono: ${cliente.phone ?? '-'}`
                  )
              }
          >
            <MaterialIcons name="share" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Información detallada */}
          <View style={styles.infoContainer}>
            <Text style={styles.sectionTitle}>Información del Cliente</Text>

            <InfoCard>
              <InfoRow label="Nombre" value={cliente.name} icon="person" color="#007AFF" />
              <InfoRow label="Email" value={cliente.email} icon="email" color="#007AFF" />
              <InfoRow label="Identificación" value={cliente.identifier} icon="fingerprint" color="#007AFF" />
              <InfoRow label="Dirección" value={cliente.address} icon="place" color="#007AFF" />
              <InfoRow label="Ciudad" value={cliente.city} icon="location-city" color="#007AFF" />
              <InfoRow label="Teléfono" value={cliente.phone} icon="phone" color="#007AFF" />
              <InfoRow label="Creado" value={formatDate(cliente.created_at)} icon="event" color="#007AFF" />
            </InfoCard>
          </View>

          {/* Acciones */}
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Acciones</Text>

            <View style={styles.actionGrid}>
              <ActionButton
                  icon="edit"
                  label="Editar Cliente"
                  subtitle="Modificar datos"
                  color="#FF9800"
                  onPress={() => navigation.navigate('EditarCliente', { id: cliente.id })}
              />
              <ActionButton
                  icon="delete"
                  label="Eliminar Cliente"
                  subtitle="Borrar registro"
                  color="#FF3B30"
                  onPress={() =>
                      Alert.alert(
                          'Eliminar',
                          '¿Seguro deseas eliminar este cliente?',
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Eliminar', style: 'destructive', onPress: () => {} },
                          ]
                      )
                  }
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
}

// Componentes auxiliares
const InfoCard = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.infoCard}>{children}</View>
);

const InfoRow = ({
                   label,
                   value,
                   icon,
                   color,
                 }: {
  label: string;
  value?: string | number | null;
  icon: string;
  color: string;
}) => (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconContainer, { backgroundColor: `${color}15` }]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value === null || value === undefined || value === '' ? '-' : String(value)}</Text>
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
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginTop: 15, marginBottom: 8 },
  errorText: { fontSize: 16, color: '#7f8c8d', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: 'bold' },
  header: { paddingTop: 10, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 8 },
  shareButton: { padding: 8 },
  headerContent: { flex: 1, alignItems: 'center' },
  iconContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  title: { fontSize: 22, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subTitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  scrollContainer: { flex: 1 },
  infoContainer: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  infoIconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 14, color: '#7f8c8d', marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  actionSection: { paddingHorizontal: 20, paddingBottom: 30 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionButton: { width: (width - 50) / 2, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  actionIconContainer: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginBottom: 4 },
  actionSubtitle: { fontSize: 12, color: '#7f8c8d', textAlign: 'center' },
});
