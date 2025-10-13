import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Modal,
    ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import BackButton from '../../../components/BackButton';
import { useAuth } from '../../../context/AuthContext';
import { useSmartNavigation } from '../../../hooks/useSmartNavigation';
import { asignarEquipo as asignarEquipoCliente } from '../../../services/EquipoClienteService';
import { AvailableDevicesService } from '../../../services/AvailableDevicesService';
import { useError } from '../../../context/ErrorContext';

const { height: screenHeight } = Dimensions.get('window');

// Types for devices returned by /api/devices
interface Device {
    id: number;
    model: string;
    brand: string;
    serial: string;
    type: string;
    manufactured_at?: string;
}

// Local navigation typing
type RootStackParamList = {
    MisEquipos: undefined;
    AgregarEquipo: undefined;
};

export default function AgregarEquipo() {
    const { navigate, navigateReplace } = useSmartNavigation();
    const { token } = useAuth();
    const { showError } = useError();

    const [devices, setDevices] = useState<Device[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [serial, setSerial] = useState('');
    const [address, setAddress] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
    const [showDeviceModal, setShowDeviceModal] = useState(false);

    useEffect(() => {
        if (token) loadDevices();
    }, [token]);

    // Filter devices when typing
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

    const loadDevices = async () => {
        try {
            setLoadingDevices(true);
            console.log('🔍 AgregarEquipo - Cargando dispositivos...');
            const data = await AvailableDevicesService.getAvailableDevices(token!);
            console.log('🔍 AgregarEquipo - Datos recibidos:', data);
            
            if (Array.isArray(data)) {
                console.log('✅ AgregarEquipo - Datos es array, normalizando...');
                const normalized: Device[] = data.map((d: any) => ({
                    id: d.id ?? d.device?.id ?? 0,
                    model: d.model ?? d.device?.model ?? 'N/A',
                    brand: d.brand ?? d.device?.brand ?? 'N/A',
                    serial: d.serial ?? d.device?.serial ?? 'N/A',
                    type: d.type ?? d.device?.type ?? 'device',
                    manufactured_at: d.manufactured_at ?? d.device?.manufactured_at,
                }));
                console.log('✅ AgregarEquipo - Dispositivos normalizados:', normalized.length);
                setDevices(normalized);
                setFilteredDevices(normalized);
            } else {
                console.log('❌ AgregarEquipo - Datos no es array:', typeof data, data);
                setDevices([]);
                setFilteredDevices([]);
            }
        } catch (err) {
            console.error('❌ AgregarEquipo - Error cargando dispositivos:', err);
            showError(err, 'No se pudo cargar la lista de dispositivos.');
            setDevices([]);
        } finally {
            setLoadingDevices(false);
        }
    };

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
        if (!token) {
            Alert.alert('Error', 'No hay sesión activa');
            return;
        }
        if (!validate()) return;

        try {
            setSubmitting(true);
            const payload = {
                serial: serial.trim(),
                address: address.trim(),
                device_id: Number(selectedDevice!.id),
            } as const;

            await asignarEquipoCliente(payload as any, token);

            Alert.alert('Éxito', 'Equipo vinculado correctamente', [
                {
                    text: 'OK',
                    onPress: () => {
                        // Notificar que el equipo fue agregado para refrescar la pantalla anterior
                        navigateReplace('MisEquipos');
                    },
                },
            ]);
        } catch (error: any) {
            console.error('Error vinculando equipo:', error?.response?.data ?? error);
            showError(error, 'No se pudo vincular el equipo');
        } finally {
            setSubmitting(false);
        }
    };

    const selectDevice = (device: Device) => {
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
                                    : 'No hay dispositivos disponibles en tu empresa'
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
                                        <View style={[styles.deviceCardIcon, { backgroundColor: getDeviceColor(device.type) }]}>
                                            <MaterialIcons
                                                name={getDeviceIcon(device.type) as any}
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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <BackButton style={styles.backButton} color="#000" size={24} />
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Agregar Equipo</Text>
                    <Text style={styles.subtitle}>
                        Completa la información para vincular un nuevo equipo
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
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
                                        <View style={[styles.selectedDeviceIcon, { backgroundColor: getDeviceColor(selectedDevice.type) }]}>
                                            <MaterialIcons
                                                name={getDeviceIcon(selectedDevice.type) as any}
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
                                    <View style={styles.devicePlaceholder}>
                                        <MaterialIcons name="add-circle-outline" size={24} color="#007AFF" />
                                        <Text style={styles.devicePlaceholderText}>
                                            Seleccionar dispositivo
                                        </Text>
                                        <MaterialIcons name="keyboard-arrow-right" size={24} color="#007AFF" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Card de información del equipo */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <MaterialIcons name="info-outline" size={24} color="#FF6B6B" />
                                <Text style={styles.cardTitle}>Información del Equipo</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Serial del equipo</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: SN-s8676-vgb"
                                    placeholderTextColor="#999"
                                    value={serial}
                                    onChangeText={setSerial}
                                    returnKeyType="next"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Dirección de instalación</Text>
                                <TextInput
                                    style={[styles.input, styles.addressInput]}
                                    placeholder="Ej: Calle 83a #69-50, Bogotá"
                                    placeholderTextColor="#999"
                                    value={address}
                                    onChangeText={setAddress}
                                    returnKeyType="done"
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        {/* Botón de envío */}
                        <TouchableOpacity
                            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                            onPress={onSubmit}
                            disabled={submitting}
                            activeOpacity={0.8}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    <Text style={styles.submitText}>Vincular Equipo</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {renderDeviceModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    backButton: {
        padding: 8,
        marginTop: 8,
        marginBottom: 8,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerContent: {
        marginTop: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748B',
        lineHeight: 20,
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: Platform.OS === 'ios' ? 20 : 40,
    },
    content: {
        flex: 1,
        padding: 20,
        gap: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A202C',
    },
    deviceSelector: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    selectedDeviceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    selectedDeviceIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedDeviceInfo: {
        flex: 1,
    },
    selectedDeviceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A202C',
        marginBottom: 2,
    },
    selectedDeviceSubtitle: {
        fontSize: 13,
        color: '#64748B',
    },
    devicePlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 12,
        justifyContent: 'center',
    },
    devicePlaceholderText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        fontSize: 16,
        color: '#1A202C',
    },
    addressInput: {
        minHeight: 80,
        paddingTop: 16,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        marginTop: 10,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    modalHeader: {
        backgroundColor: '#fff',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A202C',
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        flex: 1,
        padding: 20,
        minHeight: screenHeight * 0.7, // Altura mínima para el contenido
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1A202C',
        marginLeft: 8,
    },
    modalLoadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    modalLoadingText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    modalEmptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 40,
    },
    modalEmptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#374151',
        textAlign: 'center',
    },
    modalEmptyText: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
    },
    deviceScrollContainer: {
        flex: 1,
        maxHeight: screenHeight * 0.6, // Limitar altura máxima
    },
    deviceScrollContent: {
        paddingBottom: 20,
        flexGrow: 1,
    },
    deviceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    deviceCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        width: '48%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 4,
    },
    deviceCardIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    deviceCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A202C',
        textAlign: 'center',
        marginBottom: 4,
    },
    deviceCardSubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 8,
    },
    deviceCardType: {
        fontSize: 11,
        color: '#94A3B8',
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});