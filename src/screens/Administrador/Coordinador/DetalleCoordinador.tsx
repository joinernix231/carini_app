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
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';
import { useAuth } from '../../../context/AuthContext';
import { useCoordinador } from '../../../hooks/coordinador/useCoordinador';
import { useError } from '../../../context/ErrorContext';

const { width } = Dimensions.get('window');

type RootStackParamList = {
    DetalleCoordinador: { id: number };
    EditarCoordinador: { id: number } | undefined;
};

type RouteParams = {
    id: number;
};

export default function DetalleCoordinador() {
    const route = useRoute();
    const navigation = useNavigation<any>();
    const { id } = route.params as RouteParams;
    const { token } = useAuth();

    // hook singular
    const {
        coordinador,
        loading,
        refreshing,
        error,
        busy,
        fetchCoordinador,
        onRefresh,
        removeCoordinador,
        changeStatus,
    } = useCoordinador(id, { autoFetch: true });
    const { showError } = useError();
    
    // Usar useFocusEffect para recargar cuando se vuelve a esta pantalla
    // Esto asegura que si se cambió el estado desde otra pantalla, se actualice
    useFocusEffect(
        useCallback(() => {
            if (id && token) {
                fetchCoordinador();
            }
        }, [id, token, fetchCoordinador])
    );

    const displayName = coordinador?.user?.name ?? coordinador?.name ?? 'Coordinador';
    const displayEmail = coordinador?.user?.email ?? coordinador?.email ?? '-';

    const handleEdit = useCallback(() => {
        navigation.navigate('EditarCoordinador', { id });
    }, [navigation, id]);

    const confirmDelete = useCallback(() => {
        Alert.alert(
            'Eliminar coordinador',
            `¿Estás seguro que deseas eliminar a ${displayName}? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const ok = await removeCoordinador();
                            if (ok) {
                                Alert.alert('Éxito', 'Coordinador eliminado', [{ text: 'OK', onPress: () => navigation.goBack() }]);
                            }
                        } catch (err) {
                            // El error se maneja automáticamente por el sistema global
                            // Error log removed
                        }
                    },
                },
            ]
        );
    }, [displayName, removeCoordinador, navigation]);

    const toggleStatus = useCallback(() => {
        if (!coordinador) return;
        const next = coordinador.status === 'active' ? 'inactive' : 'active';
        Alert.alert(
            `${next === 'active' ? 'Activar' : 'Desactivar'} coordinador`,
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
    }, [coordinador, changeStatus]);

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
                <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                    <Text style={styles.loadingText}>Cargando coordinador...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!coordinador && !loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color="#EF4444" />
                    <Text style={styles.errorTitle}>Coordinador no encontrado</Text>
                    <Text style={styles.errorText}>{error ?? 'No se pudo cargar la información.'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchCoordinador()}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // UI
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

            <LinearGradient
                colors={['#F3F4F6', '#E5E7EB', '#D1D5DB']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerRow}>
                    <BackButton color="#6B7280" />
                    <View style={styles.headerCenter}>
                        <View style={styles.avatar}>
                            <Ionicons name="person-circle-outline" size={44} color="#8B5CF6" />
                        </View>

                        <Text style={[styles.title, { color: '#1F2937' }]}>{displayName}</Text>
                        <Text style={[styles.subtitle, { color: '#6B7280' }]}>{displayEmail}</Text>

                        <View style={[styles.statusBadge, { backgroundColor: coordinador?.status === 'active' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)' }]}>
                            <Text style={[styles.statusText, { color: coordinador?.status === 'active' ? '#10B981' : '#EF4444' }]}>
                                {coordinador?.status === 'active' ? 'Activo' : 'Inactivo'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => {
                            // quick share
                            Alert.alert('Compartir', `Coordinador: ${displayName}\nEmail: ${displayEmail}`);
                        }} accessibilityLabel="Compartir coordinador">
                            <MaterialIcons name="share" size={22} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información personal</Text>
                    <View style={styles.card}>
                        <Row label="Identificación" value={coordinador?.identification ?? '-'} icon="badge" color="#7C3AED" />
                        <Row label="Nombre" value={coordinador?.user?.name ?? '-'} icon="person" color="#A855F7" />
                        <Row label="Email" value={coordinador?.user?.email ?? '-'} icon="email" color="#C084FC" />
                        <Row label="Teléfono" value={coordinador?.phone ?? '-'} icon="phone" color="#06B6D4" />
                        <Row label="Dirección" value={coordinador?.address ?? '-'} icon="place" color="#F59E0B" />
                    </View>
                </View>

                {coordinador?.user && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Información de usuario</Text>
                        <View style={styles.card}>
                            <Row label="Usuario" value={coordinador.user.name} icon="person" color="#FB7185" />
                            <Row label="Email de usuario" value={coordinador.user.email} icon="email" color="#8B5CF6" />
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del sistema</Text>
                    <View style={styles.card}>
                        <Row label="Estado" value={coordinador?.status === 'active' ? 'Activo' : 'Inactivo'} icon="check-circle" color={coordinador?.status === 'active' ? '#10B981' : '#EF4444'} />
                        <Row label="Creado" value={formatDate(coordinador?.created_at)} icon="event" color="#34D399" />
                        <Row label="Actualizado" value={formatDate((coordinador as any)?.updated_at)} icon="update" color="#60A5FA" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acciones</Text>
                    <View style={styles.actionRow}>
                        <ActionButton
                            label="Editar"
                            icon="edit"
                            color="#F59E0B"
                            onPress={handleEdit}
                            disabled={!coordinador}
                        />
                        <ActionButton
                            label={coordinador?.status === 'active' ? 'Desactivar' : 'Activar'}
                            icon={coordinador?.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                            color={coordinador?.status === 'active' ? '#F97316' : '#10B981'}
                            onPress={toggleStatus}
                            disabled={busy || !coordinador}
                        />
                        <ActionButton
                            label="Eliminar"
                            icon="delete"
                            color="#EF4444"
                            onPress={confirmDelete}
                            disabled={busy}
                        />
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
    container: {
        flex: 1,
        backgroundColor: '#F8FAFB'
    },
    header: {
        paddingTop: 12,
        paddingBottom: 24,
        paddingHorizontal: 16
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center'
    },
    headerActions: {
        width: 44,
        alignItems: 'flex-end'
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 3,
        borderColor: '#E9D5FF'
    },
    title: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4
    },
    subtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    statusText: {
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },

    scrollContainer: {
        flex: 1
    },

    section: {
        paddingHorizontal: 16,
        marginTop: 20
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
        letterSpacing: -0.3
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14
    },
    rowIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14
    },
    rowContent: {
        flex: 1
    },
    rowLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 2
    },
    rowValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        lineHeight: 20
    },

    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        flexWrap: 'wrap',
        gap: 12
    },
    actionBtn: {
        flex: 1,
        minWidth: (width - 56) / 3,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        color: '#0F172A',
        letterSpacing: -0.2
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: '#64748B',
        fontSize: 16,
        fontWeight: '500'
    },

    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
    },
    errorTitle: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'center'
    },
    errorText: {
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#7C3AED',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16
    },
});