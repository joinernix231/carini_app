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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';
import { useAuth } from '../../../context/AuthContext';
import { useTecnico } from '../../../hooks/tecnico/useTecnico';
import { useError } from '../../../context/ErrorContext';
import { Tecnico } from '../../../types/tecnico/tecnico';

const { width } = Dimensions.get('window');

type RootStackParamList = {
    DetalleTecnico: { id: number };
    EditarTecnico: { id: number } | undefined;
};

type RouteParams = {
    id: number;
};

export default function DetalleTecnicoScreen() {
    const route = useRoute();
    const navigation = useNavigation<any>();
    const { id } = route.params as RouteParams;
    const { token } = useAuth();

    // hook singular
    const {
        tecnico,
        loading,
        refreshing,
        error,
        busy,
        fetchTecnico,
        onRefresh,
        removeTecnico,
        changeStatus,
    } = useTecnico(id, { autoFetch: true });
    const { showError } = useError();

    const displayName = tecnico?.user?.name ?? tecnico?.name ?? 'Técnico';
    const displayEmail = tecnico?.user?.email ?? tecnico?.email ?? '-';

    const handleEdit = useCallback(() => {
        navigation.navigate('EditarTecnico', { id });
    }, [navigation, id]);

    const confirmDelete = useCallback(() => {
        Alert.alert(
            'Eliminar técnico',
            `¿Estás seguro que deseas eliminar a ${displayName}? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const ok = await removeTecnico();
                            if (ok) {
                                Alert.alert('Éxito', 'Técnico eliminado', [{ text: 'OK', onPress: () => navigation.goBack() }]);
                            }
                        } catch (err) {
                            // El error se maneja automáticamente por el sistema global
                            console.error('Error eliminando técnico:', err);
                        }
                    },
                },
            ]
        );
    }, [displayName, removeTecnico, navigation]);

    const toggleStatus = useCallback(() => {
        if (!tecnico) return;
        const next = tecnico.status === 'active' ? 'inactive' : 'active';
        Alert.alert(
            `${next === 'active' ? 'Activar' : 'Desactivar'} técnico`,
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
                            console.error('Error cambiando estado:', err);
                        }
                    },
                },
            ]
        );
    }, [tecnico, changeStatus]);

    const formatDate = (value?: string | null) => {
        if (!value) return '-';
        const normalized = value.replace(' ', 'T');
        const d = new Date(normalized);
        if (isNaN(d.getTime())) return value;
        return d.toLocaleString();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0EA5E9" />
                    <Text style={styles.loadingText}>Cargando técnico...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!tecnico && !loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color="#EF4444" />
                    <Text style={styles.errorTitle}>Técnico no encontrado</Text>
                    <Text style={styles.errorText}>{error ?? 'No se pudo cargar la información.'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchTecnico()}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // UI
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />

            <View style={styles.header}>
                <BackButton color="#fff" />
                <View style={styles.headerCenter}>
                    <View style={styles.avatar}>
                        <Ionicons name="construct-outline" size={44} color="#fff" />
                    </View>

                    <Text style={styles.title}>{displayName}</Text>

                    <View style={[styles.statusBadge, { backgroundColor: tecnico?.status === 'active' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.15)' }]}>
                        <Text style={[styles.statusText, { color: tecnico?.status === 'active' ? '#9ef01a' : '#EF4444' }]}>
                            {tecnico?.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Text>
                    </View>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => {
                        // quick share
                        Alert.alert('Compartir', `Técnico: ${displayName}\nEmail: ${displayEmail}`);
                    }} accessibilityLabel="Compartir técnico">
                        <MaterialIcons name="share" size={22} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información general</Text>
                    <View style={styles.card}>
                        <Row label="Documento" value={tecnico?.document ?? '-'} icon="fingerprint" color="#7C3AED" />
                        <Row label="Email" value={tecnico?.user?.email ?? '-'} icon="email" color="#7C3AED" />
                        <Row label="Teléfono" value={tecnico?.phone ?? '-'} icon="phone" color="#06B6D4" />
                        <Row label="Dirección" value={tecnico?.address ?? '-'} icon="place" color="#F59E0B" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del sistema</Text>
                    <View style={styles.card}>
                        <Row label="Creado" value={formatDate(tecnico?.created_at)} icon="event" color="#34D399" />
                        <Row label="Actualizado" value={formatDate((tecnico as any)?.updated_at)} icon="update" color="#60A5FA" />
                        {tecnico?.user?.name && <Row label="Usuario" value={tecnico.user.name} icon="person" color="#FB7185" />}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acciones</Text>
                    <View style={styles.actionRow}>
                        <ActionButton label="Editar" icon="edit" color="#F59E0B" onPress={handleEdit} disabled={!tecnico} />
                        <ActionButton
                            label={tecnico?.status === 'active' ? 'Desactivar' : 'Activar'}
                            icon={tecnico?.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                            color={tecnico?.status === 'active' ? '#F97316' : '#10B981'}
                            onPress={toggleStatus}
                            disabled={busy || !tecnico}
                        />
                        <ActionButton label="Eliminar" icon="delete" color="#EF4444" onPress={confirmDelete} disabled={busy} />
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
    header: { paddingTop: 12, paddingBottom: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0077b6' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerActions: { width: 44, alignItems: 'flex-end' },
    avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    title: { color: '#fff', fontSize: 20, fontWeight: '700' },
    subtitle: { color: 'rgba(255,255,255,0.95)', marginTop: 4 },
    statusBadge: { marginTop: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    statusText: { fontWeight: '700' },

    scrollContainer: { flex: 1 },

    section: { paddingHorizontal: 16, marginTop: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },

    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rowIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rowContent: { flex: 1 },
    rowLabel: { fontSize: 13, color: '#6B7280' },
    rowValue: { fontSize: 16, fontWeight: '600', color: '#0F172A' },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap' },
    actionBtn: { width: (width - 56) / 3, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    actionIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    actionLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 8, color: '#6B7280' },

    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    errorTitle: { marginTop: 12, fontSize: 18, fontWeight: '700' },
    errorText: { color: '#6B7280', marginTop: 8, textAlign: 'center' },
    retryButton: { marginTop: 16, backgroundColor: '#0EA5E9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontWeight: '700' },
});
