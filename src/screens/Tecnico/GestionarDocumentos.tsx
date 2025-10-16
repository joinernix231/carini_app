import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StatusBar,
    useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import BackButton from '../../components/BackButton';
import DocumentUploader from '../../components/DocumentUploader';
import ImageUploader from '../../components/ImageUploader';
import { useMe } from '../../hooks/useMe';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/StorageService';
import API from '../../services/api';

export default function GestionarDocumentos() {
    const { meData, loading, error, refetch } = useMe();
    const { token } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [uploading, setUploading] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Estados para los documentos
    const [epsDocument, setEpsDocument] = useState<string | null>(null);
    const [arlDocument, setArlDocument] = useState<string | null>(null);
    const [pensionDocument, setPensionDocument] = useState<string | null>(null);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

    // Inicializar con datos existentes
    useEffect(() => {
        if (meData?.technician_data) {
            const tech = meData.technician_data;
            setEpsDocument(tech.eps_pdf || null);
            setArlDocument(tech.arl_pdf || null);
            setPensionDocument(tech.pension_pdf || null);
            setProfilePhoto(tech.photo || null);
        }
    }, [meData]);

    const updateTechnicianData = async (field: string, value: string | null) => {
        if (!token) {
            Alert.alert('Error', 'No hay token de autenticación');
            return;
        }

        try {
            setUpdating(true);
            
            const response = await API.put('/api/technician/profile', {
                [field]: value
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                console.log(`✅ ${field} actualizado correctamente`);
                // Refrescar datos
                await refetch();
            } else {
                throw new Error(response.data.message || 'Error actualizando datos');
            }
        } catch (error: any) {
            console.error(`❌ Error actualizando ${field}:`, error);
            Alert.alert('Error', `No se pudo actualizar ${field}. Inténtalo más tarde.`);
        } finally {
            setUpdating(false);
        }
    };

    const handleDocumentUpload = async (type: 'eps' | 'arl' | 'pension', url: string | null) => {
        const fieldMap = {
            eps: 'eps_pdf',
            arl: 'arl_pdf',
            pension: 'pension_pdf'
        };

        await updateTechnicianData(fieldMap[type], url);
    };

    const handlePhotoUpload = async (url: string | null) => {
        await updateTechnicianData('photo', url);
    };

    const getDocumentTitle = (type: string) => {
        const titles = {
            eps: 'Documento EPS',
            arl: 'Documento ARL',
            pension: 'Documento de Pensión'
        };
        return titles[type as keyof typeof titles] || 'Documento';
    };

    const getDocumentDescription = (type: string) => {
        const descriptions = {
            eps: 'Carnet de afiliación a EPS',
            arl: 'Carnet de afiliación a ARL',
            pension: 'Carnet de afiliación a Pensión'
        };
        return descriptions[type as keyof typeof descriptions] || 'Documento PDF';
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.header}>
                    <BackButton color={isDark ? '#fff' : '#000'} size={28} />
                    <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
                        Gestionar Documentos
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>
                        Cargando documentos...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.header}>
                    <BackButton color={isDark ? '#fff' : '#000'} size={28} />
                    <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
                        Gestionar Documentos
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color="#EF4444" />
                    <Text style={[styles.errorTitle, { color: isDark ? '#fff' : '#000' }]}>
                        Error al cargar
                    </Text>
                    <Text style={[styles.errorText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        {error}
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View style={styles.header}>
                <BackButton color={isDark ? '#fff' : '#000'} size={28} />
                <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
                    Gestionar Documentos
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Información del Técnico */}
                <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#fff' }]}>
                    <View style={styles.infoHeader}>
                        <MaterialIcons name="person" size={24} color="#3B82F6" />
                        <Text style={[styles.infoTitle, { color: isDark ? '#fff' : '#000' }]}>
                            Información del Técnico
                        </Text>
                    </View>
                    <Text style={[styles.technicianName, { color: isDark ? '#fff' : '#000' }]}>
                        {meData?.user?.name || 'Técnico'}
                    </Text>
                    <Text style={[styles.technicianSpecialty, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        {meData?.technician_data?.specialty || 'Especialidad no especificada'}
                    </Text>
                </View>

                {/* Foto de Perfil */}
                <View style={[styles.section, { backgroundColor: isDark ? '#1F2937' : '#fff' }]}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                        Foto de Perfil
                    </Text>
                    <ImageUploader
                        title="Foto de Perfil"
                        initialImageUri={profilePhoto}
                        onImageChange={setProfilePhoto}
                        onImageUploaded={handlePhotoUpload}
                        imageName={`tecnico_${meData?.user?.id}_foto`}
                        required={false}
                    />
                </View>

                {/* Documentos Parafiscales */}
                <View style={[styles.section, { backgroundColor: isDark ? '#1F2937' : '#fff' }]}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                        Documentos Parafiscales
                    </Text>
                    <Text style={[styles.sectionDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        Sube tus documentos de afiliación a EPS, ARL y Pensión
                    </Text>

                    {/* EPS */}
                    <DocumentUploader
                        title={getDocumentTitle('eps')}
                        initialDocumentUri={epsDocument}
                        onDocumentChange={(uri) => setEpsDocument(uri)}
                        onDocumentUploaded={(url) => handleDocumentUpload('eps', url)}
                        customDocumentName={`tecnico_${meData?.user?.id}_eps`}
                        required={false}
                    />

                    {/* ARL */}
                    <DocumentUploader
                        title={getDocumentTitle('arl')}
                        initialDocumentUri={arlDocument}
                        onDocumentChange={(uri) => setArlDocument(uri)}
                        onDocumentUploaded={(url) => handleDocumentUpload('arl', url)}
                        customDocumentName={`tecnico_${meData?.user?.id}_arl`}
                        required={false}
                    />

                    {/* Pensión */}
                    <DocumentUploader
                        title={getDocumentTitle('pension')}
                        initialDocumentUri={pensionDocument}
                        onDocumentChange={(uri) => setPensionDocument(uri)}
                        onDocumentUploaded={(url) => handleDocumentUpload('pension', url)}
                        customDocumentName={`tecnico_${meData?.user?.id}_pension`}
                        required={false}
                    />
                </View>

                {/* Información Adicional */}
                <View style={[styles.infoSection, { backgroundColor: isDark ? '#1F2937' : '#fff' }]}>
                    <Text style={[styles.infoSectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                        Información Importante
                    </Text>
                    
                    <View style={styles.infoList}>
                        <View style={styles.infoItem}>
                            <MaterialIcons name="security" size={24} color="#10B981" />
                            <View style={styles.infoItemText}>
                                <Text style={[styles.infoItemTitle, { color: isDark ? '#fff' : '#000' }]}>
                                    Documentos Seguros
                                </Text>
                                <Text style={[styles.infoItemDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Todos los documentos se almacenan de forma segura
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <MaterialIcons name="update" size={24} color="#F59E0B" />
                            <View style={styles.infoItemText}>
                                <Text style={[styles.infoItemTitle, { color: isDark ? '#fff' : '#000' }]}>
                                    Actualización Automática
                                </Text>
                                <Text style={[styles.infoItemDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Los cambios se reflejan inmediatamente en tu perfil
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <MaterialIcons name="support-agent" size={24} color="#3B82F6" />
                            <View style={styles.infoItemText}>
                                <Text style={[styles.infoItemTitle, { color: isDark ? '#fff' : '#000' }]}>
                                    Soporte Técnico
                                </Text>
                                <Text style={[styles.infoItemDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Contacta a RRHH si tienes problemas con la subida
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {updating && (
                    <View style={styles.updatingContainer}>
                        <ActivityIndicator size="small" color="#3B82F6" />
                        <Text style={[styles.updatingText, { color: isDark ? '#fff' : '#000' }]}>
                            Actualizando datos...
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    infoCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    technicianName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    technicianSpecialty: {
        fontSize: 16,
    },
    section: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    infoSection: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    infoList: {
        gap: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItemText: {
        flex: 1,
        marginLeft: 12,
    },
    infoItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    infoItemDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    updatingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    updatingText: {
        fontSize: 14,
        fontWeight: '500',
    },
});






