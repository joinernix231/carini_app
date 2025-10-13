// src/components/DeviceAssociation/DeviceAssociationModal.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Equipo } from '../../types/equipo/equipo';
import { useDeviceAssociationWithToken } from '../../hooks/useDeviceAssociationWithToken';
import { useAuth } from '../../context/AuthContext';

const { height: screenHeight } = Dimensions.get('window');

interface DeviceAssociationModalProps {
    visible: boolean;
    onClose: () => void;
    onAssociate: (deviceId: number, serial: string, address: string) => Promise<void>;
    loading?: boolean;
    title?: string;
    submitButtonText?: string;
}

export default function DeviceAssociationModal({
    visible,
    onClose,
    onAssociate,
    loading = false,
    title = "Asociar Dispositivo",
    submitButtonText = "Asociar Dispositivo"
}: DeviceAssociationModalProps) {
    const { token } = useAuth();
    const { devices, loadingDevices, loadDevices } = useDeviceAssociationWithToken(token);
    
    const [selectedDevice, setSelectedDevice] = useState<Equipo | null>(null);
    const [serial, setSerial] = useState('');
    const [address, setAddress] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredDevices, setFilteredDevices] = useState<Equipo[]>([]);
    const [showDeviceModal, setShowDeviceModal] = useState(false);

    // Cargar dispositivos cuando se abre el modal
    useEffect(() => {
        if (visible) {
            loadDevices();
        }
    }, [visible, loadDevices]);

    // Filtrar dispositivos cuando se escribe
    useEffect(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) {
            setFilteredDevices(devices);
            return;
        }
        setFilteredDevices(
            devices.filter(d =>
                (d.model || '').toLowerCase().includes(q) ||
                (d.brand || '').toLowerCase().includes(q) ||
                (d.serial || '').toLowerCase().includes(q) ||
                (d.type || '').toLowerCase().includes(q)
            )
        );
    }, [searchQuery, devices]);


    const validate = () => {
        if (!selectedDevice) {
            Alert.alert('Validación', 'Debes seleccionar un dispositivo');
            return false;
        }
        if (!serial.trim()) {
            Alert.alert('Validación', 'Debes ingresar el serial');
            return false;
        }
        if (!address.trim()) {
            Alert.alert('Validación', 'Debes ingresar la dirección');
            return false;
        }
        return true;
    };

    const onSubmit = async () => {
        if (!validate()) return;

        try {
            await onAssociate(selectedDevice!.id, serial.trim(), address.trim());
            
            // Limpiar formulario después del éxito
            setSelectedDevice(null);
            setSerial('');
            setAddress('');
            setSearchQuery('');
            onClose();
        } catch (error) {
            // El error ya se maneja en el componente padre
        }
    };

    const selectDevice = (device: Equipo) => {
        setSelectedDevice(device);
        setShowDeviceModal(false);
        setSearchQuery('');
    };

    const getDeviceIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'lavadora':
            case 'washing machine':
            case 'washer':
                return 'local-laundry-service';
            case 'secadora':
            case 'dryer':
            case 'dry cleaning':
                return 'dry-cleaning';
            default:
                return 'devices';
        }
    };

    const getDeviceColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'lavadora':
            case 'washing machine':
            case 'washer':
                return '#4FC3F7';
            case 'secadora':
            case 'dryer':
            case 'dry cleaning':
                return '#FF8A65';
            default:
                return '#9C27B0';
        }
    };

    const renderDeviceModal = () => (
        <Modal
            visible={showDeviceModal}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderContent}>
                        <TouchableOpacity
                            onPress={() => setShowDeviceModal(false)}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Seleccionar Dispositivo</Text>
                        <View style={styles.closeButton} />
                    </View>
                </View>

                <View style={styles.modalContent}>
                    {/* Barra de búsqueda del modal */}
                    <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={20} color="#999" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar dispositivos..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <MaterialIcons name="clear" size={20} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Lista de dispositivos en el modal */}
                    {loadingDevices ? (
                        <View style={styles.modalLoadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.modalLoadingText}>Cargando dispositivos...</Text>
                        </View>
                    ) : filteredDevices.length === 0 ? (
                        <View style={styles.modalEmptyContainer}>
                            <MaterialIcons name="devices" size={48} color="#CCC" />
                            <Text style={styles.modalEmptyTitle}>
                                {searchQuery ? 'Sin resultados' : 'Sin dispositivos'}
                            </Text>
                            <Text style={styles.modalEmptyText}>
                                {searchQuery
                                    ? 'No hay dispositivos que coincidan con tu búsqueda'
                                    : 'No hay dispositivos disponibles'
                                }
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.deviceScrollContainer}
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={styles.deviceScrollContent}
                            nestedScrollEnabled={true}
                        >
                            <View style={styles.deviceGrid}>
                                {filteredDevices.map((device) => (
                                    <TouchableOpacity
                                        key={device.id}
                                        style={styles.deviceCard}
                                        onPress={() => selectDevice(device)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.deviceCardIcon, { backgroundColor: getDeviceColor(device.type || '') }]}>
                                            <MaterialIcons
                                                name={getDeviceIcon(device.type || '') as any}
                                                size={24}
                                                color="#fff"
                                            />
                                        </View>
                                        <Text style={styles.deviceCardTitle} numberOfLines={1}>
                                            {device.model}
                                        </Text>
                                        <Text style={styles.deviceCardSubtitle} numberOfLines={1}>
                                            {device.brand}
                                        </Text>
                                        <Text style={styles.deviceCardType}>
                                            {device.type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.subtitle}>
                                Completa la información para asociar un dispositivo
                            </Text>
                        </View>
                    </View>

                    <ScrollView
                        style={styles.scrollContainer}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.content}>
                            {/* Card de selección de dispositivo */}
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <MaterialIcons name="devices" size={24} color="#007AFF" />
                                    <Text style={styles.cardTitle}>Dispositivo</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.deviceSelector}
                                    onPress={() => setShowDeviceModal(true)}
                                    activeOpacity={0.7}
                                >
                                    {selectedDevice ? (
                                        <View style={styles.selectedDeviceContainer}>
                                            <View style={[styles.selectedDeviceIcon, { backgroundColor: getDeviceColor(selectedDevice.type || '') }]}>
                                                <MaterialIcons
                                                    name={getDeviceIcon(selectedDevice.type || '') as any}
                                                    size={20}
                                                    color="#fff"
                                                />
                                            </View>
                                            <View style={styles.selectedDeviceInfo}>
                                                <Text style={styles.selectedDeviceTitle}>
                                                    {selectedDevice.model} • {selectedDevice.brand}
                                                </Text>
                                                <Text style={styles.selectedDeviceSubtitle}>
                                                    ID: {selectedDevice.id} • {selectedDevice.type}
                                                </Text>
                                            </View>
                                            <MaterialIcons name="keyboard-arrow-right" size={24} color="#007AFF" />
                                        </View>
                                    ) : (
                                        <View style={styles.deviceSelectorPlaceholder}>
                                            <MaterialIcons name="add" size={24} color="#007AFF" />
                                            <Text style={styles.deviceSelectorText}>Seleccionar dispositivo</Text>
                                            <MaterialIcons name="keyboard-arrow-right" size={24} color="#007AFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Card de información del dispositivo */}
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <MaterialIcons name="info" size={24} color="#007AFF" />
                                    <Text style={styles.cardTitle}>Información del Dispositivo</Text>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Serial del Dispositivo</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Ingresa el serial del dispositivo"
                                        placeholderTextColor="#999"
                                        value={serial}
                                        onChangeText={setSerial}
                                        autoCapitalize="characters"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Dirección de Instalación</Text>
                                    <TextInput
                                        style={[styles.textInput, styles.textArea]}
                                        placeholder="Ingresa la dirección donde se instalará el dispositivo"
                                        placeholderTextColor="#999"
                                        value={address}
                                        onChangeText={setAddress}
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer con botones */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={onSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>{submitButtonText}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            {renderDeviceModal()}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
        marginLeft: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    content: {
        gap: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: 8,
    },
    deviceSelector: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 16,
        backgroundColor: '#F9FAFB',
    },
    deviceSelectorPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    deviceSelectorText: {
        flex: 1,
        fontSize: 16,
        color: '#6B7280',
        marginLeft: 12,
    },
    selectedDeviceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedDeviceIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedDeviceInfo: {
        flex: 1,
        marginLeft: 12,
    },
    selectedDeviceTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
    },
    selectedDeviceSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#fff',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    submitButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    modalHeader: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        marginLeft: 8,
    },
    modalLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    modalLoadingText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 12,
    },
    modalEmptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    modalEmptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
    },
    modalEmptyText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
    },
    deviceScrollContainer: {
        flex: 1,
    },
    deviceScrollContent: {
        paddingBottom: 20,
    },
    deviceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    deviceCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    deviceCardIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    deviceCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 4,
    },
    deviceCardSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 4,
    },
    deviceCardType: {
        fontSize: 10,
        color: '#9CA3AF',
        textAlign: 'center',
        textTransform: 'uppercase',
        fontWeight: '500',
    },
});
