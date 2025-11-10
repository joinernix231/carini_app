import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '../../../components/BackButton';
import MaintenanceHistoryList from '../../../components/MaintenanceHistoryList';
import { ClientDeviceService } from '../../../services/ClientDeviceService';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import { ClientDevice } from '../../../types/cliente/ClientDevice';

const { width } = Dimensions.get('window');

type RouteParams = {
    clientDeviceId: number;
    clientDevice: ClientDevice;
    clientName: string;
};

export default function DetalleEquipoCliente() {
    const route = useRoute();
    const navigation = useNavigation();
    const { token } = useAuth();
    const { showError } = useError();
    const { clientDeviceId, clientDevice, clientName } = route.params as RouteParams;

    const [maintenances, setMaintenances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadMaintenances = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(true);
            const data = await ClientDeviceService.getClientDeviceMaintenances(
                clientDeviceId,
                token!,
                { unpaginated: true }
            );
            console.log('📦 Mantenimientos recibidos:', data);
            setMaintenances(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('❌ Error cargando mantenimientos:', err);
            showError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [clientDeviceId, token, showError]);

    useEffect(() => {
        loadMaintenances();
    }, [loadMaintenances]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadMaintenances();
    }, [loadMaintenances]);

    const handleViewMaintenance = (maintenanceId: number) => {
        navigation.navigate('DetalleMantenimientoEquipo' as never, { 
            maintenanceId 
        } as never);
    };

    const handleViewHistory = () => {
        navigation.navigate('EquipmentMaintenanceHistory' as never, {
            deviceId: clientDevice?.device?.id,
            clientDeviceId: clientDeviceId,
            deviceName: `${clientDevice?.device?.brand} ${clientDevice?.device?.model}`,
            deviceBrand: clientDevice?.device?.brand,
            deviceModel: clientDevice?.device?.model,
            isAdmin: true,
        } as never);
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0EA5E9" />
                    <Text style={styles.loadingText}>Cargando mantenimientos...</Text>
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
                                <Ionicons name="hardware-chip-outline" size={44} color="#0EA5E9" />
                            </View>
                            <Text style={styles.title}>
                                {clientDevice?.device?.brand} {clientDevice?.device?.model}
                            </Text>
                            <Text style={styles.subtitle}>Serial: {clientDevice?.serial}</Text>
                            <Text style={styles.clientName}>{clientName}</Text>
                        </View>
                        <View style={styles.headerActions} />
                    </View>
                </LinearGradient>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Estadística rápida */}
                <View style={styles.statsCard}>
                    <View style={styles.statsRow}>
                        <MaterialIcons name="build-circle" size={24} color="#0EA5E9" />
                        <Text style={styles.statsLabel}>Total de Mantenimientos</Text>
                        <Text style={styles.statsValue}>{maintenances.length}</Text>
                    </View>
                </View>

                {/* Lista de mantenimientos */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Historial de Mantenimientos</Text>
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={handleViewHistory}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.viewAllText}>Ver todo</Text>
                            <Ionicons name="arrow-forward" size={16} color="#0EA5E9" />
                        </TouchableOpacity>
                    </View>
                    <MaintenanceHistoryList
                        maintenances={maintenances.slice(0, 5)}
                        onMaintenancePress={handleViewMaintenance}
                    />
                    {maintenances.length > 5 && (
                        <TouchableOpacity
                            style={styles.viewMoreButton}
                            onPress={handleViewHistory}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.viewMoreText}>
                                Ver {maintenances.length - 5} mantenimiento{maintenances.length - 5 > 1 ? 's' : ''} más
                            </Text>
                            <Ionicons name="arrow-forward" size={18} color="#0EA5E9" />
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

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
    headerActions: { width: 44 },
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
        textAlign: 'center',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        marginBottom: 4,
    },
    clientName: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        marginTop: 4,
    },
    scrollContainer: { flex: 1 },
    statsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statsLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    statsValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0EA5E9',
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0EA5E9',
    },
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        paddingVertical: 12,
        gap: 8,
    },
    viewMoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0EA5E9',
    },
    maintenanceCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    maintenanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    maintenanceIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    maintenanceId: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    maintenanceBody: {
        gap: 8,
        marginBottom: 12,
    },
    maintenanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    maintenanceType: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    maintenanceDate: {
        fontSize: 14,
        color: '#6B7280',
    },
    maintenanceShift: {
        fontSize: 12,
        color: '#9CA3AF',
        marginLeft: 4,
    },
    maintenanceValue: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '600',
    },
    maintenanceTechnician: {
        fontSize: 14,
        color: '#6B7280',
    },
    maintenanceDevices: {
        fontSize: 14,
        color: '#6B7280',
    },
    maintenanceFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 8,
    },
    viewDetailText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
});

