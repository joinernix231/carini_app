import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '../../../components/BackButton';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import { useTheme } from '../../../context/ThemeContext';
import AdminTecnicoMantenimientosService, { TecnicoMaintenance } from '../../../services/AdminTecnicoMantenimientosService';
import { useTecnico } from '../../../hooks/tecnico/useTecnico';

const { width } = Dimensions.get('window');

type RouteParams = {
    technicianId: number;
};

type RootStackParamList = {
    MantenimientosTecnicoList: { technicianId: number };
    DetalleMantenimientoTecnico: { technicianId: number; maintenanceId: number };
};

export default function MantenimientosTecnicoListScreen() {
    const route = useRoute();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { technicianId } = route.params as RouteParams;
    const { token } = useAuth();
    const { showError } = useError();
    const { isDark, colors } = useTheme();

    const { tecnico } = useTecnico(technicianId, { autoFetch: true });
    const [maintenances, setMaintenances] = useState<TecnicoMaintenance[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMaintenances = useCallback(async () => {
        try {
            setError(null);
            const response = await AdminTecnicoMantenimientosService.getTecnicoMaintenances(
                token!,
                technicianId
            );
            if (response.success) {
                setMaintenances(response.data);
            } else {
                setError(response.message || 'Error al cargar mantenimientos');
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || 'Error al cargar mantenimientos';
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, technicianId, showError]);

    useFocusEffect(
        useCallback(() => {
            fetchMaintenances();
        }, [fetchMaintenances])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMaintenances();
    }, [fetchMaintenances]);

    const handleMaintenancePress = useCallback((maintenanceId: number) => {
        navigation.navigate('DetalleMantenimientoTecnico', {
            technicianId,
            maintenanceId,
        });
    }, [navigation, technicianId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return '#10B981';
            case 'in_progress':
                return '#3B82F6';
            case 'assigned':
                return '#F59E0B';
            case 'pending':
                return '#6B7280';
            default:
                return '#9CA3AF';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Completado';
            case 'in_progress':
                return 'En Progreso';
            case 'assigned':
                return 'Asignado';
            case 'pending':
                return 'Pendiente';
            default:
                return status;
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Sin fecha';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'No iniciado';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    const renderMaintenanceCard = ({ item }: { item: TecnicoMaintenance }) => {
        const statusColor = getStatusColor(item.status);
        const clientName = item.client?.name || 'Cliente desconocido';
        const deviceCount = item.device?.length || 0;
        const deviceTypes = item.device?.map(d => d.type).join(', ') || 'Sin equipos';

        return (
            <TouchableOpacity
                style={[styles.card, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}
                onPress={() => handleMaintenancePress(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {getStatusText(item.status)}
                            </Text>
                        </View>
                        <Text style={[styles.cardId, isDark && { color: '#9CA3AF' }]}>
                            ID: {item.id}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="business" size={16} color="#6B7280" />
                        <Text style={[styles.infoText, isDark && { color: '#D1D5DB' }]} numberOfLines={1}>
                            {clientName}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={16} color="#6B7280" />
                        <Text style={[styles.infoText, isDark && { color: '#D1D5DB' }]}>
                            {formatDate(item.date_maintenance)}
                        </Text>
                        {item.shift && (
                            <Text style={[styles.shiftText, isDark && { color: '#9CA3AF' }]}>
                                • {item.shift}
                            </Text>
                        )}
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="construct" size={16} color="#6B7280" />
                        <Text style={[styles.infoText, isDark && { color: '#D1D5DB' }]}>
                            {deviceCount} {deviceCount === 1 ? 'equipo' : 'equipos'}
                        </Text>
                        <Text style={[styles.deviceTypes, isDark && { color: '#9CA3AF' }]}>
                            ({deviceTypes})
                        </Text>
                    </View>

                    {item.type && (
                        <View style={styles.infoRow}>
                            <MaterialIcons name="settings" size={16} color="#6B7280" />
                            <Text style={[styles.infoText, isDark && { color: '#D1D5DB' }]}>
                                Tipo: {item.type === 'preventive' ? 'Preventivo' : item.type === 'corrective' ? 'Correctivo' : item.type}
                            </Text>
                        </View>
                    )}

                    {item.started_at && (
                        <View style={styles.infoRow}>
                            <Ionicons name="play-circle" size={16} color="#10B981" />
                            <Text style={[styles.infoText, isDark && { color: '#D1D5DB' }]}>
                                Iniciado: {formatDateTime(item.started_at)}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <LinearGradient
                colors={isDark ? ['#1F2937', '#111827'] : ['#F3F4F6', '#E5E7EB']}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerTop}>
                    <BackButton color={isDark ? '#fff' : '#000'} />
                </View>
                <View style={styles.titleSection}>
                    <Text style={[styles.title, isDark && { color: '#fff' }]}>
                        Mantenimientos
                    </Text>
                    <Text style={[styles.subtitle, isDark && { color: '#D1D5DB' }]}>
                        {tecnico?.user?.name || tecnico?.name || 'Técnico'}
                    </Text>
                </View>

                {maintenances.length > 0 && (
                    <View style={styles.statsContainer}>
                        <View style={[styles.statsCard, isDark && { backgroundColor: '#374151' }]}>
                            <Ionicons name="construct" size={24} color="#3B82F6" />
                            <View style={styles.statsContent}>
                                <Text style={[styles.statNumber, isDark && { color: '#fff' }]}>
                                    {maintenances.length}
                                </Text>
                                <Text style={[styles.statLabel, isDark && { color: '#9CA3AF' }]}>
                                    Total mantenimientos
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </LinearGradient>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color="#9CA3AF" />
            <Text style={[styles.emptyTitle, isDark && { color: '#D1D5DB' }]}>
                No hay mantenimientos
            </Text>
            <Text style={[styles.emptyText, isDark && { color: '#9CA3AF' }]}>
                Este técnico no tiene mantenimientos registrados
            </Text>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={[styles.loadingText, isDark && { color: '#D1D5DB' }]}>
                        Cargando mantenimientos...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <FlatList
                data={maintenances}
                keyExtractor={(item) => `maintenance_${item.id}`}
                renderItem={renderMaintenanceCard}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={[
                    styles.listContent,
                    maintenances.length === 0 && styles.emptyListContent,
                ]}
                onRefresh={onRefresh}
                refreshing={refreshing}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        marginBottom: 16,
    },
    headerGradient: {
        paddingTop: 12,
        paddingBottom: 24,
        paddingHorizontal: 16,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleSection: {
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 4,
    },
    statsContainer: {
        marginTop: 8,
    },
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    statsContent: {
        marginLeft: 12,
        flex: 1,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
    },
    statLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    emptyListContent: {
        flexGrow: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginRight: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardId: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    cardBody: {
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    shiftText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    deviceTypes: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
});



