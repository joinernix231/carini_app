import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';
import PaginationControls from '../../../components/PaginationControls';
import { AdminMantenimientosService, AdminMaintenance } from '../../../services/AdminMantenimientosService';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

type RootStackParamList = {
    MantenimientosList: undefined;
    DetalleMantenimientoEquipo: { maintenanceId: number };
    CrearMantenimiento: undefined;
};

export default function MantenimientosList() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { token } = useAuth();
    const { showError } = useError();
    const { isDark, colors } = useTheme();

    const [mantenimientos, setMantenimientos] = useState<AdminMaintenance[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [paginationLoading, setPaginationLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<{
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    } | null>(null);

    const fetchMantenimientos = useCallback(async (pageNum: number = 1, search?: string) => {
        if (!token) return;

        try {
            if (pageNum === 1) {
                setLoading(true);
            } else {
                setPaginationLoading(true);
            }
            setError(null);

            let response;
            if (search && search.trim()) {
                setIsSearching(true);
                response = await AdminMantenimientosService.searchMantenimientos(
                    token,
                    search,
                    pageNum
                );
            } else {
                setIsSearching(false);
                response = await AdminMantenimientosService.getMantenimientos(token, {
                    page: pageNum,
                    per_page: 20,
                });
            }

            setMantenimientos(response.data);
            setPagination({
                current_page: response.current_page,
                last_page: response.last_page,
                per_page: response.per_page,
                total: response.total,
            });
            setPage(pageNum);
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || 'Error al cargar mantenimientos';
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            setLoading(false);
            setPaginationLoading(false);
            setRefreshing(false);
        }
    }, [token, showError]);

    useFocusEffect(
        useCallback(() => {
            fetchMantenimientos(1);
        }, [fetchMantenimientos])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMantenimientos(page, searchText);
    }, [fetchMantenimientos, page, searchText]);

    const changePage = useCallback((newPage: number) => {
        fetchMantenimientos(newPage, searchText);
    }, [fetchMantenimientos, searchText]);

    const handleSearch = useCallback((text: string) => {
        setSearchText(text);
        if (text.trim()) {
            fetchMantenimientos(1, text);
        } else {
            fetchMantenimientos(1);
        }
    }, [fetchMantenimientos]);

    const clearSearch = useCallback(() => {
        setSearchText('');
        fetchMantenimientos(1);
    }, [fetchMantenimientos]);

    const goToDetail = useCallback((maintenanceId: number) => {
        navigation.navigate('DetalleMantenimientoEquipo', { maintenanceId });
    }, [navigation]);

    const goToCreate = useCallback(() => {
        navigation.navigate('CrearMantenimiento');
    }, [navigation]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return { color: '#10B981', bgColor: '#E8F8F5', text: 'Completado', icon: 'checkmark-circle' as const };
            case 'in_progress':
                return { color: '#3B82F6', bgColor: '#EFF6FF', text: 'En Progreso', icon: 'time' as const };
            case 'assigned':
                return { color: '#F59E0B', bgColor: '#FFFBEB', text: 'Asignado', icon: 'person' as const };
            case 'quoted':
                return { color: '#8B5CF6', bgColor: '#F5F3FF', text: 'Cotizado', icon: 'document-text' as const };
            case 'pending':
                return { color: '#6B7280', bgColor: '#F3F4F6', text: 'Pendiente', icon: 'hourglass' as const };
            case 'cancelled':
                return { color: '#EF4444', bgColor: '#FEF2F2', text: 'Cancelado', icon: 'close-circle' as const };
            case 'rejected':
                return { color: '#DC2626', bgColor: '#FEE2E2', text: 'Rechazado', icon: 'ban' as const };
            default:
                return { color: '#6B7280', bgColor: '#F3F4F6', text: status, icon: 'help-circle' as const };
        }
    };

    const getTypeConfig = (type: string) => {
        return type === 'preventive'
            ? { color: '#00C7BE', bgColor: '#E6FFFE', text: 'Preventivo', icon: 'shield-checkmark' as const }
            : { color: '#FF6B47', bgColor: '#FFF0ED', text: 'Correctivo', icon: 'warning' as const };
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Sin fecha';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const statsData = useMemo(() => {
        const total = pagination?.total ?? mantenimientos.length ?? 0;
        const completed = mantenimientos.filter(m => m.status === 'completed').length;
        const inProgress = mantenimientos.filter(m => m.status === 'in_progress').length;
        const pending = mantenimientos.filter(m => m.status === 'pending' || m.status === 'quoted').length;

        return { total, completed, inProgress, pending };
    }, [pagination, mantenimientos]);

    const renderHeader = useMemo(() => {
        return (
            <View style={[styles.header, isDark && { backgroundColor: '#1F2937' }]}>
                <View style={styles.headerTop}>
                    <BackButton color={isDark ? '#fff' : '#000'} />
                </View>

                <View style={styles.titleSection}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleContainer}>
                            <Text style={[styles.title, isDark && { color: '#fff' }]}>
                                Mantenimientos
                            </Text>
                            <Text style={[styles.subtitle, isDark && { color: '#D1D5DB' }]}>
                                {searchText ? `Resultados para "${searchText}"` : 'Gestión de mantenimientos'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={goToCreate}
                        >
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statsCard, styles.statsCardMain]}>
                        <Ionicons name="settings" size={24} color="#3B82F6" />
                        <View style={styles.statsContent}>
                            <Text style={styles.statNumber}>{statsData.total}</Text>
                            <Text style={styles.statLabel}>
                                {searchText ? 'Encontrados' : 'Total mantenimientos'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={[styles.statsCard, styles.statsCardSmall]}>
                            <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
                            <View style={styles.statsContent}>
                                <Text style={[styles.statNumber, styles.statNumberSmall]}>{statsData.completed}</Text>
                                <Text style={[styles.statLabel, styles.statLabelSmall]}>Completados</Text>
                            </View>
                        </View>

                        <View style={[styles.statsCard, styles.statsCardSmall]}>
                            <View style={[styles.statusIndicator, { backgroundColor: '#3B82F6' }]} />
                            <View style={styles.statsContent}>
                                <Text style={[styles.statNumber, styles.statNumberSmall]}>{statsData.inProgress}</Text>
                                <Text style={[styles.statLabel, styles.statLabelSmall]}>En Progreso</Text>
                            </View>
                        </View>

                        <View style={[styles.statsCard, styles.statsCardSmall]}>
                            <View style={[styles.statusIndicator, { backgroundColor: '#6B7280' }]} />
                            <View style={styles.statsContent}>
                                <Text style={[styles.statNumber, styles.statNumberSmall]}>{statsData.pending}</Text>
                                <Text style={[styles.statLabel, styles.statLabelSmall]}>Pendientes</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    }, [isDark, searchText, statsData]);

    const renderMantenimientoItem = useCallback(({ item }: { item: AdminMaintenance }) => {
        const statusConfig = getStatusConfig(item.status);
        const typeConfig = getTypeConfig(item.type);
        const devices = Array.isArray(item.device) ? item.device : [item.device].filter(Boolean);
        const deviceCount = devices.length;

        return (
            <TouchableOpacity
                style={[styles.card, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}
                onPress={() => goToDetail(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
                            <Ionicons name={typeConfig.icon} size={16} color={typeConfig.color} />
                            <Text style={[styles.typeText, { color: typeConfig.color }]}>
                                {typeConfig.text}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                {statusConfig.text}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.maintenanceId, isDark && { color: '#9CA3AF' }]}>
                        #{item.id}
                    </Text>
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.infoRow}>
                        <Ionicons name="business" size={16} color="#6B7280" />
                        <Text style={[styles.infoText, isDark && { color: '#D1D5DB' }]} numberOfLines={1}>
                            {item.client?.name || 'Cliente sin nombre'}
                        </Text>
                    </View>

                    {item.technician && (
                        <View style={styles.infoRow}>
                            <Ionicons name="person" size={16} color="#6B7280" />
                            <Text style={[styles.infoText, isDark && { color: '#D1D5DB' }]} numberOfLines={1}>
                                {item.technician.user.name}
                            </Text>
                        </View>
                    )}

                    <View style={styles.infoRow}>
                        <Ionicons name="construct" size={16} color="#6B7280" />
                        <Text style={[styles.infoText, isDark && { color: '#D1D5DB' }]}>
                            {deviceCount} {deviceCount === 1 ? 'equipo' : 'equipos'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={16} color="#6B7280" />
                        <Text style={[styles.infoText, isDark && { color: '#D1D5DB' }]}>
                            {formatDate(item.date_maintenance)} - {item.shift || 'N/A'}
                        </Text>
                    </View>

                    {item.value && (
                        <View style={styles.infoRow}>
                            <Ionicons name="cash" size={16} color="#6B7280" />
                            <Text style={[styles.infoText, isDark && { color: '#D1D5DB' }]}>
                                ${item.value.toLocaleString('es-CO')}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
            </TouchableOpacity>
        );
    }, [isDark, goToDetail]);

    const renderEmpty = useCallback(() => {
        if (loading) return null;

        const isSearchEmpty = searchText && mantenimientos.length === 0;

        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                    <Ionicons
                        name={isSearchEmpty ? "search" : "settings-outline"}
                        size={64}
                        color="#D1D5DB"
                    />
                </View>

                <Text style={[styles.emptyTitle, isDark && { color: '#fff' }]}>
                    {isSearchEmpty ? 'Sin resultados' : 'No hay mantenimientos'}
                </Text>

                <Text style={[styles.emptySubtitle, isDark && { color: '#9CA3AF' }]}>
                    {isSearchEmpty
                        ? `No encontramos mantenimientos que coincidan con "${searchText}"`
                        : 'Aún no hay mantenimientos registrados'}
                </Text>

                {searchText && (
                    <TouchableOpacity
                        style={styles.clearSearchButton}
                        onPress={clearSearch}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#3B82F6" style={{ marginRight: 8 }} />
                        <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }, [loading, searchText, mantenimientos.length, clearSearch, isDark]);

    const renderFooter = useCallback(() => {
        if (!pagination || mantenimientos.length === 0) return null;
        return (
            <View style={styles.paginationWrapper}>
                <PaginationControls
                    paginationData={pagination}
                    onPageChange={(p) => changePage(p)}
                    loading={paginationLoading}
                    theme={isDark ? 'dark' : 'light'}
                    variant="modern"
                    showInfo
                    showFirstLast
                    maxVisiblePages={5}
                />
            </View>
        );
    }, [pagination, changePage, paginationLoading, mantenimientos.length, isDark]);

    if (loading && !refreshing && mantenimientos.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                {renderHeader}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={[styles.loadingText, isDark && { color: '#D1D5DB' }]}>
                        {isSearching ? 'Buscando mantenimientos...' : 'Cargando mantenimientos...'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                {renderHeader}
                <View style={styles.errorContainer}>
                    <View style={styles.errorIcon}>
                        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                    </View>
                    <Text style={[styles.errorTitle, isDark && { color: '#fff' }]}>
                        Oops! Algo salió mal
                    </Text>
                    <Text style={[styles.errorMessage, isDark && { color: '#D1D5DB' }]}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={() => fetchMantenimientos(1)}
                        style={styles.retryButton}
                    >
                        <Ionicons name="refresh" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" />
            <FlatList
                data={mantenimientos}
                keyExtractor={(item) => `maintenance_${item.id}`}
                renderItem={renderMantenimientoItem}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                contentContainerStyle={[
                    styles.listContent,
                    mantenimientos.length === 0 && { flex: 1 }
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3B82F6']}
                        tintColor="#3B82F6"
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTop: {
        marginBottom: 10,
    },
    titleSection: {
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleContainer: {
        flex: 1,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    statsContainer: {
        gap: 12,
    },
    statsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statsCardMain: {
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statsCardSmall: {
        flex: 1,
        padding: 12,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statsContent: {
        flex: 1,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    statNumberSmall: {
        fontSize: 18,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    statLabelSmall: {
        fontSize: 11,
    },
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
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
        gap: 8,
        flex: 1,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    typeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    maintenanceId: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    cardContent: {
        gap: 8,
        marginBottom: 12,
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
    cardFooter: {
        alignItems: 'flex-end',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 40,
        marginBottom: 24,
    },
    clearSearchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    clearSearchText: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    errorIcon: {
        marginBottom: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    paginationWrapper: {
        marginTop: 20,
        marginBottom: 10,
    },
});

