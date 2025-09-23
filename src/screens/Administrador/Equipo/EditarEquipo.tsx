import React, { useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, StatusBar } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEquipo } from '../../../hooks/equipo/useEquipo';
import EquipoForm from '../../../components/Equipo/EquipoForm';
import { EquipoFormValues } from '../../../types/equipo/equipo';
import { useError } from '../../../context/ErrorContext';
import BackButton from '../../../components/BackButton';

type RootStackParamList = {
    EditarEquipo: { id: number };
    DetalleEquipoAdmin: { id: number };
    EquipoList: undefined;
};

type RouteParams = { id: number };

export default function EditarEquipo() {
    const route = useRoute<RouteProp<RootStackParamList, 'EditarEquipo'>>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { id } = route.params;
    
    const { equipo, loading, error, updateEquipo } = useEquipo(id);
    const { showError } = useError();

    const handleSubmit = async (values: EquipoFormValues) => {
        try {
            const payload = {
                model: values.model.trim(),
                brand: values.brand.trim(),
                description: values.description && values.description.trim() ? values.description.trim() : null,
                type: values.type && values.type.trim() ? values.type.trim() : null,
                photo: values.photo,
                PDF: values.PDF,
            };

            await updateEquipo(payload);

            Alert.alert('Éxito', 'Equipo actualizado correctamente', [
                {
                    text: 'Ver detalle',
                    onPress: () => {
                        navigation.replace('DetalleEquipoAdmin', { id });
                    },
                },
                {
                    text: 'Lista',
                    onPress: () => {
                        navigation.navigate('EquipoList');
                    },
                },
            ]);
        } catch (error: any) {
            console.error('Error actualizando equipo:', error);
            showError(error, 'No se pudo actualizar el equipo');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
                <View style={styles.header}>
                    <BackButton color="#fff" />
                    <View style={styles.headerCenter}>
                        <Text style={styles.title}>Editar Equipo</Text>
                    </View>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Cargando equipo...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
                <View style={styles.header}>
                    <BackButton color="#fff" />
                    <View style={styles.headerCenter}>
                        <Text style={styles.title}>Editar Equipo</Text>
                    </View>
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!equipo) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
                <View style={styles.header}>
                    <BackButton color="#fff" />
                    <View style={styles.headerCenter}>
                        <Text style={styles.title}>Editar Equipo</Text>
                    </View>
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Equipo no encontrado</Text>
                </View>
            </SafeAreaView>
        );
    }

    const initialValues: EquipoFormValues = {
        model: equipo.model || '',
        brand: equipo.brand || '',
        description: equipo.description || '',
        type: equipo.type || '',
        photo: equipo.photo || null,
        PDF: equipo.PDF || null,
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
            
            <View style={styles.header}>
                <BackButton color="#fff" />
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Editar Equipo</Text>
                </View>
            </View>

            <EquipoForm
                initialValues={initialValues}
                onSubmit={handleSubmit}
                submitLabel="Actualizar Equipo"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingTop: 12,
        paddingBottom: 18,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 32,
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
    },
});
