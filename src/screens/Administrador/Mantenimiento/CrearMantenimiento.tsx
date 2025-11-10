import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    FlatList,
    Image,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';
import { useAuth } from '../../../context/AuthContext';
import { useError } from '../../../context/ErrorContext';
import { useTheme } from '../../../context/ThemeContext';
import { ClienteService } from '../../../services/ClienteService';
import { ClientDeviceService } from '../../../services/ClientDeviceService';
import { AdminMantenimientosService } from '../../../services/AdminMantenimientosService';
import { uploadImage } from '../../../services/UploadImage';
import { Cliente } from '../../../types/cliente/cliente';
import { ClientDevice } from '../../../types/cliente/ClientDevice';

type RootStackParamList = {
    VerMantenimientos: undefined;
    CrearMantenimiento: undefined;
};

export default function CrearMantenimiento() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { token } = useAuth();
    const { showError } = useError();
    const { isDark, colors } = useTheme();

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loadingClientes, setLoadingClientes] = useState(true);
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    const [clientDevices, setClientDevices] = useState<ClientDevice[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(false);

    const [showClientSelector, setShowClientSelector] = useState(false);
    const [showDeviceSelector, setShowDeviceSelector] = useState(false);

    const [selectedDevices, setSelectedDevices] = useState<{
        id: number;
        description?: string;
    }[]>([]);

    const [tipo, setTipo] = useState<'preventive' | 'corrective'>('preventive');
    const [descripcion, setDescripcion] = useState('');
    const [foto, setFoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadClientes();
    }, []);

    useEffect(() => {
        if (selectedClient) {
            loadClientDevices();
        } else {
            setClientDevices([]);
            setSelectedDevices([]);
        }
    }, [selectedClient]);

    const loadClientes = async () => {
        if (!token) return;

        try {
            setLoadingClientes(true);
            const response = await ClienteService.getAll(token, 1, 'status|is|active');
            setClientes(response.data);
        } catch (error) {
            showError(error);
        } finally {
            setLoadingClientes(false);
        }
    };

    const loadClientDevices = async () => {
        if (!token || !selectedClient) return;

        try {
            setLoadingDevices(true);
            const devices = await ClientDeviceService.getClientDevices(selectedClient.id, token);
            setClientDevices(devices);
        } catch (error) {
            showError(error);
        } finally {
            setLoadingDevices(false);
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permisos requeridos',
                    'Necesitamos acceso a tu galería para seleccionar imágenes.'
                );
                return;
            }

            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!resultado.canceled && resultado.assets.length > 0) {
                setFoto(resultado.assets[0]);
            }
        } catch (error) {
            Alert.alert('Error', 'Hubo un problema al seleccionar la imagen.');
        }
    };

    const toggleDeviceSelection = (deviceId: number) => {
        setSelectedDevices(prev => {
            const exists = prev.find(d => d.id === deviceId);
            if (exists) {
                return prev.filter(d => d.id !== deviceId);
            } else {
                return [...prev, { id: deviceId }];
            }
        });
    };

    const updateDeviceDescription = (deviceId: number, description: string) => {
        setSelectedDevices(prev =>
            prev.map(d =>
                d.id === deviceId ? { ...d, description } : d
            )
        );
    };

    const handleSubmit = async () => {
        if (loading) return;

        if (!selectedClient) {
            Alert.alert('Error', 'Debes seleccionar un cliente.');
            return;
        }

        if (selectedDevices.length === 0) {
            Alert.alert('Error', 'Debes seleccionar al menos un equipo.');
            return;
        }

        if (tipo === 'corrective' && descripcion.trim() === '') {
            Alert.alert('Error', 'La descripción es obligatoria para mantenimientos correctivos.');
            return;
        }

        setLoading(true);
        try {
            let nombreImagen: string | undefined;

            if (foto) {
                try {
                    nombreImagen = `maintenances/mantenimiento_${Date.now()}`;
                    const uri = foto.uri;

                    if (!uri) {
                        Alert.alert('Error', 'La imagen seleccionada no es válida.');
                        return;
                    }

                    const uploadResult = await uploadImage(uri, nombreImagen!, token!);

                    if (!uploadResult) {
                        Alert.alert('Advertencia', 'No se pudo subir la imagen, pero se continuará con el registro.');
                        nombreImagen = undefined;
                    }
                } catch (uploadError) {
                    const shouldContinue = await new Promise<boolean>((resolve) => {
                        Alert.alert(
                            'Error de imagen',
                            '¿Deseas continuar sin la imagen?',
                            [
                                { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
                                { text: 'Continuar', onPress: () => resolve(true) }
                            ]
                        );
                    });

                    if (!shouldContinue) {
                        setLoading(false);
                        return;
                    }
                    nombreImagen = undefined;
                }
            }

            const payload = {
                client_id: selectedClient.id,
                type: tipo,
                description: descripcion.trim() || undefined,
                photo: nombreImagen,
                client_devices: selectedDevices.map(device => ({
                    id: device.id,
                    description: device.description || null
                })),
            };

            await AdminMantenimientosService.createMantenimiento(token!, payload);

            Alert.alert(
                'Éxito',
                'Mantenimiento creado correctamente',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            navigation.navigate('VerMantenimientos');
                        }
                    }
                ]
            );
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Error al crear el mantenimiento';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderClientItem = ({ item }: { item: Cliente }) => (
        <TouchableOpacity
            style={[styles.modalItem, isDark && { backgroundColor: '#1F2937' }]}
            onPress={() => {
                setSelectedClient(item);
                setShowClientSelector(false);
            }}
        >
            <View style={styles.modalItemContent}>
                <Ionicons name="business" size={24} color="#3B82F6" />
                <View style={styles.modalItemText}>
                    <Text style={[styles.modalItemTitle, isDark && { color: '#fff' }]}>
                        {item.name}
                    </Text>
                    <Text style={[styles.modalItemSubtitle, isDark && { color: '#9CA3AF' }]}>
                        {item.phone || 'Sin teléfono'}
                    </Text>
                </View>
            </View>
            {selectedClient?.id === item.id && (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            )}
        </TouchableOpacity>
    );

    const renderDeviceItem = ({ item }: { item: ClientDevice }) => {
        const isSelected = selectedDevices.some(d => d.id === item.id);
        const deviceDescription = selectedDevices.find(d => d.id === item.id)?.description || '';

        return (
            <View style={[styles.deviceCard, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}>
                <TouchableOpacity
                    style={styles.deviceCardHeader}
                    onPress={() => toggleDeviceSelection(item.id)}
                >
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                    <View style={styles.deviceInfo}>
                        <Text style={[styles.deviceName, isDark && { color: '#fff' }]}>
                            {item.device?.brand} {item.device?.model}
                        </Text>
                        <Text style={[styles.deviceSerial, isDark && { color: '#9CA3AF' }]}>
                            Serial: {item.serial} • {item.device?.type}
                        </Text>
                        <Text style={[styles.deviceAddress, isDark && { color: '#9CA3AF' }]}>
                            {item.address}
                        </Text>
                    </View>
                </TouchableOpacity>

                {isSelected && (
                    <View style={styles.deviceDescriptionContainer}>
                        <Text style={[styles.deviceDescriptionLabel, isDark && { color: '#D1D5DB' }]}>
                            Descripción (opcional):
                        </Text>
                        <TextInput
                            style={[styles.deviceDescriptionInput, isDark && { backgroundColor: '#111827', color: '#fff', borderColor: '#374151' }]}
                            placeholder="Agregar descripción del problema..."
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            multiline
                            numberOfLines={3}
                            value={deviceDescription}
                            onChangeText={(text) => updateDeviceDescription(item.id, text)}
                        />
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View style={[styles.header, isDark && { backgroundColor: '#1F2937' }]}>
                <BackButton color={isDark ? '#fff' : '#000'} />
                <Text style={[styles.headerTitle, isDark && { color: '#fff' }]}>
                    Crear Mantenimiento
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Tipo de Mantenimiento */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDark && { color: '#fff' }]}>
                        Tipo de Mantenimiento
                    </Text>
                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                tipo === 'preventive' && styles.typeButtonActive,
                                isDark && tipo !== 'preventive' && { backgroundColor: '#1F2937', borderColor: '#374151' }
                            ]}
                            onPress={() => setTipo('preventive')}
                        >
                            <Ionicons
                                name="shield-checkmark"
                                size={24}
                                color={tipo === 'preventive' ? '#00C7BE' : (isDark ? '#9CA3AF' : '#6B7280')}
                            />
                            <Text
                                style={[
                                    styles.typeButtonText,
                                    tipo === 'preventive' && styles.typeButtonTextActive,
                                    isDark && tipo !== 'preventive' && { color: '#9CA3AF' }
                                ]}
                            >
                                Preventivo
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                tipo === 'corrective' && styles.typeButtonActive,
                                isDark && tipo !== 'corrective' && { backgroundColor: '#1F2937', borderColor: '#374151' }
                            ]}
                            onPress={() => setTipo('corrective')}
                        >
                            <Ionicons
                                name="warning"
                                size={24}
                                color={tipo === 'corrective' ? '#FF6B47' : (isDark ? '#9CA3AF' : '#6B7280')}
                            />
                            <Text
                                style={[
                                    styles.typeButtonText,
                                    tipo === 'corrective' && styles.typeButtonTextActive,
                                    isDark && tipo !== 'corrective' && { color: '#9CA3AF' }
                                ]}
                            >
                                Correctivo
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Selección de Cliente */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDark && { color: '#fff' }]}>
                        Cliente *
                    </Text>
                    <TouchableOpacity
                        style={[styles.selectButton, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}
                        onPress={() => setShowClientSelector(true)}
                    >
                        {selectedClient ? (
                            <View style={styles.selectedClient}>
                                <Ionicons name="business" size={20} color="#3B82F6" />
                                <Text style={[styles.selectedClientText, isDark && { color: '#fff' }]}>
                                    {selectedClient.name}
                                </Text>
                            </View>
                        ) : (
                            <Text style={[styles.selectButtonText, isDark && { color: '#9CA3AF' }]}>
                                Seleccionar cliente
                            </Text>
                        )}
                        <Ionicons name="chevron-down" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    </TouchableOpacity>
                </View>

                {/* Selección de Equipos */}
                {selectedClient && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDark && { color: '#fff' }]}>
                            Equipos * ({selectedDevices.length} seleccionados)
                        </Text>
                        <TouchableOpacity
                            style={[styles.selectButton, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}
                            onPress={() => setShowDeviceSelector(true)}
                        >
                            <Text style={[styles.selectButtonText, isDark && { color: '#9CA3AF' }]}>
                                {selectedDevices.length > 0
                                    ? `${selectedDevices.length} equipo${selectedDevices.length > 1 ? 's' : ''} seleccionado${selectedDevices.length > 1 ? 's' : ''}`
                                    : 'Seleccionar equipos'
                                }
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Descripción */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDark && { color: '#fff' }]}>
                        Descripción {tipo === 'corrective' && '*'}
                    </Text>
                    <TextInput
                        style={[styles.textInput, isDark && { backgroundColor: '#1F2937', color: '#fff', borderColor: '#374151' }]}
                        placeholder={tipo === 'preventive' ? 'Descripción opcional...' : 'Describe el problema...'}
                        placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                        multiline
                        numberOfLines={4}
                        value={descripcion}
                        onChangeText={setDescripcion}
                    />
                </View>

                {/* Foto */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDark && { color: '#fff' }]}>
                        Foto (Opcional)
                    </Text>
                    <TouchableOpacity
                        style={[styles.photoButton, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}
                        onPress={pickImage}
                    >
                        {foto ? (
                            <View style={styles.photoPreview}>
                                <Image source={{ uri: foto.uri }} style={styles.photoImage} />
                                <TouchableOpacity
                                    style={styles.removePhotoButton}
                                    onPress={() => setFoto(null)}
                                >
                                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <Ionicons name="camera" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                <Text style={[styles.photoButtonText, isDark && { color: '#9CA3AF' }]}>
                                    Agregar foto
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Botón Crear */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={24} color="#fff" />
                            <Text style={styles.submitButtonText}>Crear Mantenimiento</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Modal Selección de Cliente */}
            <Modal
                visible={showClientSelector}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowClientSelector(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, isDark && { backgroundColor: '#1F2937' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && { color: '#fff' }]}>
                                Seleccionar Cliente
                            </Text>
                            <TouchableOpacity onPress={() => setShowClientSelector(false)}>
                                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
                            </TouchableOpacity>
                        </View>
                        {loadingClientes ? (
                            <View style={styles.modalLoading}>
                                <ActivityIndicator size="large" color="#3B82F6" />
                            </View>
                        ) : (
                            <FlatList
                                data={clientes}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderClientItem}
                                ListEmptyComponent={
                                    <View style={styles.modalEmpty}>
                                        <Text style={[styles.modalEmptyText, isDark && { color: '#9CA3AF' }]}>
                                            No hay clientes disponibles
                                        </Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal Selección de Equipos */}
            <Modal
                visible={showDeviceSelector}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDeviceSelector(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, isDark && { backgroundColor: '#1F2937' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && { color: '#fff' }]}>
                                Seleccionar Equipos ({selectedDevices.length} seleccionados)
                            </Text>
                            <TouchableOpacity onPress={() => setShowDeviceSelector(false)}>
                                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
                            </TouchableOpacity>
                        </View>
                        {loadingDevices ? (
                            <View style={styles.modalLoading}>
                                <ActivityIndicator size="large" color="#3B82F6" />
                            </View>
                        ) : (
                            <FlatList
                                data={clientDevices}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderDeviceItem}
                                ListEmptyComponent={
                                    <View style={styles.modalEmpty}>
                                        <Text style={[styles.modalEmptyText, isDark && { color: '#9CA3AF' }]}>
                                            Este cliente no tiene equipos asociados
                                        </Text>
                                    </View>
                                }
                                contentContainerStyle={styles.deviceList}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
        gap: 8,
    },
    typeButtonActive: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    typeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    typeButtonTextActive: {
        color: '#3B82F6',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    selectButtonText: {
        fontSize: 16,
        color: '#6B7280',
    },
    selectedClient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectedClientText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#111827',
        textAlignVertical: 'top',
        minHeight: 100,
    },
    photoButton: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    photoButtonText: {
        marginTop: 8,
        fontSize: 16,
        color: '#6B7280',
    },
    photoPreview: {
        position: 'relative',
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    photoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removePhotoButton: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 20,
        marginBottom: 40,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalLoading: {
        padding: 40,
        alignItems: 'center',
    },
    modalEmpty: {
        padding: 40,
        alignItems: 'center',
    },
    modalEmptyText: {
        fontSize: 16,
        color: '#6B7280',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    modalItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    modalItemText: {
        flex: 1,
    },
    modalItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    modalItemSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    deviceList: {
        padding: 20,
    },
    deviceCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        marginBottom: 12,
    },
    deviceCardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    deviceSerial: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    deviceAddress: {
        fontSize: 14,
        color: '#6B7280',
    },
    deviceDescriptionContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    deviceDescriptionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    deviceDescriptionInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        backgroundColor: '#fff',
        color: '#111827',
        textAlignVertical: 'top',
        minHeight: 80,
    },
});

