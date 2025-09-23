// src/screens/Administrador/Tecnico/CrearTecnico.tsx
import React from 'react';
import {ScrollView, StatusBar, Text, StyleSheet, Alert } from 'react-native';
import BackButton from '../../../components/BackButton';
import TecnicoForm from '../../../components/Tecnico/TecnicoForm';
import { useAuth } from '../../../context/AuthContext';
import { TecnicoService, CreateTecnicoPayload } from '../../../services/TecnicoService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
    TecnicoList: undefined;
    DetalleTecnico: { id: number };
};

export default function CrearTecnico() {
    const { token } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const handleCreate = async (values: CreateTecnicoPayload) => {
        if (!token) return;
        try {
            const created = await TecnicoService.create(values, token);
            Alert.alert('Éxito', 'Técnico creado correctamente', [
                { text: 'OK', onPress: () => navigation.replace('DetalleTecnico', { id: created.id }) },
            ]);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'No se pudo crear el técnico');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <ScrollView contentContainerStyle={styles.content}>
                <BackButton style={{ marginBottom: 10 }} color="#000" size={24} />
                <Text style={styles.title}>Crear técnico</Text>
                <Text style={styles.subtitle}>Completa la información para registrar un nuevo técnico</Text>

                <TecnicoForm
                    initialValues={{ name: '', document: '', email: null, phone: null, address: null }}
                    onSubmit={handleCreate}
                    submitLabel="Crear técnico"
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: '800', color: '#000', marginTop: 10 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 16, fontWeight: '500' },
});
