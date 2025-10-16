import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    StatusBar,
    useColorScheme,
    TouchableOpacity,
    Alert,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import BackButton from '../../components/BackButton';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useParafiscales } from '../../hooks/useMe';
import AlertError from '../../components/AlertError';

const { width } = Dimensions.get('window');

export default function Parafiscales() {
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { parafiscales, loading, error } = useParafiscales();

    // Mostrar loading
    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.header}>
                    <BackButton color={isDark ? '#fff' : '#000'} size={28} />
                    <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
                        Parafiscales
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>
                        Cargando documentos parafiscales...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Mostrar error
    if (error) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.header}>
                    <BackButton color={isDark ? '#fff' : '#000'} size={28} />
                    <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
                        Parafiscales
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorContainer}>
                    <AlertError title="Error" message={error} />
                </View>
            </SafeAreaView>
        );
    }

    // Datos por defecto si no hay información
    const documentosPDF = parafiscales || {
        eps: {
            nombre: 'EPS',
            documento_url: ''
        },
        arl: {
            nombre: 'ARL',
            documento_url: ''
        },
        pension: {
            nombre: 'Pensión',
            documento_url: ''
        }
    };

    const abrirDocumento = async (url: string, nombre: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert(
                    'Error',
                    'No se puede abrir el documento. Verifica que tengas una aplicación para ver PDFs instalada.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            Alert.alert(
                'Error',
                'No se pudo abrir el documento. Inténtalo más tarde.',
                [{ text: 'OK' }]
            );
        }
    };

    const DocumentoCard = ({ 
        documento, 
        icon, 
        color, 
        bgColor 
    }: {
        documento: { nombre: string; documento_url: string };
        icon: keyof typeof MaterialIcons.glyphMap;
        color: string;
        bgColor: string;
    }) => (
        <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#fff' }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                    <MaterialIcons name={icon} size={28} color={color} />
                </View>
                <View style={styles.cardTitleContainer}>
                    <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#000' }]}>
                        {documento.nombre}
                    </Text>
                    <Text style={[styles.cardDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        Carnet de afiliación a {documento.nombre}
                    </Text>
                </View>
            </View>

            <TouchableOpacity 
                style={[
                    styles.actionButton, 
                    { 
                        backgroundColor: documento.documento_url ? color : '#9CA3AF',
                        opacity: documento.documento_url ? 1 : 0.6
                    }
                ]}
                onPress={() => documento.documento_url ? abrirDocumento(documento.documento_url, documento.nombre) : Alert.alert('Sin documento', 'Este documento no está disponible')}
                disabled={!documento.documento_url}
            >
                <MaterialIcons name="picture-as-pdf" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Ver PDF</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View style={styles.header}>
                <BackButton color={isDark ? '#fff' : '#000'} size={28} />
                <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
                    Parafiscales
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Información General */}
                <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#fff' }]}>
                    <View style={styles.infoHeader}>
                        <MaterialIcons name="person" size={24} color="#3B82F6" />
                        <Text style={[styles.infoTitle, { color: isDark ? '#fff' : '#000' }]}>
                            Documentos Parafiscales
                        </Text>
                    </View>
                    <Text style={[styles.technicianName, { color: isDark ? '#fff' : '#000' }]}>
                        {user?.name || 'Técnico Carini'}
                    </Text>
                    <Text style={[styles.technicianRole, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        Toca cualquier documento para verlo en PDF
                    </Text>
                </View>

                {/* Cards de Documentos PDF */}
                <DocumentoCard
                    documento={documentosPDF.eps}
                    icon="local-hospital"
                    color="#10B981"
                    bgColor="#D1FAE5"
                />

                <DocumentoCard
                    documento={documentosPDF.arl}
                    icon="security"
                    color="#F59E0B"
                    bgColor="#FEF3C7"
                />

                <DocumentoCard
                    documento={documentosPDF.pension}
                    icon="account-balance"
                    color="#8B5CF6"
                    bgColor="#EDE9FE"
                />

                {/* Información Adicional */}
                <View style={[styles.additionalInfo, { backgroundColor: isDark ? '#1F2937' : '#fff' }]}>
                    <Text style={[styles.additionalTitle, { color: isDark ? '#fff' : '#000' }]}>
                        Información Importante
                    </Text>
                    
                    <View style={styles.infoList}>
                        <View style={styles.infoItem}>
                            <MaterialIcons name="picture-as-pdf" size={24} color="#EF4444" />
                            <View style={styles.infoItemText}>
                                <Text style={[styles.infoItemTitle, { color: isDark ? '#fff' : '#000' }]}>
                                    Visualización de PDFs
                                </Text>
                                <Text style={[styles.infoItemDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Los documentos se abrirán en tu aplicación de PDFs predeterminada
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <MaterialIcons name="download" size={24} color="#3B82F6" />
                            <View style={styles.infoItemText}>
                                <Text style={[styles.infoItemTitle, { color: isDark ? '#fff' : '#000' }]}>
                                    Descarga de Documentos
                                </Text>
                                <Text style={[styles.infoItemDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Puedes descargar y guardar los documentos en tu dispositivo
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <MaterialIcons name="support-agent" size={24} color="#F59E0B" />
                            <View style={styles.infoItemText}>
                                <Text style={[styles.infoItemTitle, { color: isDark ? '#fff' : '#000' }]}>
                                    Soporte Técnico
                                </Text>
                                <Text style={[styles.infoItemDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Contacta a RRHH si tienes problemas para abrir los documentos
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
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
    technicianRole: {
        fontSize: 16,
    },
    card: {
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTitleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        margin: 20,
        marginTop: 0,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    additionalInfo: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    additionalTitle: {
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
        padding: 20,
    },
});
