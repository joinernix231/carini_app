// src/screens/Administrador/Tecnico/EditarTecnico.tsx
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StatusBar,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import BackButton from '../../../components/BackButton';
import TecnicoForm from '../../../components/Tecnico/TecnicoForm';
import { useAuth } from '../../../context/AuthContext';
import { TecnicoService, CreateTecnicoPayload } from '../../../services/TecnicoService';
import { Tecnico } from '../../../types/tecnico/tecnico';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
    TecnicoList: undefined;
    DetalleTecnico: { id: number };
    EditarTecnico: { id: number };
};

type EditarTecnicoRouteProp = RouteProp<RootStackParamList, 'EditarTecnico'>;

export default function EditarTecnico() {
    const { token } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<EditarTecnicoRouteProp>();

    const { id } = route.params;

    const [loading, setLoading] = useState(true);
    const [tecnico, setTecnico] = useState<Tecnico | null>(null);
    const [user, setUser] = useState<any>(null);
    const [updatingDocs, setUpdatingDocs] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);
    const [epsPdf, setEpsPdf] = useState<string | null>(null);
    const [arlPdf, setArlPdf] = useState<string | null>(null);
    const [pensionPdf, setPensionPdf] = useState<string | null>(null);

    useEffect(() => {
        const fetchTecnico = async () => {
            try {
                if (!token) return;
                const data = await TecnicoService.getOne(id, token);
                // El servicio devuelve el técnico con datos del usuario
                setTecnico(data);
                setUser((data as any).user || data); // Ajustar según la estructura real
                // Inicializar estados de documentos
                setPhoto(data.photo || null);
                setEpsPdf(data.eps_pdf || null);
                setArlPdf(data.arl_pdf || null);
                setPensionPdf(data.pension_pdf || null);
            } catch (err: any) {
                console.error('Error cargando técnico:', err);
                Alert.alert('Error', 'No se pudo cargar el técnico');
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };

        fetchTecnico();
    }, [id, token, navigation]);

    const handleUpdate = async (values: CreateTecnicoPayload) => {
        if (!token) return;
        try {
            const updated = await TecnicoService.update(id, values, token);
            Alert.alert('Éxito', 'Técnico actualizado correctamente', [
                { text: 'OK', onPress: () => navigation.replace('DetalleTecnico', { id: updated.id }) },
            ]);
        } catch (err: any) {
            console.error('Error actualizando técnico:', err);
            Alert.alert('Error', err?.response?.data?.message || 'No se pudo actualizar el técnico');
        }
    };

    const updateField = async (payload: Parameters<typeof TecnicoService.update>[1]) => {
        if (!token) return;
        try {
            setUpdatingDocs(true);
            await TecnicoService.update(id, payload, token);
        } catch (err: any) {
            console.error('Error actualizando documento/foto:', err);
            Alert.alert('Error', 'No se pudo actualizar el documento/foto');
        } finally {
            setUpdatingDocs(false);
        }
    };

    const handlePhotoUploaded = (photoUrl: string) => {
        setPhoto(photoUrl);
        updateField({ photo: photoUrl });
    };

    const handleEpsUploaded = (epsUrl: string) => {
        setEpsPdf(epsUrl);
        updateField({ eps_pdf: epsUrl });
    };

    const handleArlUploaded = (arlUrl: string) => {
        setArlPdf(arlUrl);
        updateField({ arl_pdf: arlUrl });
    };

    const handlePensionUploaded = (pensionUrl: string) => {
        setPensionPdf(pensionUrl);
        updateField({ pension_pdf: pensionUrl });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    if (!tecnico) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{ marginTop: 50, textAlign: 'center' }}>No se encontró el técnico</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <ScrollView contentContainerStyle={styles.content}>
                <BackButton style={{ marginBottom: 10 }} color="#000" size={24} />
                <Text style={styles.title}>Editar técnico</Text>
                <Text style={styles.subtitle}>Modifica la información y guarda los cambios</Text>

                <TecnicoForm
                    initialValues={{
                        name: user?.name ?? '',
                        document: tecnico?.document ?? '',
                        email: user?.email ?? null,
                        phone: tecnico?.phone ?? null,
                        address: tecnico?.address ?? null,
                        specialty: tecnico?.specialty ?? '',
                        blood_type: tecnico?.blood_type ?? null,
                        hire_date: tecnico?.hire_date ?? '',
                        contract_type: (tecnico?.contract_type as any) ?? 'full_time',
                    }}
                    onSubmit={handleUpdate}
                    submitLabel="Actualizar técnico"
                    showDocumentUploaders={true}
                    onPhotoUploaded={handlePhotoUploaded}
                    onEpsUploaded={handleEpsUploaded}
                    onArlUploaded={handleArlUploaded}
                    onPensionUploaded={handlePensionUploaded}
                    initialPhoto={photo}
                    initialEps={epsPdf}
                    initialArl={arlPdf}
                    initialPension={pensionPdf}
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
