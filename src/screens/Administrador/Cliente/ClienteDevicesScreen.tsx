// src/screens/Administrador/Cliente/ClienteDevicesScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Modal,
    TextInput,
    ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import { useSmartNavigation } from '../../../hooks/useSmartNavigation';
import { ClientDevice, Device } from '../../../types/cliente/ClientDevice';
import { ClientDeviceService } from '../../../services/ClientDeviceService';
import { DeviceAssociationModal } from '../../../components/DeviceAssociation';
import BackButton from '../../../components/BackButton';

interface RouteParams {
    clientId: number;
    clientName: string;
}

export default function ClienteDevicesScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { token } = useAuth();
    const { showError } = useError();
    const { navigate } = useSmartNavigation();
    
    const { clientId, clientName } = route.params as RouteParams;

    // Estados
    const [devices, setDevices] = useState<ClientDevice[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Estados para modal de asociar dispositivo
    const [showAssociateModal, setShowAssociateModal] = useState<boolean>(false);
    const [associating, setAssociating] = useState<boolean>(false);

    // Cargar dispositivos del cliente
    const loadClientDevices = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(true);
            setError(null);
            
            const clientDevices = await ClientDeviceService.getClientDevices(clientId, token);
            setDevices(clientDevices);
        } catch (err: any) {
            console.error('Error cargando dispositivos:', err);
            setError(err.message);
            showError(err);
        } finally {
            setLoading(false);
        }
    }, [clientId, token, showError]);


    // Refrescar datos
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadClientDevices();
        setRefreshing(false);
    }, [loadClientDevices]);

    // Cargar datos iniciales
    useEffect(() => {
        loadClientDevices();
    }, [loadClientDevices]);

    // Asociar dispositivo
    const handleAssociateDevice = async (deviceId: number, serial: string, address: string) => {
        try {
            setAssociating(true);
            
            await ClientDeviceService.associateDevice(
                clientId,
                {
                    device_id: deviceId,
                    serial: serial,
                    address: address
                },
                token!
            );

            Alert.alert('Éxito', 'Dispositivo asociado correctamente');
            setShowAssociateModal(false);
            await loadClientDevices();
        } catch (err: any) {
            console.error('Error asociando dispositivo:', err);
            showError(err);
            throw err; // Re-throw para que el modal maneje el error
        } finally {
            setAssociating(false);
        }
    };

    // Desasociar dispositivo
    const handleDisassociateDevice = (deviceId: number, deviceName: string) => {
        Alert.alert(
            'Desasociar Dispositivo',
            `¿Estás seguro de que quieres desasociar el dispositivo "${deviceName}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Desasociar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await ClientDeviceService.disassociateDevice(clientId, deviceId, token!);
                            Alert.alert('Éxito', 'Dispositivo desasociado correctamente');
                            await loadClientDevices();
                        } catch (err: any) {
                            console.error('Error desasociando dispositivo:', err);
                            showError(err);
                        }
                    }
                }
            ]
        );
    };

    // Abrir modal de asociar
    const openAssociateModal = () => {
        setShowAssociateModal(true);
    };

    // Renderizar dispositivo
    const renderDevice = ({ item }: { item: ClientDevice }) => (
        <View style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
                <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{item.device.brand} {item.device.model}</Text>
                    <Text style={styles.deviceType}>{item.device.type}</Text>
                    <Text style={styles.deviceSerial}>Serial: {item.serial}</Text>
                    <Text style={styles.deviceAddress}>📍 {item.address}</Text>
                </View>
                <View style={styles.deviceActions}>
                    <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: item.status ? '#10B981' : '#F97316' }]}
                        onPress={() => {/* TODO: Implementar cambio de estado */}}
                    >
                        <MaterialIcons 
                            name={item.status ? 'check-circle' : 'pause-circle'} 
                            size={20} 
                            color="#ffffff" 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDisassociateDevice(item.id, `${item.device.brand} ${item.device.model}`)}
                    >
                        <MaterialIcons name="delete" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Cargando dispositivos...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#3B82F6', '#1E40AF']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <BackButton onPress={() => navigation.goBack()} />
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Dispositivos del Cliente</Text>
                        <Text style={styles.headerSubtitle}>{clientName}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={openAssociateModal}
                    >
                        <MaterialIcons name="add" size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {error ? (
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={loadClientDevices}>
                            <Text style={styles.retryButtonText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={devices}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderDevice}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialIcons name="devices" size={64} color="#9CA3AF" />
                                <Text style={styles.emptyTitle}>No hay dispositivos asociados</Text>
                                <Text style={styles.emptySubtitle}>
                                    Toca el botón + para asociar dispositivos a este cliente
                                </Text>
                            </View>
                        }
                        contentContainerStyle={devices.length === 0 ? styles.emptyList : undefined}
                    />
                )}
            </View>

            {/* Modal para asociar dispositivo */}
            <DeviceAssociationModal
                visible={showAssociateModal}
                onClose={() => setShowAssociateModal(false)}
                onAssociate={handleAssociateDevice}
                loading={associating}
                title="Asociar Dispositivo al Cliente"
                submitButtonText="Asociar Dispositivo"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyList: {
        flexGrow: 1,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
    },
    deviceCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    deviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    deviceType: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    deviceSerial: {
        fontSize: 14,
        color: '#374151',
        marginTop: 4,
        fontWeight: '500',
    },
    deviceAddress: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    deviceActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
