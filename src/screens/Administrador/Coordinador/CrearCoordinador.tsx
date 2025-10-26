import React from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCoordinadores } from '../../../hooks/coordinador/useCoordinadores';
import CoordinadorForm from '../../../components/Coordinador/CoordinadorForm';
import { CreateCoordinadorPayload } from '../../../services/CoordinadorService';
import { useError } from '../../../context/ErrorContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';

type RootStackParamList = {
    DetalleCoordinador: { id: number };
    CoordinadorList: undefined;
};

const initialValues: CreateCoordinadorPayload = {
    name: '',
    identification: '',
    email: null,
    phone: null,
    address: null,
};

export default function CrearCoordinador() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { addCoordinador } = useCoordinadores();
    const { showError } = useError();

    const handleSubmit = async (values: CreateCoordinadorPayload) => {
        try {
            const payload = {
                name: values.name.trim(),
                identification: values.identification.trim(),
                email: values.email && values.email.trim() ? values.email.trim() : null,
                phone: values.phone && values.phone.trim() ? values.phone.trim() : null,
                address: values.address && values.address.trim() ? values.address.trim() : null,
            };

            const created = await addCoordinador(payload);

            Alert.alert('Éxito', 'Coordinador creado correctamente', [
                {
                    text: 'Ver detalle',
                    onPress: () => {
                        navigation.replace('DetalleCoordinador', { id: created.id });
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
            // Error log removed
            showError(error, 'Error al crear el coordinador');
        }
    };

    return (
        
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />

            <View style={styles.header}>
                <BackButton color="#fff" />
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Crear Coordinador</Text>
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
                    submitLabel="Crear Coordinador"
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFB',
        padding: 16,
    },
});


