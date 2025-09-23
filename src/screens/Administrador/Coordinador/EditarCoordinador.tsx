import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';
import { useCoordinador } from '../../../hooks/coordinador/useCoordinador';
import CoordinadorForm from '../../../components/Coordinador/CoordinadorForm';
import { CreateCoordinadorPayload } from '../../../services/CoordinadorService';
import { useError } from '../../../context/ErrorContext';
import {NativeStackNavigationProp} from "@react-navigation/native-stack";

type RootStackParamList = {
    DetalleCoordinador: { id: number };
    CoordinadorList: undefined;
};

type RouteParams = {
    id: number;
};

export default function EditarCoordinador() {
    const route = useRoute();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { id } = route.params as RouteParams;

    const {
        coordinador,
        loading,
        error,
        fetchCoordinador,
        updateCoordinador,
    } = useCoordinador(id);

    const { showError } = useError();

    const handleSubmit = useCallback(async (values: CreateCoordinadorPayload) => {
        try {
            const payload = {
                name: values.name.trim(),
                identification: values.identification.trim(),
                email: values.email && values.email.trim() ? values.email.trim() : null,
                phone: values.phone && values.phone.trim() ? values.phone.trim() : null,
                address: values.address && values.address.trim() ? values.address.trim() : null,
            };

            await updateCoordinador(payload);

            Alert.alert('Éxito', 'Coordinador actualizado correctamente', [
                {
                    text: 'Ver detalle',
                    onPress: () => {
                        navigation.replace('DetalleCoordinador', { id });
                    },
                },
                {
                    text: 'Lista',
                    onPress: () => {
                        navigation.navigate('CoordinadorList');
                    },
                },
            ]);
        } catch (error: any) {
            console.error('Error actualizando coordinador:', error);
            showError(error, 'Error al actualizar el coordinador');
        }
    }, [id, updateCoordinador, navigation, showError]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0EA5E9" />
                    <Text style={styles.loadingText}>Cargando coordinador...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!coordinador && !loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color="#EF4444" />
                    <Text style={styles.errorTitle}>Coordinador no encontrado</Text>
                    <Text style={styles.errorText}>{error ?? 'No se pudo cargar la información.'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchCoordinador()}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const initialValues: CreateCoordinadorPayload = {
        name: coordinador?.name || coordinador?.user?.name || '',
        identification: coordinador?.identification || '',
        email: coordinador?.email || coordinador?.user?.email || null,
        phone: coordinador?.phone || null,
        address: coordinador?.address || null,
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />

            <View style={styles.header}>
                <BackButton color="#fff" />
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Editar Coordinador</Text>
                    <Text style={styles.subtitle}>{coordinador?.name || coordinador?.user?.name}</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <CoordinadorForm
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                    submitLabel="Actualizar Coordinador"
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFB' },
    header: { 
        paddingTop: 12, 
        paddingBottom: 18, 
        paddingHorizontal: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#0EA5E9' 
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerActions: { width: 44, alignItems: 'flex-end' },
    title: { color: '#fff', fontSize: 20, fontWeight: '700', top: 15 },
    subtitle: { color: 'rgba(255,255,255,0.95)', marginTop: 4, fontSize: 14 },
    scrollContainer: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 8, color: '#6B7280' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    errorTitle: { marginTop: 12, fontSize: 18, fontWeight: '700' },
    errorText: { color: '#6B7280', marginTop: 8, textAlign: 'center' },
    retryButton: { marginTop: 16, backgroundColor: '#0EA5E9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontWeight: '700' },
});


