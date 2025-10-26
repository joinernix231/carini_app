import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    StatusBar,
    Dimensions,
    RefreshControl,
    Image,
    Linking,
    Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';
import { useEquipo } from '../../../hooks/equipo/useEquipo';
import { Equipo } from '../../../types/equipo/equipo';
import { useAuth } from '../../../context/AuthContext';

const { width } = Dimensions.get('window');

type RootStackParamList = {
    DetalleEquipoAdmin: { id: number };
    EditarEquipo: { id: number } | undefined;
    EquipoList: undefined;
};

type RouteParams = {
    id: number;
};

export default function DetalleEquipo() {
    const route = useRoute();
    const navigation = useNavigation<any>();
    const { id } = route.params as RouteParams;

    const {
        equipo,
        loading,
        error,
        fetchEquipo,
        updateEquipo,
        changeStatus,
        removeEquipo,
    } = useEquipo(id);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);

    const displayName = equipo?.serial ?? 'Equipo';
    const displayInfo = equipo ? `${equipo.brand} ${equipo.model}` : '-';

    const handleEdit = useCallback(() => {
        navigation.navigate('EditarEquipo', { id });
    }, [navigation, id]);

    const confirmDelete = useCallback(() => {
        Alert.alert(
            'Eliminar equipo',
            `¿Estás seguro que deseas eliminar el equipo ${displayName}? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeEquipo();
                            Alert.alert('Éxito', 'Equipo eliminado', [{ text: 'OK', onPress: () => navigation.navigate('EquipoList') }]);
                        } catch (err) {
                            Alert.alert('Error', 'No se pudo eliminar el equipo');
                        }
                    },
                },
            ]
        );
    }, [displayName, removeEquipo, navigation]);



    const formatDate = (value?: string | null) => {
        if (!value) return '-';
        const normalized = value.replace(' ', 'T');
        const d = new Date(normalized);
        if (isNaN(d.getTime())) return value;
        return d.toLocaleString();
    };

    const handleViewPDF = useCallback(() => {
        if (!equipo?.PDF) {
            Alert.alert('Error', 'No hay documento PDF disponible para este equipo');
            return;
        }
        setPdfModalVisible(true);
    }, [equipo?.PDF]);

    const handleViewPhoto = useCallback(() => {
        if (!equipo?.photo) {
            Alert.alert('Error', 'No hay imagen disponible para este equipo');
            return;
        }
        setImageModalVisible(true);
    }, [equipo?.photo]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0EA5E9" />
                    <Text style={styles.loadingText}>Cargando equipo...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!equipo && !loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color="#EF4444" />
                    <Text style={styles.errorTitle}>Equipo no encontrado</Text>
                    <Text style={styles.errorText}>{error ?? 'No se pudo cargar la información.'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchEquipo()}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />

            <View style={styles.header}>
                <BackButton color="#fff" />
                <View style={styles.headerCenter}>
                    <View style={styles.avatar}>
                    <Ionicons name="hardware-chip-outline" size={44} color="#fff" />
                    </View>

                    <Text style={styles.title}>{displayName}</Text>
                    <Text style={styles.subtitle}>{displayInfo}</Text>

                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => {
                        Alert.alert('Compartir', `Equipo: ${displayName}\nMarca: ${equipo?.brand}\nModelo: ${equipo?.model}`);
                    }} accessibilityLabel="Compartir equipo">
                        <MaterialIcons name="share" size={22} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={false} onRefresh={() => fetchEquipo()} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información general</Text>
                    <View style={styles.card}>
                        <Row label="Marca" value={equipo?.brand ?? '-'} icon="business" color="#3B82F6" />
                        <Row label="Modelo" value={equipo?.model ?? '-'} icon="devices" color="#06B6D4" />
                        <Row label="Tipo" value={equipo?.type ?? '-'} icon="category" color="#F59E0B" />
                        <Row label="Descripción" value={equipo?.description ?? '-'} icon="description" color="#10B981" />
                    </View>
                </View>

                {equipo?.photo && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Imagen del equipo</Text>
                        <View style={styles.card}>
                            <TouchableOpacity onPress={handleViewPhoto} style={styles.imageContainer}>
                                <Image 
                                    source={{ uri: equipo.photo }} 
                                    style={styles.equipoImage}
                                    onError={() => {}}
                                    onLoad={() => {}}
                                />
                                <View style={styles.imageOverlay}>
                                    <MaterialIcons name="zoom-in" size={24} color="#fff" />
                                    <Text style={styles.imageOverlayText}>Toca para ampliar</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {equipo?.PDF && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Documento PDF</Text>
                        <View style={styles.card}>
                            <TouchableOpacity onPress={handleViewPDF} style={styles.pdfContainer}>
                                <View style={styles.pdfIcon}>
                                    <MaterialIcons name="picture-as-pdf" size={32} color="#EF4444" />
                                </View>
                                <View style={styles.pdfInfo}>
                                    <Text style={styles.pdfTitle}>Documento del Equipo</Text>
                                    <Text style={styles.pdfSubtitle}>Toca para abrir el PDF</Text>
                                </View>
                                <MaterialIcons name="open-in-new" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del sistema</Text>
                    <View style={styles.card}>
                        <Row label="Creado" value={formatDate(equipo?.created_at)} icon="event" color="#34D399" />
                        <Row label="Actualizado" value={formatDate(equipo?.updated_at)} icon="update" color="#60A5FA" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acciones</Text>
                    <View style={styles.actionRow}>
                        <ActionButton label="Editar" icon="edit" color="#F59E0B" onPress={handleEdit} disabled={!equipo} />
                    
                        <ActionButton label="Eliminar" icon="delete" color="#EF4444" onPress={confirmDelete} disabled={!equipo} />
                    </View>
                </View>
            </ScrollView>

            {/* Modal para imagen ampliada */}
            <Modal
                visible={imageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setImageModalVisible(false)}
            >
                <View style={styles.imageModalContainer}>
                    <TouchableOpacity 
                        style={styles.imageModalOverlay}
                        activeOpacity={1}
                        onPress={() => setImageModalVisible(false)}
                    >
                        <View style={styles.imageModalContent}>
                            <TouchableOpacity 
                                style={styles.imageModalCloseButton}
                                onPress={() => setImageModalVisible(false)}
                            >
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Image 
                                source={{ uri: equipo?.photo || undefined }} 
                                style={styles.imageModalImage}
                                resizeMode="contain"
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* Modal para PDF */}
            <Modal
                visible={pdfModalVisible}
                animationType="slide"
                onRequestClose={() => setPdfModalVisible(false)}
            >
                <View style={styles.pdfModalContainer}>
                    <View style={styles.pdfModalHeader}>
                        <TouchableOpacity 
                            style={styles.pdfModalCloseButton}
                            onPress={() => setPdfModalVisible(false)}
                        >
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.pdfModalTitle}>Manual del Equipo</Text>
                    </View>
                    <View style={styles.pdfViewerContainer}>
                        {equipo?.PDF ? (
                            <WebView
                                source={{ 
                                    uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(equipo.PDF)}`
                                }}
                                style={styles.pdfViewer}
                                onLoadStart={() => {}}
                                onLoadEnd={() => {}}
                                onError={(error) => {
                                    Alert.alert('Error', 'No se pudo cargar el PDF. Verifica tu conexión.');
                                }}
                                startInLoadingState={true}
                                renderLoading={() => (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#0EA5E9" />
                                        <Text style={styles.loadingText}>Cargando PDF...</Text>
                                    </View>
                                )}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                allowsInlineMediaPlayback={true}
                                mediaPlaybackRequiresUserAction={false}
                                onShouldStartLoadWithRequest={(request) => {
                                    // Solo permitir URLs de Google Docs Viewer
                                    const isGoogleDocs = request.url.includes('docs.google.com');
                                    return isGoogleDocs;
                                }}
                            />
                        ) : (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.loadingText}>No hay PDF disponible</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

