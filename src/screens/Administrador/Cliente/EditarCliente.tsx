import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, StatusBar, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCliente } from '../../../hooks/cliente/useCliente';
import ClienteForm from '../../../components/Cliente/ClienteForm';
import BackButton from '../../../components/BackButton';
import { ClienteFormValues } from '../../../types/cliente/cliente';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
    EditarCliente: { id: number };
    DetalleCliente: { id: number };
    ClienteList: undefined;
};

type RouteParams = { id: number };

const showError = (error: any, defaultMessage: string) => {
    const message = error?.response?.data?.message || error?.message || defaultMessage;
    Alert.alert('Error', message);
};

export default function EditarCliente() {
    const route = useRoute<RouteProp<RootStackParamList, 'EditarCliente'>>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { id } = route.params;
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { cliente, loading, error, updateCliente } = useCliente(id);

    const handleSubmit = async (values: ClienteFormValues) => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        
        try {
            const payload = {
                name: values.name.trim(),
                identifier: values.identifier.trim(),
                email: values.email && values.email.trim() ? values.email.trim() : null,
                client_type: values.client_type,
                document_type: values.document_type,
                city: values.city.trim(),
                department: values.department.trim(),
                address: values.address.trim(),
                phone: values.phone.trim(),
                legal_representative: values.legal_representative && values.legal_representative.trim() 
                    ? values.legal_representative.trim() 
                    : null,
                contacts: values.contacts.map((c) => ({
                    nombre_contacto: c.nombre_contacto.trim(),
                    correo: c.correo.trim(),
                    telefono: c.telefono.trim(),
                    direccion: c.direccion.trim(),
                    cargo: c.cargo.trim(),
                })),
            };

            await updateCliente(payload);

            Alert.alert(
                '¡Cliente Actualizado!', 
                `Los datos de ${values.name} han sido actualizados correctamente.`,
                [
                    {
                        text: 'Ver Detalle',
                        style: 'default',
                        onPress: () => {
                            navigation.replace('DetalleCliente', { id });
                        },
                    },
                    {
                        text: 'Ir a Lista',
                        style: 'default',
                        onPress: () => {
                            navigation.navigate('ClienteList');
                        },
                    },
                    {
                        text: 'Continuar Editando',
                        style: 'cancel',
                        onPress: () => {
                            // Se queda en la misma pantalla
                        },
                    },
                ],
                { cancelable: false }
            );
        } catch (error: any) {
            console.error('Error actualizando cliente:', error);
            showError(error, 'No se pudo actualizar el cliente. Inténtalo nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetry = () => {
        // Recargar la pantalla
        navigation.replace('EditarCliente', { id });
    };

    // Estados de carga y error mejorados
    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar backgroundColor="#667eea" barStyle="light-content" />
                
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <BackButton 
                            color="#fff" 
                            size={26}
                            style={styles.backButton}
                            label="Atrás"
                        />
                    </View>
                    <View style={styles.headerContent}>
                        <View style={styles.headerIconContainer}>
                            <Ionicons name="create" size={32} color="#fff" />
                        </View>
                        <Text style={styles.headerTitle}>Editar Cliente</Text>
                        <Text style={styles.headerSubtitle}>Cargando información...</Text>
                    </View>
                </View>

                <View style={styles.loadingContainer}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color="#667eea" />
                        <Text style={styles.loadingText}>Cargando datos del cliente</Text>
                        <Text style={styles.loadingSubtext}>Esto puede tomar unos segundos</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !cliente) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar backgroundColor="#667eea" barStyle="light-content" />
                
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <BackButton 
                            color="#fff" 
                            size={26}
                            style={styles.backButton}
                            label="Atrás"
                        />
                    </View>
                    <View style={styles.headerContent}>
                        <View style={[styles.headerIconContainer, styles.errorIconContainer]}>
                            <Ionicons name="alert-circle" size={32} color="#fff" />
                        </View>
                        <Text style={styles.headerTitle}>Error</Text>
                        <Text style={styles.headerSubtitle}>No se pudo cargar el cliente</Text>
                    </View>
                </View>

                <View style={styles.errorContainer}>
                    <View style={styles.errorContent}>
                        <Ionicons name="warning-outline" size={64} color="#EF4444" />
                        <Text style={styles.errorTitle}>
                            {!cliente ? 'Cliente no encontrado' : 'Error de conexión'}
                        </Text>
                        <Text style={styles.errorText}>
                            {error || 'El cliente que buscas no existe o ha sido eliminado.'}
                        </Text>
                        
                        <View style={styles.errorActions}>
                            <TouchableOpacity 
                                style={styles.retryButton}
                                onPress={handleRetry}
                            >
                                <Ionicons name="refresh" size={20} color="#fff" />
                                <Text style={styles.retryButtonText}>Reintentar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.goBackButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.goBackButtonText}>Ir Atrás</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const initialValues: ClienteFormValues = {
        name: cliente.name || '',
        identifier: cliente.identifier || '',
        email: cliente.user?.email || '',
        client_type: cliente.client_type || 'Natural',
        document_type: cliente.document_type || 'CC',
        city: cliente.city || '',
        department: cliente.department || '',
        address: cliente.address || '',
        phone: cliente.phone || '',
        legal_representative: cliente.legal_representative || '',
        contacts: cliente.contacts?.map(contact => ({
            nombre_contacto: contact.nombre_contacto,
            correo: contact.correo,
            telefono: contact.telefono,
            direccion: contact.direccion,
            cargo: contact.cargo,
        })) || [],
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#667eea" barStyle="light-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <BackButton 
                        color="#fff" 
                        size={26}
                        style={styles.backButton}
                        label="Atrás"
                        accessibilityLabel="Regresar a la pantalla anterior"
                    />
                </View>
                
                <View style={styles.headerContent}>
                    <View style={styles.headerIconContainer}>
                        <Ionicons name="create" size={32} color="#fff" />
                    </View>
                    <Text style={styles.headerTitle}>Editar Cliente</Text>
                    <Text style={styles.headerSubtitle}>
                        Modifica la información de {cliente.name}
                    </Text>
                </View>
            </View>

            {/* Formulario */}
            <View style={styles.formContainer}>
                <ClienteForm
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                    submitLabel="Actualizar Cliente"
                />
            </View>

            {/* Indicador de progreso */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressDot, styles.progressDotInactive]} />
                <View style={styles.progressDot} />
                <View style={[styles.progressDot, styles.progressDotInactive]} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#667eea',
    },
    header: {
        backgroundColor: '#667eea',
        paddingHorizontal: 20,
        paddingBottom: 25,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 15,
    },
    backButton: {
        paddingTop: 0,
    },
    headerContent: {
        alignItems: 'center',
        paddingBottom: 10,
    },
    headerIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    errorIconContainer: {
        backgroundColor: 'rgba(239,68,68,0.2)',
        borderColor: 'rgba(239,68,68,0.3)',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    formContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        marginTop: -15,
        paddingTop: 5,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        marginTop: -15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContent: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
    loadingSubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    errorContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        marginTop: -15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContent: {
        alignItems: 'center',
        paddingHorizontal: 32,
        maxWidth: 320,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#374151',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 12,
    },
    errorText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    errorActions: {
        width: '100%',
        gap: 12,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#667eea',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    goBackButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    goBackButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '500',
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        backgroundColor: '#F8FAFC',
        gap: 8,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#667eea',
    },
    progressDotInactive: {
        backgroundColor: '#E5E7EB',
    },
});