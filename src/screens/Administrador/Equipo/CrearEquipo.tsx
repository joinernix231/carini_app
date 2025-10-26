import React from 'react';
import { View, StyleSheet, Alert, StatusBar, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEquipos } from '../../../hooks/equipo/useEquipos';
import EquipoForm from '../../../components/Equipo/EquipoForm';
import { EquipoFormValues } from '../../../types/equipo/equipo';
import { useError } from '../../../context/ErrorContext';
import BackButton from '../../../components/BackButton';

type RootStackParamList = {
    CrearEquipo: undefined;
    DetalleEquipoAdmin: { id: number };
    EquipoList: undefined;
};

const initialValues: EquipoFormValues = {
    model: '',
    brand: '',
    description: '',
    type: '',
    photo: null,
    PDF: null,
};

export default function CrearEquipo() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { addEquipo } = useEquipos();
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

            const created = await addEquipo(payload);

            Alert.alert('Éxito', 'Equipo creado correctamente', [
                {
                    text: 'Ver detalle',
                    onPress: () => {
                        navigation.replace('DetalleEquipoAdmin', { id: created.id });
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
            // Error log removed
            showError(error, 'No se pudo crear el equipo');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
            
            <View style={styles.header}>
                <BackButton color="#fff" />
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Crear Equipo</Text>
                </View>
            </View>

            <EquipoForm
                initialValues={initialValues}
                onSubmit={handleSubmit}
                submitLabel="Crear Equipo"
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
});
