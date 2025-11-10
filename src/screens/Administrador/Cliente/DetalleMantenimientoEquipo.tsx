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
    Linking,
    Modal,
    Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import BackButton from '../../../components/BackButton';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import { MantenimientoInformationService, MaintenanceInformation } from '../../../services/MantenimientoInformationService';
import { getImageUrl } from '../../../utils/imageUtils';

const { width } = Dimensions.get('window');

type RouteParams = {
    maintenanceId: number;
};

export default function DetalleMantenimientoEquipo() {
    const route = useRoute();
    const navigation = useNavigation();
    const { maintenanceId } = route.params as RouteParams;
    const { token } = useAuth();
    const { showError } = useError();

    const [maintenance, setMaintenance] = useState<MaintenanceInformation | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchMaintenanceDetail = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(true);
            const data = await MantenimientoInformationService.getMaintenanceInformation(
                maintenanceId,
                token
            );
            setMaintenance(data);
        } catch (err: any) {
            showError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, maintenanceId, showError]);

    useEffect(() => {
        fetchMaintenanceDetail();
    }, [fetchMaintenanceDetail]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMaintenanceDetail();
    }, [fetchMaintenanceDetail]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#10B981';
            case 'in_progress': return '#3B82F6';
            case 'assigned': return '#F59E0B';
            case 'pending': return '#6B7280';
            default: return '#9CA3AF';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed': return 'Completado';
            case 'in_progress': return 'En Progreso';
            case 'assigned': return 'Asignado';
            case 'pending': return 'Pendiente';
            default: return status;
        }
    };

    const getTypeText = (type: string) => {
        switch (type) {
            case 'preventive': return 'Preventivo';
            case 'corrective': return 'Correctivo';
            default: return type;
        }
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        try {
            const d = new Date(date);
            return d.toLocaleString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return date;
        }
    };

    const formatCurrency = (value: number | null) => {
        if (!value) return '-';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const getActionText = (action: string) => {
        switch (action) {
            case 'start': return 'Inicio';
            case 'pause': return 'Pausa';
            case 'resume': return 'Reanudación';
            case 'end': return 'Finalización';
            default: return action;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'start': return '#10B981';
            case 'pause': return '#F59E0B';
            case 'resume': return '#3B82F6';
            case 'end': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'start': return 'play-circle';
            case 'pause': return 'pause-circle';
            case 'resume': return 'play-forward-circle';
            case 'end': return 'stop-circle';
            default: return 'ellipse';
        }
    };

    const renderInfoRow = (icon: string, label: string, value: string | null, color: string = '#3B82F6') => {
        if (!value || value === '-') return null;
        return (
            <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: `${color}22` }]}>
                    <MaterialIcons name={icon as any} size={18} color={color} />
                </View>
                <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{value}</Text>
                </View>
            </View>
        );
    };

    const renderPhotoGallery = (photos: any[], title: string) => {
        if (!photos || photos.length === 0) return null;

        const photosByDevice = photos.reduce((acc, photo) => {
            const deviceId = photo.client_device_id;
            if (!acc[deviceId]) acc[deviceId] = [];
            acc[deviceId].push(photo);
            return acc;
        }, {} as any);

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{title} ({photos.length})</Text>
                <View style={styles.card}>
                    {Object.entries(photosByDevice).map(([deviceId, devicePhotos]: [string, any]) => {
                        const firstPhoto = devicePhotos[0];
                        const deviceInfo = firstPhoto.device || maintenance?.devices.find(d => d.id === parseInt(deviceId));
                        return (
                            <View key={deviceId} style={styles.devicePhotoSection}>
                                {deviceInfo && (
                                    <Text style={styles.devicePhotoTitle}>
                                        {deviceInfo.brand} {deviceInfo.model} - {deviceInfo.serial || 'Sin serial'}
                                    </Text>
                                )}
                                <View style={styles.photoGrid}>
                                    {devicePhotos.map((photo: any, index: number) => {
                                        // Usar photo_url si está disponible, sino construir desde photo
                                        const imageUrl = photo.photo_url || getImageUrl(photo.photo);
                                        if (!imageUrl) return null;
                                        return (
                                            <TouchableOpacity
                                                key={photo.id}
                                                style={styles.photoItem}
                                                onPress={() => setSelectedImage(imageUrl)}
                                            >
                                                <Image
                                                    source={{ uri: imageUrl }}
                                                    style={styles.photoThumbnail}
                                                    resizeMode="cover"
                                                    onError={(error) => {
                                                        console.error('Error cargando imagen:', imageUrl, error);
                                                    }}
                                                />
                                                <View style={styles.photoOverlay}>
                                                    <Ionicons name="expand" size={20} color="#fff" />
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0EA5E9" />
                    <Text style={styles.loadingText}>Cargando mantenimiento...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!maintenance) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color="#EF4444" />
                    <Text style={styles.errorTitle}>Mantenimiento no encontrado</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchMaintenanceDetail}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const statusColor = getStatusColor(maintenance.status);
    const initialPhotos = maintenance.photos?.filter(p => p.photo_type === 'initial') || [];
    const finalPhotos = maintenance.photos?.filter(p => p.photo_type === 'final') || [];
    
    // Debug: Ver qué vienen las fotos
    console.log('📸 Fotos iniciales:', initialPhotos.map(p => ({ id: p.id, photo: p.photo, photo_url: p.photo_url })));
    console.log('📸 Fotos finales:', finalPhotos.map(p => ({ id: p.id, photo: p.photo, photo_url: p.photo_url })));
    console.log('📸 Firma:', maintenance.signature_photo);

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
                            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                                <Text style={[styles.statusText, { color: statusColor }]}>
                                    {getStatusText(maintenance.status)}
                                </Text>
                            </View>
                            <Text style={styles.headerTitle}>Mantenimiento #{maintenance.id}</Text>
                            <Text style={styles.headerSubtitle}>{getTypeText(maintenance.type)}</Text>
                        </View>
                        <View style={styles.headerActions} />
                    </View>
                </LinearGradient>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Información General */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información General</Text>
                    <View style={styles.card}>
                        {renderInfoRow('business', 'Cliente', maintenance.client?.name, '#3B82F6')}
                        {renderInfoRow('person', 'Técnico', maintenance.technician?.user?.name, '#10B981')}
                        {renderInfoRow('calendar', 'Fecha Programada', formatDate(maintenance.date_maintenance), '#F59E0B')}
                        {renderInfoRow('schedule', 'Turno', maintenance.shift || null, '#8B5CF6')}
                        {renderInfoRow('settings', 'Tipo', getTypeText(maintenance.type), '#EF4444')}
                        {renderInfoRow('event', 'Fecha de Creación', formatDate(maintenance.created_at), '#06B6D4')}
                        {maintenance.started_at && renderInfoRow('play-arrow', 'Iniciado', formatDate(maintenance.started_at), '#10B981')}
                    </View>
                </View>

                {/* Información de Pago */}
                {(maintenance.is_paid !== null || maintenance.price_support || maintenance.payment_support) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Información de Pago</Text>
                        <View style={styles.card}>
                            {maintenance.is_paid !== null && (
                                <View style={styles.paymentRow}>
                                    <MaterialIcons name="payment" size={20} color={maintenance.is_paid ? '#10B981' : '#EF4444'} />
                                    <Text style={styles.paymentLabel}>Estado de Pago:</Text>
                                    <Text style={[styles.paymentValue, { color: maintenance.is_paid ? '#10B981' : '#EF4444' }]}>
                                        {maintenance.is_paid ? 'Pagado' : 'No Pagado'}
                                    </Text>
                                </View>
                            )}
                            {maintenance.value && (
                                <View style={styles.paymentRow}>
                                    <MaterialIcons name="attach-money" size={20} color="#10B981" />
                                    <Text style={styles.paymentLabel}>Valor:</Text>
                                    <Text style={styles.paymentValue}>{formatCurrency(maintenance.value)}</Text>
                                </View>
                            )}
                            {maintenance.price_support && (
                                <TouchableOpacity
                                    style={styles.documentLink}
                                    onPress={() => Linking.openURL(maintenance.price_support)}
                                >
                                    <MaterialIcons name="picture-as-pdf" size={20} color="#3B82F6" />
                                    <Text style={styles.documentLinkText}>Ver Cotización PDF</Text>
                                    <Ionicons name="open-outline" size={16} color="#3B82F6" />
                                </TouchableOpacity>
                            )}
                            {maintenance.payment_support && (
                                <TouchableOpacity
                                    style={styles.documentLink}
                                    onPress={() => Linking.openURL(maintenance.payment_support)}
                                >
                                    <MaterialIcons name="picture-as-pdf" size={20} color="#3B82F6" />
                                    <Text style={styles.documentLinkText}>Ver Soporte de Pago PDF</Text>
                                    <Ionicons name="open-outline" size={16} color="#3B82F6" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Equipos */}
                {maintenance.devices && maintenance.devices.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Equipos ({maintenance.devices.length})</Text>
                        <View style={styles.card}>
                            {maintenance.devices.map((device, index) => (
                                <View key={device.id} style={[styles.deviceItem, index < maintenance.devices.length - 1 && styles.deviceItemBorder]}>
                                    <View style={styles.deviceHeader}>
                                        <MaterialIcons name="precision-manufacturing" size={20} color="#3B82F6" />
                                        <Text style={styles.deviceTitle}>
                                            {device.device.brand} {device.device.model}
                                        </Text>
                                    </View>
                                    <View style={styles.deviceInfo}>
                                        <Text style={styles.deviceLabel}>Serial:</Text>
                                        <Text style={styles.deviceValue}>{device.serial}</Text>
                                    </View>
                                    <View style={styles.deviceInfo}>
                                        <Text style={styles.deviceLabel}>Dirección:</Text>
                                        <Text style={styles.deviceValue}>{device.address}</Text>
                                    </View>
                                    {device.pivot.description && (
                                        <View style={styles.deviceInfo}>
                                            <Text style={styles.deviceLabel}>Descripción:</Text>
                                            <Text style={styles.deviceValue}>{device.pivot.description}</Text>
                                        </View>
                                    )}
                                    {device.pivot.progress_status && (
                                        <View style={styles.deviceInfo}>
                                            <Text style={styles.deviceLabel}>Progreso:</Text>
                                            <Text style={styles.deviceValue}>
                                                {device.pivot.progress_pct || 0}% - {device.pivot.progress_status}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Fotos Iniciales */}
                {renderPhotoGallery(initialPhotos, 'Fotos Iniciales')}

                {/* Fotos Finales */}
                {renderPhotoGallery(finalPhotos, 'Fotos Finales')}

                {/* Observaciones */}
                {maintenance.observations && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Observaciones Finales</Text>
                        <View style={styles.card}>
                            <Text style={styles.observationsText}>{maintenance.observations}</Text>
                        </View>
                    </View>
                )}

                {/* Información Técnica */}
                {maintenance.started_at && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Información Técnica</Text>
                        <View style={styles.card}>
                            {maintenance.total_work_time && (
                                <View style={styles.techRow}>
                                    <MaterialIcons name="access-time" size={20} color="#3B82F6" />
                                    <Text style={styles.techLabel}>Tiempo Total:</Text>
                                    <Text style={styles.techValue}>
                                        {maintenance.total_work_time.formatted || maintenance.total_work_time}
                                    </Text>
                                </View>
                            )}
                            {maintenance.total_pause_ms > 0 && (
                                <View style={styles.techRow}>
                                    <MaterialIcons name="pause-circle" size={20} color="#F59E0B" />
                                    <Text style={styles.techLabel}>Tiempo Pausado:</Text>
                                    <Text style={styles.techValue}>{maintenance.total_pause_formatted}</Text>
                                </View>
                            )}
                            {maintenance.location && (
                                <View style={styles.techRow}>
                                    <MaterialIcons name="location-on" size={20} color="#EF4444" />
                                    <Text style={styles.techLabel}>Ubicación:</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const { openOpenStreetMap } = require('../../../utils/mapUtils');
                                            openOpenStreetMap(
                                                maintenance.location?.latitude,
                                                maintenance.location?.longitude
                                            );
                                        }}
                                    >
                                        <Text style={[styles.techValue, { color: '#0EA5E9', textDecorationLine: 'underline' }]}>
                                            Ver en mapa
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Logs de Acciones */}
                {maintenance.action_logs && maintenance.action_logs.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Historial de Actividad ({maintenance.action_logs.length})
                        </Text>
                        <View style={styles.card}>
                            {maintenance.action_logs.map((log, index) => {
                                const isLast = index === maintenance.action_logs.length - 1;
                                const actionColor = getActionColor(log.action);
                                return (
                                    <View key={log.id} style={styles.logItem}>
                                        <View style={styles.logTimeline}>
                                            <View style={[styles.logDot, { backgroundColor: actionColor }]} />
                                            {!isLast && <View style={styles.logLine} />}
                                        </View>
                                        <View style={styles.logContent}>
                                            <View style={styles.logHeader}>
                                                <View style={styles.logActionHeader}>
                                                    <Ionicons name={getActionIcon(log.action) as any} size={18} color={actionColor} />
                                                    <Text style={[styles.logAction, { color: actionColor }]}>
                                                        {getActionText(log.action)}
                                                    </Text>
                                                </View>
                                                <Text style={styles.logDate}>{formatDate(log.timestamp)}</Text>
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
                            })}
                        </View>
                    </View>
                )}

                {/* Firma del Cliente */}
                {maintenance.signature_photo && (() => {
                    const signatureUrl = getImageUrl(maintenance.signature_photo);
                    if (!signatureUrl) return null;
                    return (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Firma del Cliente</Text>
                            <View style={styles.card}>
                                <TouchableOpacity
                                    style={styles.signatureContainer}
                                    onPress={() => setSelectedImage(signatureUrl)}
                                >
                                    <Image
                                        source={{ uri: signatureUrl }}
                                        style={styles.signatureImage}
                                        resizeMode="contain"
                                        onError={(error) => {
                                            console.error('Error cargando firma:', signatureUrl, error);
                                        }}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })()}
            </ScrollView>

            {/* Modal para ver imagen ampliada */}
            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.imageModalContainer}>
                    <TouchableOpacity
                        style={styles.imageModalOverlay}
                        activeOpacity={1}
                        onPress={() => setSelectedImage(null)}
                    >
                        <View style={styles.imageModalContent}>
                            <TouchableOpacity
                                style={styles.imageModalCloseButton}
                                onPress={() => setSelectedImage(null)}
                            >
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                            {selectedImage && (
                                <Image
                                    source={{ uri: selectedImage }}
                                    style={styles.imageModalImage}
                                    resizeMode="contain"
                                />
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>
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
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 8,
        marginBottom: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        marginBottom: 4,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
    },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    section: {
        paddingHorizontal: 16,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    paymentLabel: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    paymentValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    documentLink: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        marginTop: 8,
        gap: 8,
    },
    documentLinkText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    deviceItem: {
        paddingVertical: 12,
    },
    deviceItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 12,
        paddingBottom: 12,
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    deviceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    deviceInfo: {
        flexDirection: 'row',
        marginTop: 4,
    },
    deviceLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginRight: 8,
        minWidth: 80,
    },
    deviceValue: {
        fontSize: 14,
        color: '#1F2937',
        flex: 1,
    },
    devicePhotoSection: {
        marginBottom: 16,
    },
    devicePhotoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    photoItem: {
        width: (width - 80) / 3,
        height: (width - 80) / 3,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    photoThumbnail: {
        width: '100%',
        height: '100%',
    },
    photoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    observationsText: {
        fontSize: 14,
        color: '#1F2937',
        lineHeight: 20,
    },
    techRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    techLabel: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    techValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    logItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    logTimeline: {
        alignItems: 'center',
        marginRight: 12,
    },
    logDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    logLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        minHeight: 40,
        marginTop: 4,
    },
    logContent: {
        flex: 1,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    logActionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    logAction: {
        fontSize: 14,
        fontWeight: '600',
    },
    logDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    logReason: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 4,
        marginBottom: 4,
    },
    logReasonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    logLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    logLocationText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    signatureContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    signatureImage: {
        width: width - 80,
        height: 200,
        borderRadius: 8,
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
        backgroundColor: '#0EA5E9',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    imageModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalOverlay: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalContent: {
        width: '90%',
        height: '80%',
        position: 'relative',
    },
    imageModalCloseButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
});