/* Small presentational components */
const Row = ({ label, value, icon, color }: { label: string; value?: string; icon: string; color: string }) => (
    <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: `${color}22` }]}>
            <MaterialIcons name={icon as any} size={18} color={color} />
        </View>
        <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value ?? '-'}</Text>
        </View>
    </View>
);

const ActionButton = ({ icon, label, color, onPress, disabled }: { icon: string; label: string; color: string; onPress: () => void; disabled?: boolean }) => (
    <TouchableOpacity style={[styles.actionBtn, disabled && { opacity: 0.6 }]} onPress={onPress} disabled={disabled}>
        <View style={[styles.actionIcon, { backgroundColor: color }]}>
            <MaterialIcons name={icon as any} size={20} color="#fff" />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFB' },
    header: { paddingTop: 12, paddingBottom: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0EA5E9' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerActions: { width: 44, alignItems: 'flex-end' },
    avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%', borderRadius: 44 },
    title: { color: '#fff', fontSize: 20, fontWeight: '700' },
    subtitle: { color: 'rgba(255,255,255,0.95)', marginTop: 4, fontSize: 14 },
    statusBadge: { marginTop: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    statusText: { fontWeight: '700' },

    scrollContainer: { flex: 1 },

    section: { paddingHorizontal: 16, marginTop: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },

    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rowIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rowContent: { flex: 1 },
    rowLabel: { fontSize: 13, color: '#6B7280' },
    rowValue: { fontSize: 16, fontWeight: '600', color: '#0F172A' },

    imageContainer: {
        alignItems: 'center',
        paddingVertical: 16,
        position: 'relative',
    },
    equipoImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    imageOverlayText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    pdfContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    pdfIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    pdfInfo: {
        flex: 1,
    },
    pdfTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4,
    },
    pdfSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap' },
    actionBtn: { width: (width - 56) / 3, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    actionIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    actionLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 8, color: '#6B7280' },

    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    errorTitle: { marginTop: 12, fontSize: 18, fontWeight: '700' },
    errorText: { color: '#6B7280', marginTop: 8, textAlign: 'center' },
    retryButton: { marginTop: 16, backgroundColor: '#0EA5E9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontWeight: '700' },

    // Modal de imagen
    imageModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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

    // Modal de PDF
    pdfModalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    pdfModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#0EA5E9',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    pdfModalCloseButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pdfModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
        marginRight: 40, // Para centrar considerando el botón de cerrar
    },
    pdfViewerContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    pdfViewer: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
