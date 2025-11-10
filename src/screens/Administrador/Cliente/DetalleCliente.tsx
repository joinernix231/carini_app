import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    StatusBar,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '../../../components/BackButton';
import { useCliente } from '../../../hooks/cliente/useCliente';
import { Cliente } from '../../../types/cliente/cliente';
import { useError } from '../../../context/ErrorContext';
import { useSmartNavigation } from '../../../hooks/useSmartNavigation';

const { width } = Dimensions.get('window');

type RootStackParamList = {
    DetalleCliente: { id: number };
    EditarCliente: { id: number } | undefined;
    ClienteList: undefined;
};

type RouteParams = {
    id: number;
};

export default function DetalleCliente() {
    const route = useRoute();
    const navigation = useNavigation<any>();
    const { navigate } = useSmartNavigation();
    
    // Asegurar que el ID sea un número
    const routeParams = route.params as RouteParams;
    const id = typeof routeParams?.id === 'number' ? routeParams.id : parseInt(String(routeParams?.id || '0'));

    const {
        cliente,
        loading,
        error,
        fetchCliente,
        updateCliente,
        changeStatus,
        removeCliente,
    } = useCliente(id);
    const { showError } = useError();

    const displayName = cliente?.name ?? 'Cliente';
    const displayEmail = cliente?.user?.email ?? '-';

    const handleEdit = useCallback(() => {
        navigation.navigate('EditarCliente', { id });
    }, [navigation, id]);

    const confirmDelete = useCallback(() => {
        Alert.alert(
            'Eliminar cliente',
            `¿Estás seguro que deseas eliminar a ${displayName}? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeCliente();
                            Alert.alert('Éxito', 'Cliente eliminado', [{ text: 'OK', onPress: () => navigation.navigate('ClienteList') }]);
                        } catch (err) {
                            // El error se maneja automáticamente por el sistema global
                            // Error log removed
                        }
                    },
                },
            ]
        );
    }, [displayName, removeCliente, navigation]);

    const toggleStatus = useCallback(() => {
        if (!cliente) return;
        const next = cliente.status === 'active' ? 'inactive' : 'active';
        Alert.alert(
            `${next === 'active' ? 'Activar' : 'Desactivar'} cliente`,
            `¿Deseas cambiar el estado a "${next === 'active' ? 'Activo' : 'Inactivo'}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            await changeStatus(next);
                            Alert.alert('Éxito', `Estado cambiado a ${next === 'active' ? 'Activo' : 'Inactivo'}`);
                        } catch (err) {
                            // El error se maneja automáticamente por el sistema global
                            // Error log removed
                        }
                    },
                },
            ]
        );
    }, [cliente, changeStatus]);

    const formatDate = (value?: string | null) => {
        if (!value) return '-';
        const normalized = value.replace(' ', 'T');
        const d = new Date(normalized);
        if (isNaN(d.getTime())) return value;
        return d.toLocaleString();
    };

    const getDocumentTypeLabel = (type?: string) => {
        switch (type) {
            case 'CC': return 'CC - Cédula de Ciudadanía';
            case 'CE': return 'CE - Cédula de Extranjería';
            case 'CI': return 'CI - Cédula de Identidad';
            case 'PASS': return 'PASS - Pasaporte';
            case 'NIT': return 'NIT - Número de Identificación Tributaria';
            default: return type || '-';
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0EA5E9" />
                    <Text style={styles.loadingText}>Cargando cliente...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!cliente && !loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color="#EF4444" />
                    <Text style={styles.errorTitle}>Cliente no encontrado</Text>
                    <Text style={styles.errorText}>{error ?? 'No se pudo cargar la información.'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchCliente()}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />

            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={['#0EA5E9', '#0284C7', '#0369A1']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerRow}>
                        <BackButton color="#ffffff" />
                        <View style={styles.headerCenter}>
                            <View style={styles.avatar}>
                                <Ionicons name="business-outline" size={44} color="#0EA5E9" />
                            </View>

                            <Text style={styles.title}>{displayName}</Text>

                            <View style={[styles.statusBadge, { 
                                backgroundColor: cliente?.status === 'active' 
                                    ? 'rgba(16, 185, 129, 0.2)' 
                                    : 'rgba(239, 68, 68, 0.2)',
                            }]}>
                                <View style={[styles.statusDot, { 
                                    backgroundColor: cliente?.status === 'active' ? '#10B981' : '#EF4444' 
                                }]} />
                                <Text style={[styles.statusText, { 
                                    color: cliente?.status === 'active' ? '#10B981' : '#EF4444' 
                                }]}>
                                    {cliente?.status === 'active' ? 'Activo' : 'Inactivo'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.headerActions}>
                            <TouchableOpacity onPress={() => {
                                Alert.alert('Compartir', `Cliente: ${displayName}`);
                            }} accessibilityLabel="Compartir cliente" style={styles.shareButton}>
                                <MaterialIcons name="share" size={22} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchCliente()} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información general</Text>
                    <View style={styles.card}>
                        <Row label="Identificador" value={cliente?.identifier ?? '-'} icon="fingerprint" color="#7C3AED" />
                        <Row label="Email" value={cliente?.user?.email ?? '-'} icon="email" color="#7C3AED" />
                        <Row label="Teléfono" value={cliente?.phone ?? '-'} icon="phone" color="#06B6D4" />
                        <Row label="Dirección" value={cliente?.address ?? '-'} icon="place" color="#F59E0B" />
                        <Row label="Ciudad" value={cliente?.city ?? '-'} icon="location-city" color="#10B981" />
                        <Row label="Departamento" value={cliente?.department ?? '-'} icon="map" color="#8B5CF6" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información legal</Text>
                    <View style={styles.card}>
                        <Row label="Tipo de Cliente" value={cliente?.client_type ?? '-'} icon="person" color="#3B82F6" />
                        <Row label="Tipo de Documento" value={getDocumentTypeLabel(cliente?.document_type)} icon="card-membership" color="#EF4444" />
                        <Row label="Representante Legal" value={cliente?.legal_representative ?? '-'} icon="account-balance" color="#F59E0B" />
                    </View>
                </View>

                {cliente?.contacts && cliente.contacts.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contactos ({cliente.contacts.length})</Text>
                        <View style={styles.card}>
                            {cliente.contacts.map((contact, index) => (
                                <View key={contact.id || index} style={styles.contactItem}>
                                    <View style={styles.contactHeader}>
                                        <Text style={styles.contactName}>{contact.nombre_contacto}</Text>
                                        <Text style={styles.contactRole}>{contact.cargo}</Text>
                                    </View>
                                    <Row label="Email" value={contact.correo} icon="email" color="#7C3AED" />
                                    <Row label="Teléfono" value={contact.telefono} icon="phone" color="#06B6D4" />
                                    <Row label="Dirección" value={contact.direccion} icon="place" color="#F59E0B" />
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del sistema</Text>
                    <View style={styles.card}>
                        <Row label="Creado" value={formatDate(cliente?.created_at)} icon="event" color="#34D399" />
                        <Row label="Actualizado" value={formatDate(cliente?.updated_at)} icon="update" color="#60A5FA" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dispositivos</Text>
                    <View style={styles.actionRow}>
                        <ActionButton 
                            label="Ver Dispositivos" 
                            icon="devices" 
                            color="#3B82F6" 
                            onPress={() => navigate('ClienteDevices', { 
                                clientId: cliente?.id, 
                                clientName: cliente?.name 
                            })} 
                            disabled={!cliente} 
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acciones</Text>
                    <View style={styles.actionRow}>
                        <ActionButton label="Editar" icon="edit" color="#F59E0B" onPress={handleEdit} disabled={!cliente} />
                        <ActionButton
                            label={cliente?.status === 'active' ? 'Desactivar' : 'Activar'}
                            icon={cliente?.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                            color={cliente?.status === 'active' ? '#F97316' : '#10B981'}
                            onPress={toggleStatus}
                            disabled={!cliente}
                        />
                        <ActionButton label="Eliminar" icon="delete" color="#EF4444" onPress={confirmDelete} disabled={!cliente} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/* Small presentational components */
const Row = ({ label, value, icon, color }: { label: string; value?: string; icon: string; color: string }) => (
    <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: `${color}22` }]}>
            <MaterialIcons name={icon as any} size={18} color={color} />
        </View>
        <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value ?? '-'}</Text>
        </View>
    </View>
);

const ActionButton = ({ icon, label, color, onPress, disabled }: { icon: string; label: string; color: string; onPress: () => void; disabled?: boolean }) => (
    <TouchableOpacity style={[styles.actionBtn, disabled && { opacity: 0.6 }]} onPress={onPress} disabled={disabled}>
        <View style={[styles.actionIcon, { backgroundColor: color }]}>
            <MaterialIcons name={icon as any} size={20} color="#fff" />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFB' },
    headerWrapper: {
        overflow: 'hidden',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    header: { 
        paddingTop: 12, 
        paddingBottom: 28, 
        paddingHorizontal: 16,
    },
    headerRow: { 
        flexDirection: 'row', 
        alignItems: 'center',
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerActions: { width: 44, alignItems: 'flex-end' },
    shareButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: { 
        width: 88, 
        height: 88, 
        borderRadius: 44, 
        backgroundColor: '#ffffff', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    title: { 
        color: '#ffffff', 
        fontSize: 22, 
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        marginBottom: 4,
    },
    subtitle: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    statusBadge: { 
        marginTop: 10, 
        paddingHorizontal: 14, 
        paddingVertical: 6, 
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: { 
        fontWeight: '600', 
        fontSize: 13,
    },

    scrollContainer: { flex: 1 },

    section: { paddingHorizontal: 16, marginTop: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },

    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rowIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rowContent: { flex: 1 },
    rowLabel: { fontSize: 13, color: '#6B7280' },
    rowValue: { fontSize: 16, fontWeight: '600', color: '#0F172A' },

    contactItem: {
        backgroundColor: '#F8FAFB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    contactHeader: {
        marginBottom: 8,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    contactRole: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap' },
    actionBtn: { width: (width - 56) / 3, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    actionIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    actionLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center', color: '#1F2937' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 8, color: '#6B7280' },

    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    errorTitle: { marginTop: 12, fontSize: 18, fontWeight: '700', color: '#1F2937' },
    errorText: { color: '#6B7280', marginTop: 8, textAlign: 'center' },
    retryButton: { marginTop: 16, backgroundColor: '#0EA5E9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontWeight: '700' },
});