import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    StatusBar,
    useColorScheme,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import BackButton from '../../components/BackButton';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useCarnetInfo } from '../../hooks/useMe';
import AlertError from '../../components/AlertError';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = CARD_WIDTH * 1.6;

export default function MiCarnet() {
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { carnetInfo, loading, error } = useCarnetInfo();
    
    const [isFlipped, setIsFlipped] = useState(false);
    const flipAnimation = useRef(new Animated.Value(0)).current;

    const flipCard = () => {
        if (isFlipped) {
            Animated.spring(flipAnimation, {
                toValue: 0,
                friction: 8,
                tension: 10,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(flipAnimation, {
                toValue: 180,
                friction: 8,
                tension: 10,
                useNativeDriver: true,
            }).start();
        }
        setIsFlipped(!isFlipped);
    };

    const frontInterpolate = flipAnimation.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipAnimation.interpolate({
        inputRange: [0, 180],
        outputRange: ['180deg', '360deg'],
    });

    const frontAnimatedStyle = {
        transform: [{ rotateY: frontInterpolate }],
    };

    const backAnimatedStyle = {
        transform: [{ rotateY: backInterpolate }],
    };

    const getContractTypeText = (type: string) => {
        const types: Record<string, string> = {
            'full_time': 'Tiempo Completo',
            'part_time': 'Medio Tiempo',
            'contractor': 'Contratista',
        };
        return types[type] || type;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.header}>
                    <BackButton color={isDark ? '#fff' : '#000'} size={28} />
                    <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
                        Mi Carnet Digital
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>
                        Cargando carnet digital...
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
                        Mi Carnet Digital
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorContainer}>
                    <AlertError title="Error" message={error} />
                </View>
            </SafeAreaView>
        );
    }

    const tecnicoData = carnetInfo || {
        nombre: user?.name || 'Técnico Carini',
        rh: 'No especificado',
        especialidad: 'Técnico',
        foto: '',
        numero_carnet: user?.name || 'TC-000',
        fecha_expedicion: new Date().toISOString().split('T')[0],
        telefono: '',
        direccion: '',
        tipo_contrato: 'full_time',
    };

    const nombreParts = tecnicoData.nombre.split(' ');
    const primerNombre = nombreParts[0] || '';
    const apellidos = nombreParts.slice(1).join(' ') || '';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            <View style={styles.header}>
                <BackButton color={isDark ? '#fff' : '#000'} size={28} />
                <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
                    Mi Carnet Digital
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.instructionContainer}>
                    <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
                    <Text style={styles.instructionText}>
                        Toca el carnet para ver la información completa
                    </Text>
                </View>

                <View style={styles.carnetContainer}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={flipCard}
                        style={styles.carnetTouchable}
                    >
                        {/* Cara Frontal */}
                        <Animated.View
                            style={[
                                styles.carnetCard,
                                styles.carnetFront,
                                frontAnimatedStyle,
                            ]}
                        >
                            <LinearGradient
                                colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.gradientFront}
                            >
                                {/* Header con logo y número */}
                                <View style={styles.frontHeader}>
                                    <View style={styles.logoContainer}>
                                        <View style={styles.logoCircle}>
                                            <View style={styles.logoHalfCircle} />
                                            <View style={styles.logoWaves} />
                                        </View>
                                        <View style={styles.companyInfo}>
                                            <Text style={styles.companyName}>carini</Text>
                                            <Text style={styles.companySlogan}>Equipos para Lavandería</Text>
                                        </View>
                                    </View>
                                    <View style={styles.carnetBadge}>
                                        <Text style={styles.carnetBadgeText}>#{tecnicoData.numero_carnet}</Text>
                                    </View>
                                </View>

                                {/* Foto y nombre */}
                                <View style={styles.frontContent}>
                                    <View style={styles.photoContainer}>
                                        {tecnicoData.foto ? (
                                            <Image 
                                                source={{ uri: tecnicoData.foto }} 
                                                style={styles.photo}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={styles.photoPlaceholder}>
                                                <MaterialIcons name="person" size={50} color="#3B82F6" />
                                            </View>
                                        )}
                                        <View style={styles.photoBorder} />
                                    </View>
                                    
                                    <View style={styles.nameContainer}>
                                        <Text style={styles.firstName}>{primerNombre}</Text>
                                        <Text style={styles.lastName}>{apellidos}</Text>
                                        <View style={styles.specialtyContainer}>
                                            <MaterialIcons name="engineering" size={16} color="#3B82F6" />
                                            <Text style={styles.specialtyText}>{tecnicoData.especialidad}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Footer con cédula */}
                                <View style={styles.frontFooter}>
                                    <Text style={styles.cedulaLabel}>CEDULA DE CIUDADANÍA</Text>
                                    <Text style={styles.cedulaNumber}>{tecnicoData.numero_carnet}</Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>

                        {/* Cara Trasera */}
                        <Animated.View
                            style={[
                                styles.carnetCard,
                                styles.carnetBack,
                                backAnimatedStyle,
                            ]}
                        >
                            <LinearGradient
                                colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.gradientBack}
                            >
                                {/* Advertencia */}
                                <View style={styles.backWarning}>
                                    <Ionicons name="shield-checkmark" size={16} color="#F59E0B" />
                                    <Text style={styles.warningText}>
                                        ESTE CARNET ES PERSONAL E INTRANSFERIBLE
                                    </Text>
                                </View>

                                {/* Información médica */}
                                <View style={styles.backContent}>
                                    <View style={styles.rhSection}>
                                        <View style={styles.rhIconContainer}>
                                            <MaterialIcons name="bloodtype" size={24} color="#DC2626" />
                                        </View>
                                        <View style={styles.rhInfo}>
                                            <Text style={styles.rhLabel}>Tipo de Sangre</Text>
                                            <Text style={styles.rhValue}>{tecnicoData.rh}</Text>
                                        </View>
                                    </View>

                                    {/* Información de contacto */}
                                    {tecnicoData.telefono && (
                                        <View style={styles.infoRow}>
                                            <View style={styles.infoIcon}>
                                                <MaterialIcons name="phone" size={18} color="#3B82F6" />
                                            </View>
                                            <Text style={styles.infoText}>{tecnicoData.telefono}</Text>
                                        </View>
                                    )}

                                    <View style={styles.infoRow}>
                                        <View style={styles.infoIcon}>
                                            <MaterialIcons name="work" size={18} color="#3B82F6" />
                                        </View>
                                        <Text style={styles.infoText}>
                                            {getContractTypeText(tecnicoData.tipo_contrato)}
                                        </Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <View style={styles.infoIcon}>
                                            <MaterialIcons name="calendar-today" size={18} color="#3B82F6" />
                                        </View>
                                        <Text style={styles.infoText}>
                                            Desde: {formatDate(tecnicoData.fecha_expedicion)}
                                        </Text>
                                    </View>

                                    {/* Información de la empresa */}
                                    <View style={styles.companyDetails}>
                                        <View style={styles.companyHeader}>
                                            <View style={styles.companyLogoSmall}>
                                                <View style={styles.logoCircleSmall}>
                                                    <View style={styles.logoHalfCircleSmall} />
                                                </View>
                                            </View>
                                            <Text style={styles.companyNameBack}>CARINI S.A.S.</Text>
                                        </View>
                                        <View style={styles.companyContact}>
                                            <Text style={styles.companyAddress}>Calle 78 No. 69Q-41</Text>
                                            <Text style={styles.companyCity}>Bogotá, D. C. - Colombia</Text>
                                            <Text style={styles.companyPhone}>PBX.: 601 3653389</Text>
                                            <Text style={styles.companyEmail}>planta@carini.co</Text>
                                            <Text style={styles.companyWebsite}>www.carini.co</Text>
                                        </View>
                                    </View>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* Información Adicional */}
                <View style={[styles.additionalInfo, { backgroundColor: isDark ? '#1F2937' : '#fff' }]}>
                    <Text style={[styles.additionalTitle, { color: isDark ? '#fff' : '#000' }]}>
                        Información del Carnet
                    </Text>
                    
                    <View style={styles.infoList}>
                        <View style={styles.infoItem}>
                            <MaterialIcons name="security" size={24} color="#10B981" />
                            <View style={styles.infoItemText}>
                                <Text style={[styles.infoItemTitle, { color: isDark ? '#fff' : '#000' }]}>
                                    Carnet Digital Seguro
                                </Text>
                                <Text style={[styles.infoItemDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Verificado con tecnología blockchain
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
                                    Se actualiza automáticamente con cambios
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
        alignItems: 'center',
    },
    instructionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
    },
    instructionText: {
        fontSize: 14,
        color: '#1E40AF',
        fontWeight: '500',
    },
    carnetContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    carnetTouchable: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    },
    carnetCard: {
        position: 'absolute',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 20,
        backfaceVisibility: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    carnetFront: {
        backgroundColor: 'transparent',
    },
    carnetBack: {
        backgroundColor: 'transparent',
    },
    gradientFront: {
        flex: 1,
        borderRadius: 20,
        padding: 24,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    gradientBack: {
        flex: 1,
        borderRadius: 20,
        padding: 24,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    // Estilos cara frontal
    frontHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    logoCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#3B82F6',
        position: 'relative',
        overflow: 'hidden',
    },
    logoHalfCircle: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 25,
        height: 50,
        backgroundColor: '#1E40AF',
    },
    logoWaves: {
        position: 'absolute',
        right: 8,
        top: 8,
        width: 15,
        height: 34,
        borderLeftWidth: 2,
        borderLeftColor: '#fff',
        borderStyle: 'dashed',
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        letterSpacing: 1,
        marginBottom: 2,
    },
    companySlogan: {
        fontSize: 10,
        color: '#6B7280',
    },
    carnetBadge: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    carnetBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    frontContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    photoContainer: {
        position: 'relative',
        marginBottom: 24,
    },
    photo: {
        width: 130,
        height: 150,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 3,
        borderColor: '#3B82F6',
    },
    photoPlaceholder: {
        width: 130,
        height: 150,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#3B82F6',
    },
    photoBorder: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#DBEAFE',
    },
    nameContainer: {
        alignItems: 'center',
        width: '100%',
    },
    firstName: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
        textAlign: 'center',
    },
    lastName: {
        fontSize: 22,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
        textAlign: 'center',
    },
    specialtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    specialtyText: {
        fontSize: 12,
        color: '#1E40AF',
        fontWeight: '600',
        textAlign: 'center',
    },
    frontFooter: {
        alignItems: 'center',
        borderTopWidth: 2,
        borderTopColor: '#E5E7EB',
        paddingTop: 16,
    },
    cedulaLabel: {
        fontSize: 9,
        color: '#6B7280',
        marginBottom: 6,
        letterSpacing: 1,
        fontWeight: '600',
    },
    cedulaNumber: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1F2937',
        letterSpacing: 3,
    },
    // Estilos cara trasera
    backWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        padding: 14,
        borderRadius: 12,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
        gap: 8,
    },
    warningText: {
        flex: 1,
        fontSize: 10,
        color: '#92400E',
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    backContent: {
        flex: 1,
    },
    rhSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        gap: 12,
    },
    rhIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#DC2626',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rhInfo: {
        flex: 1,
    },
    rhLabel: {
        fontSize: 11,
        color: '#991B1B',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    rhValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#DC2626',
        letterSpacing: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 12,
    },
    infoIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    companyDetails: {
        marginTop: 'auto',
        paddingTop: 20,
        borderTopWidth: 2,
        borderTopColor: '#E5E7EB',
    },
    companyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        gap: 10,
    },
    companyLogoSmall: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoCircleSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3B82F6',
        position: 'relative',
        overflow: 'hidden',
    },
    logoHalfCircleSmall: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 16,
        height: 32,
        backgroundColor: '#1E40AF',
    },
    companyNameBack: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        letterSpacing: 1,
    },
    companyContact: {
        alignItems: 'center',
    },
    companyAddress: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 3,
        textAlign: 'center',
    },
    companyCity: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 3,
        textAlign: 'center',
    },
    companyPhone: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 3,
        textAlign: 'center',
    },
    companyEmail: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 3,
        textAlign: 'center',
    },
    companyWebsite: {
        fontSize: 11,
        color: '#3B82F6',
        fontWeight: '600',
        textAlign: 'center',
    },
    additionalInfo: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        width: '100%',
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
