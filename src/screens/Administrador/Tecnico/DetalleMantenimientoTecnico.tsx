import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Image,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import BackButton from '../../../components/BackButton';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import { useTheme } from '../../../context/ThemeContext';
import AdminTecnicoMantenimientosService, { MaintenanceLog, TecnicoMaintenance, ControlInfo } from '../../../services/AdminTecnicoMantenimientosService';
import { useTecnico } from '../../../hooks/tecnico/useTecnico';

type RouteParams = {
    technicianId: number;
    maintenanceId: number;
};

export default function DetalleMantenimientoTecnicoScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { technicianId, maintenanceId } = route.params as RouteParams;
    const { token } = useAuth();
    const { showError } = useError();
    const { isDark, colors } = useTheme();

    const { tecnico } = useTecnico(technicianId, { autoFetch: true });
    const [maintenance, setMaintenance] = useState<TecnicoMaintenance | null>(null);
    const [controlInfo, setControlInfo] = useState<ControlInfo | null>(null);
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMaintenanceDetail = useCallback(async () => {
        try {
            setLoading(true);
            const response = await AdminTecnicoMantenimientosService.getMaintenanceDetail(
                token!,
                technicianId,
                maintenanceId
            );
            if (response.success) {
                setMaintenance(response.data.maintenance);
                setControlInfo(response.data.control_info);
                setLogs(response.data.logs || []);
            } else {
                showError(response.message || 'Error al cargar mantenimiento');
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || 'Error al cargar mantenimiento';
            showError(errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, technicianId, maintenanceId, showError]);

    useEffect(() => {
        fetchMaintenanceDetail();
    }, [fetchMaintenanceDetail]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMaintenanceDetail();
    }, [fetchMaintenanceDetail]);

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
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'No disponible';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    const formatTime = (milliseconds: number) => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    };

    const renderInfoRow = (icon: string, label: string, value: string, color: string = '#6B7280') => (
        <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon as any} size={18} color={color} />
            </View>
            <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, isDark && { color: '#9CA3AF' }]}>{label}</Text>
                <Text style={[styles.infoValue, isDark && { color: '#F3F4F6' }]}>{value}</Text>
            </View>
        </View>
    );

    const getActionText = (action: string) => {
        switch (action) {
            case 'start':
                return 'Inicio';
            case 'pause':
                return 'Pausa';
            case 'resume':
                return 'Reanudación';
            case 'end':
                return 'Finalización';
            default:
                return action;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'start':
                return '#10B981';
            case 'pause':
                return '#F59E0B';
            case 'resume':
                return '#3B82F6';
            case 'end':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'start':
                return 'play-circle';
            case 'pause':
                return 'pause-circle';
            case 'resume':
                return 'play-forward-circle';
            case 'end':
                return 'stop-circle';
            default:
                return 'ellipse';
        }
    };

    const renderLogItem = (log: MaintenanceLog, index: number) => {
        const isLast = index === logs.length - 1;
        const actionColor = getActionColor(log.action);
        const actionText = getActionText(log.action);
        const actionIcon = getActionIcon(log.action);

        return (
            <View key={log.id} style={styles.logItem}>
                <View style={styles.logTimeline}>
                    <View style={[styles.logDot, { backgroundColor: actionColor }]} />
                    {!isLast && <View style={[styles.logLine, isDark && { backgroundColor: '#374151' }]} />}
                </View>
                <View style={styles.logContent}>
                    <View style={styles.logHeader}>
                        <View style={styles.logActionHeader}>
                            <Ionicons name={actionIcon as any} size={18} color={actionColor} />
                            <Text style={[styles.logAction, isDark && { color: '#F3F4F6' }]}>
                                {actionText}
                            </Text>
                        </View>
                        <Text style={[styles.logDate, isDark && { color: '#9CA3AF' }]}>
                            {formatDateTime(log.timestamp)}
                        </Text>
                    </View>
                    {log.reason && (
                        <View style={[styles.logReason, { backgroundColor: `${actionColor}15` }]}>
                            <Text style={[styles.logReasonText, { color: actionColor }]}>
                                {log.reason}
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.logLocation}
                        onPress={() => {
                            const { openOpenStreetMap } = require('../../../utils/mapUtils');
                            openOpenStreetMap(log.latitude, log.longitude);
                        }}
                    >
                        <Ionicons name="location" size={14} color="#0EA5E9" />
                        <Text style={[styles.logLocationText, { color: '#0EA5E9', textDecorationLine: 'underline' }]}>
                            Ver ubicación en mapa
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={[styles.loadingText, isDark && { color: '#D1D5DB' }]}>
                        Cargando mantenimiento...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!maintenance) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                    <Text style={[styles.errorTitle, isDark && { color: '#F3F4F6' }]}>
                        Mantenimiento no encontrado
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.retryButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const statusColor = getStatusColor(maintenance.status);
    const clientName = maintenance.client?.name || 'Cliente desconocido';
    const technicianName = maintenance.technician?.user?.name || tecnico?.user?.name || 'Técnico';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <LinearGradient
                    colors={isDark ? ['#1F2937', '#111827'] : ['#F3F4F6', '#E5E7EB']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerTop}>
                        <BackButton color={isDark ? '#fff' : '#000'} />
                    </View>
                    <View style={styles.headerContent}>
                        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {getStatusText(maintenance.status)}
                            </Text>
                        </View>
                        <Text style={[styles.headerTitle, isDark && { color: '#fff' }]}>
                            Mantenimiento #{maintenance.id}
                        </Text>
                        <Text style={[styles.headerSubtitle, isDark && { color: '#D1D5DB' }]}>
                            {clientName}
                        </Text>
                    </View>
                </LinearGradient>

                {/* Información General */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDark && { color: '#F3F4F6' }]}>
                        Información General
                    </Text>
                    <View style={[styles.card, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}>
                        {renderInfoRow('business', 'Cliente', clientName, '#3B82F6')}
                        {renderInfoRow('person', 'Técnico', technicianName, '#10B981')}
                        {renderInfoRow('calendar', 'Fecha Programada', formatDate(maintenance.date_maintenance), '#F59E0B')}
                        {maintenance.shift && renderInfoRow('time', 'Turno', maintenance.shift, '#8B5CF6')}
                        {renderInfoRow('settings', 'Tipo', maintenance.type === 'preventive' ? 'Preventivo' : maintenance.type === 'corrective' ? 'Correctivo' : maintenance.type, '#EF4444')}
                    </View>
                </View>

                {/* Equipos */}
                {maintenance.device && maintenance.device.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDark && { color: '#F3F4F6' }]}>
                            Equipos ({maintenance.device.length})
                        </Text>
                        <View style={[styles.card, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}>
                            {maintenance.device.map((device, index) => (
                                <View key={device.id} style={[styles.deviceItem, index < maintenance.device.length - 1 && styles.deviceItemBorder]}>
                                    <View style={styles.deviceHeader}>
                                        <Ionicons name="construct" size={20} color="#3B82F6" />
                                        <Text style={[styles.deviceTitle, isDark && { color: '#F3F4F6' }]}>
                                            {device.brand} {device.model}
                                        </Text>
                                    </View>
                                    <View style={styles.deviceDetails}>
                                        <Text style={[styles.deviceDetail, isDark && { color: '#D1D5DB' }]}>
                                            Tipo: {device.type}
                                        </Text>
                                        <Text style={[styles.deviceDetail, isDark && { color: '#D1D5DB' }]}>
                                            Serial: {device.serial}
                                        </Text>
                                        <Text style={[styles.deviceDetail, isDark && { color: '#D1D5DB' }]}>
                                            Dirección: {device.address}
                                        </Text>
                                        {device.pivot_description && (
                                            <Text style={[styles.deviceDescription, isDark && { color: '#9CA3AF' }]}>
                                                {device.pivot_description}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Control y Tiempo */}
                {controlInfo && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDark && { color: '#F3F4F6' }]}>
                            Control y Tiempo
                        </Text>
                        <View style={[styles.card, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}>
                            {controlInfo.maintenance_time && (
                                renderInfoRow('time', 'Tiempo Total', controlInfo.maintenance_time.formatted, '#3B82F6')
                            )}
                            {controlInfo.progress_percentage !== undefined && (
                                renderInfoRow('checkmark-circle', 'Progreso General', `${controlInfo.progress_percentage}%`, '#10B981')
                            )}
                            {controlInfo.total_devices !== undefined && (
                                renderInfoRow('construct', 'Total Equipos', `${controlInfo.total_devices}`, '#8B5CF6')
                            )}
                            {controlInfo.all_completed !== undefined && (
                                renderInfoRow(
                                    'checkmark-done-circle',
                                    'Estado',
                                    controlInfo.all_completed ? 'Todos Completados' : 'En Progreso',
                                    controlInfo.all_completed ? '#10B981' : '#F59E0B'
                                )
                            )}
                            {controlInfo.last_location && (
                                <View style={styles.infoRow}>
                                    <View style={[styles.infoIcon, { backgroundColor: '#3B82F615' }]}>
                                        <Ionicons name="location" size={18} color="#3B82F6" />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={[styles.infoLabel, isDark && { color: '#9CA3AF' }]}>Última Ubicación</Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                const { openOpenStreetMap } = require('../../../utils/mapUtils');
                                                openOpenStreetMap(
                                                    controlInfo.last_location.latitude,
                                                    controlInfo.last_location.longitude
                                                );
                                            }}
                                        >
                                            <Text style={[styles.infoValue, { color: '#0EA5E9', textDecorationLine: 'underline' }]}>
                                                Ver en mapa
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={[styles.infoSubValue, isDark && { color: '#9CA3AF' }]}>
                                            {formatDateTime(controlInfo.last_location.timestamp)}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Progreso por Equipos */}
                {controlInfo && controlInfo.devices_progress && controlInfo.devices_progress.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDark && { color: '#F3F4F6' }]}>
                            Progreso por Equipos
                        </Text>
                        <View style={[styles.card, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}>
                            {controlInfo.devices_progress.map((deviceProgress, index) => (
                                <View key={deviceProgress.client_device_id} style={[styles.deviceProgressItem, index < controlInfo.devices_progress.length - 1 && styles.deviceProgressBorder]}>
                                    <View style={styles.deviceProgressHeader}>
                                        <View style={styles.deviceProgressHeaderLeft}>
                                            <Ionicons name="construct" size={20} color="#3B82F6" />
                                            <View style={styles.deviceProgressInfo}>
                                                <Text style={[styles.deviceProgressTitle, isDark && { color: '#F3F4F6' }]}>
                                                    {deviceProgress.device.brand} {deviceProgress.device.model}
                                                </Text>
                                                <Text style={[styles.deviceProgressSerial, isDark && { color: '#9CA3AF' }]}>
                                                    {deviceProgress.device.serial}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={[styles.progressBadge, { backgroundColor: deviceProgress.progress_status === 'completed' ? '#10B98120' : '#F59E0B20' }]}>
                                            <Text style={[styles.progressBadgeText, { color: deviceProgress.progress_status === 'completed' ? '#10B981' : '#F59E0B' }]}>
                                                {deviceProgress.progress_pct}%
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.progressBarContainer}>
                                        <View style={styles.progressBarBackground}>
                                            <View
                                                style={[
                                                    styles.progressBarFill,
                                                    {
                                                        width: `${deviceProgress.progress_pct}%`,
                                                        backgroundColor: deviceProgress.progress_status === 'completed' ? '#10B981' : '#F59E0B',
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.progressDetails}>
                                        <Text style={[styles.progressDetail, isDark && { color: '#9CA3AF' }]}>
                                            {deviceProgress.progress_completed_count}/{deviceProgress.progress_total} tareas completadas
                                        </Text>
                                        <Text style={[styles.progressDetail, isDark && { color: '#9CA3AF' }]}>
                                            Estado: {deviceProgress.progress_status === 'completed' ? 'Completado' : deviceProgress.progress_status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Descripción */}
                {maintenance.description && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDark && { color: '#F3F4F6' }]}>
                            Descripción
                        </Text>
                        <View style={[styles.card, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}>
                            <Text style={[styles.descriptionText, isDark && { color: '#D1D5DB' }]}>
                                {maintenance.description}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Foto */}
                {maintenance.photo && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDark && { color: '#F3F4F6' }]}>
                            Foto
                        </Text>
                        <View style={[styles.card, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}>
                            <Image
                                source={{ uri: maintenance.photo }}
                                style={styles.photo}
                                resizeMode="cover"
                            />
                        </View>
                    </View>
                )}

                {/* Pagos */}
                {(maintenance.is_paid !== null || maintenance.payment_support || maintenance.price_support) && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDark && { color: '#F3F4F6' }]}>
                            Información de Pago
                        </Text>
                        <View style={[styles.card, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}>
                            {maintenance.is_paid !== null && (
                                renderInfoRow(
                                    'cash',
                                    'Estado de Pago',
                                    maintenance.is_paid ? 'Pagado' : 'No Pagado',
                                    maintenance.is_paid ? '#10B981' : '#EF4444'
                                )
                            )}
                            {maintenance.price_support && (
                                <TouchableOpacity
                                    style={styles.linkRow}
                                    onPress={() => {
                                        // Aquí podrías abrir el PDF o mostrar más detalles
                                    }}
                                >
                                    <Ionicons name="document-text" size={18} color="#3B82F6" />
                                    <Text style={[styles.linkText, isDark && { color: '#3B82F6' }]}>
                                        Ver soporte de precio
                                    </Text>
                                    <Ionicons name="open-outline" size={16} color="#3B82F6" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Logs */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDark && { color: '#F3F4F6' }]}>
                        Historial de Actividad {logs.length > 0 && `(${logs.length})`}
                    </Text>
                    <View style={[styles.card, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}>
                        {logs.length > 0 ? (
                            logs.map((log, index) => renderLogItem(log, index))
                        ) : (
                            <View style={styles.noLogs}>
                                <Ionicons name="document-text-outline" size={32} color="#9CA3AF" />
                                <Text style={[styles.noLogsText, isDark && { color: '#9CA3AF' }]}>
                                    No hay logs disponibles
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    header: {
        paddingTop: 12,
        paddingBottom: 24,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerContent: {
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        marginBottom: 12,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    infoIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    infoSubValue: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    deviceItem: {
        paddingBottom: 16,
    },
    deviceItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 16,
        paddingBottom: 16,
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    deviceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: 8,
    },
    deviceDetails: {
        marginLeft: 28,
    },
    deviceDetail: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
    },
    deviceDescription: {
        fontSize: 13,
        color: '#6B7280',
        fontStyle: 'italic',
        marginTop: 8,
    },
    descriptionText: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
    },
    photo: {
        width: '100%',
        height: 200,
        borderRadius: 12,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginTop: 8,
    },
    linkText: {
        flex: 1,
        fontSize: 14,
        color: '#3B82F6',
        marginLeft: 8,
        fontWeight: '500',
    },
    logsLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    logsLoadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#6B7280',
    },
    noLogs: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    noLogsText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    logItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    logTimeline: {
        width: 24,
        alignItems: 'center',
        marginRight: 12,
    },
    logDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fff',
    },
    logLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginTop: 4,
        minHeight: 20,
    },
    logContent: {
        flex: 1,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    logActionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    logAction: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    logDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    logReason: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 8,
        marginBottom: 8,
    },
    logReasonText: {
        fontSize: 13,
        fontWeight: '500',
    },
    logLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    logLocationText: {
        fontSize: 12,
        color: '#6B7280',
    },
    deviceProgressItem: {
        paddingBottom: 16,
    },
    deviceProgressBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 16,
        paddingBottom: 16,
    },
    deviceProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    deviceProgressHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    deviceProgressInfo: {
        marginLeft: 12,
        flex: 1,
    },
    deviceProgressTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    deviceProgressSerial: {
        fontSize: 12,
        color: '#6B7280',
    },
    progressBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    progressBadgeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    progressBarContainer: {
        marginBottom: 8,
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressDetails: {
        marginTop: 4,
    },
    progressDetail: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorTitle: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

