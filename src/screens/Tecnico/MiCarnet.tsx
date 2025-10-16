import React from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import BackButton from '../../components/BackButton';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useCarnetInfo } from '../../hooks/useMe';
import AlertError from '../../components/AlertError';

const { width, height } = Dimensions.get('window');

export default function MiCarnet() {
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { carnetInfo, loading, error } = useCarnetInfo();

    // Mostrar loading
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

    // Mostrar error
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

    // Datos por defecto si no hay información
    const tecnicoData = carnetInfo || {
        nombre: user?.name || 'Técnico Carini',
        rh: 'No especificado',
        especialidad: 'Técnico',
        foto: '',
        numero_carnet: 'TC-000',
        fecha_expedicion: new Date().toISOString().split('T')[0],
        vigencia: new Date().toISOString().split('T')[0]
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
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
                {/* Carnet Digital */}
                <View style={styles.carnetContainer}>
                    <LinearGradient
                        colors={['#1E40AF', '#3B82F6', '#60A5FA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.carnetCard}
                    >
                        {/* Header del Carnet */}
                        <View style={styles.carnetHeader}>
                            <View style={styles.logoContainer}>
                                <View style={styles.logoCircle}>
                                    <Text style={styles.logoText}>C</Text>
                                </View>
                                <Text style={styles.companyName}>CARINI</Text>
                            </View>
                            <View style={styles.carnetNumber}>
                                <Text style={styles.carnetNumberText}>#{tecnicoData.numero_carnet}</Text>
                            </View>
                        </View>

                        {/* Foto y Info Principal */}
                        <View style={styles.mainInfo}>
                            <View style={styles.photoContainer}>
                                {tecnicoData.foto ? (
                                    <Image 
                                        source={{ uri: tecnicoData.foto }} 
                                        style={styles.photo}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <MaterialIcons name="person" size={40} color="#3B82F6" />
                                    </View>
                                )}
                            </View>
                            
                            <View style={styles.infoContainer}>
                                <Text style={styles.nameText}>{tecnicoData.nombre}</Text>
                                <Text style={styles.roleText}>TÉCNICO ESPECIALIZADO</Text>
                            </View>
                        </View>

                        {/* Detalles del Técnico */}
                        <View style={styles.detailsContainer}>
                            <View style={styles.detailRow}>
                                <View style={styles.detailIcon}>
                                    <MaterialIcons name="bloodtype" size={20} color="#fff" />
                                </View>
                                <Text style={styles.detailLabel}>RH:</Text>
                                <Text style={styles.detailValue}>{tecnicoData.rh}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <View style={styles.detailIcon}>
                                    <MaterialIcons name="engineering" size={20} color="#fff" />
                                </View>
                                <Text style={styles.detailLabel}>Especialidad:</Text>
                                <Text style={styles.detailValue}>{tecnicoData.especialidad}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <View style={styles.detailIcon}>
                                    <MaterialIcons name="calendar-today" size={20} color="#fff" />
                                </View>
                                <Text style={styles.detailLabel}>Fecha de Contratación:</Text>
                                <Text style={styles.detailValue}>{tecnicoData.fecha_expedicion}</Text>
                            </View>

                        
                        </View>

                        {/* Footer del Carnet */}
                        <View style={styles.carnetFooter}>
                            <Text style={styles.footerText}>
                                Este carnet es válido únicamente para actividades laborales autorizadas
                            </Text>
                        </View>
                    </LinearGradient>
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
    },
    carnetContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    carnetCard: {
        width: width * 0.9,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    carnetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E40AF',
    },
    companyName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
    },
    carnetNumber: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    carnetNumberText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    mainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    photoContainer: {
        marginRight: 20,
    },
    photo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
    },
    photoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        flex: 1,
    },
    nameText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    roleText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
        letterSpacing: 1,
    },
    detailsContainer: {
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
        marginRight: 8,
        minWidth: 80,
    },
    detailValue: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
        flex: 1,
    },
    carnetFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
        paddingTop: 16,
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 16,
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
