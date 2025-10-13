import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useClientes } from '../../../hooks/cliente/useClientes';
import ClienteForm from '../../../components/Cliente/ClienteForm';
import BackButton from '../../../components/BackButton';
import { ClienteFormValues } from '../../../types/cliente/cliente';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useError } from '../../../context/ErrorContext';


type RootStackParamList = {
    CrearCliente: undefined;
    DetalleCliente: { id: number };
    ClienteList: undefined;
};

const initialValues: ClienteFormValues = {
    name: '',
    identifier: '',
    email: '',
    client_type: 'Natural',
    document_type: 'CC',
    city: '',
    department: '',
    address: '',
    phone: '',
    legal_representative: '',
    contacts: [],
};

export default function CrearCliente() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { addCliente } = useClientes();
    const { showError } = useError();
    const [isSubmitting, setIsSubmitting] = useState(false);

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

            const created = await addCliente(payload);

            // Mostrar mensaje de éxito con opciones
            Alert.alert(
                '¡Cliente Creado!', 
                `${values.name} ha sido registrado exitosamente.`,
                [
                    {
                        text: 'Ver Detalle',
                        style: 'default',
                        onPress: () => {
                            navigation.replace('DetalleCliente', { id: created.id });
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
                        text: 'Crear Otro',
                        style: 'cancel',
                        onPress: () => {
                            // Se queda en la misma pantalla para crear otro cliente
                        },
                    },
                ],
                { cancelable: false }
            );
        } catch (error: any) {
            console.error('Error creando cliente:', error);
            showError(error, 'No se pudo crear el cliente. Inténtalo nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#667eea" barStyle="light-content" />
            
            {/* Header con gradiente y back button */}
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
                        <Ionicons name="person-add" size={32} color="#fff" />
                    </View>
                    <Text style={styles.headerTitle}>Nuevo Cliente</Text>
                    <Text style={styles.headerSubtitle}>
                        Complete la información para registrar un nuevo cliente
                    </Text>
                </View>
            </View>

            {/* Formulario */}
            <View style={styles.formContainer}>
                <ClienteForm
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                    submitLabel="Crear Cliente"
                />
            </View>

            {/* Indicador de progreso sutil */}
            <View style={styles.progressContainer}>
                <View style={styles.progressDot} />
                <View style={[styles.progressDot, styles.progressDotInactive]} />
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