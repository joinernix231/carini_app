import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { EquipoFormValues, CreateEquipoPayload } from '../../types/equipo/equipo';
import BackButton from '../BackButton';
import ImageUploader from '../ImageUploader';
import DocumentUploader from '../DocumentUploader';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';

type Props = {
    initialValues: EquipoFormValues;
    onSubmit: (values: EquipoFormValues) => Promise<void>;
    submitLabel?: string;
};

const validationSchema = Yup.object().shape({
    model: Yup.string().trim().required('Modelo es requerido'),
    brand: Yup.string().trim().required('Marca es requerida'),
    type: Yup.string().required('Tipo de equipo es requerido'),
    description: Yup.string().trim().notRequired(),
});

const equipmentTypes = [
    {
        id: 'lavadora',
        name: 'Lavadora',
        icon: 'water-outline',
        color: '#3B82F6',
        backgroundColor: '#EFF6FF'
    },
    {
        id: 'secadora',
        name: 'Secadora',
        icon: 'flame-outline',
        color: '#DC2626',
        backgroundColor: '#FEF2F2'
    }
];

export default function EquipoForm({ initialValues, onSubmit, submitLabel = 'Agregar al catálogo' }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Hooks para imagen
    const {
        imageUri,
        uploading: imageUploading,
        error: imageError,
        pickImage,
        takePhoto,
        uploadImage,
        clearImage,
        setImageUri
    } = useImageUpload({
        aspect: [1, 1],
        quality: 0.8,
        allowsEditing: true,
    });

    // Hooks para documento
    const {
        documentUri,
        documentName,
        uploading: documentUploading,
        error: documentError,
        pickDocument,
        uploadDocument,
        clearDocument,
        setDocument
    } = useDocumentUpload({
        type: 'application/pdf',
        copyToCacheDirectory: true,
    });

    // Estados para las URLs finales subidas
    const [uploadedImageName, setUploadedImageName] = useState<string | null>(initialValues.photo || null);
    const [uploadedDocumentUrl, setUploadedDocumentUrl] = useState<string | null>(initialValues.PDF || null);

    useEffect(() => {
        if (initialValues.photo) {
            setImageUri(initialValues.photo);
            setUploadedImageName(initialValues.photo);
        }
        if (initialValues.PDF) {
            setDocument(initialValues.PDF, 'manual.pdf');
            setUploadedDocumentUrl(initialValues.PDF);
        }
    }, [initialValues, setImageUri, setDocument]);

    const handleImagePick = async () => {
        const uri = await pickImage();
        if (uri) {
            const imageName = await uploadImage(uri);
            if (imageName) {
                setUploadedImageName(imageName);
            }
        }
    };

    const handleTakePhoto = async () => {
        const uri = await takePhoto();
        if (uri) {
            const imageName = await uploadImage(uri);
            if (imageName) {
                setUploadedImageName(imageName);
            }
        }
    };

    const handleDocumentPick = async () => {
        const result = await pickDocument();
        if (result) {
            const documentUrl = await uploadDocument(result.uri, result.name);
            if (documentUrl) {
                setUploadedDocumentUrl(documentUrl);
            }
        }
    };

    const handleSubmit = async (values: EquipoFormValues) => {
        try {
            setIsSubmitting(true);

            const payload: CreateEquipoPayload = {
                model: values.model.trim(),
                brand: values.brand.trim(),
                type: values.type,
                description: values.description && values.description.trim() ? values.description.trim() : null,
                photo: uploadedImageName || null,
                PDF: uploadedDocumentUrl || null,
            };

            await onSubmit({ ...values, photo: uploadedImageName, PDF: uploadedDocumentUrl });
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
        >
            {(formik) => (
                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    {/* BackButton con espaciado superior */}
                    <View style={styles.backButtonContainer}>
                        <BackButton />
                    </View>

                    <View style={styles.headerCard}>
                        <View style={styles.headerContent}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="storefront-outline" size={24} color="#059669" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Nuevo Equipo</Text>
                                <Text style={styles.headerSubtitle}>Agrega un modelo al catálogo</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Tipo de Equipo*</Text>
                        <View style={styles.typeSelector}>
                            {equipmentTypes.map((equipment) => (
                                <TouchableOpacity
                                    key={equipment.id}
                                    style={[
                                        styles.typeOption,
                                        formik.values.type === equipment.id && [
                                            styles.typeOptionSelected,
                                            { backgroundColor: equipment.backgroundColor }
                                        ]
                                    ]}
                                    onPress={() => formik.setFieldValue('type', equipment.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.typeIconContainer,
                                        formik.values.type === equipment.id && { backgroundColor: equipment.color }
                                    ]}>
                                        <Ionicons 
                                            name={equipment.icon as any} 
                                            size={24} 
                                            color={formik.values.type === equipment.id ? '#ffffff' : equipment.color}
                                        />
                                    </View>
                                    <Text style={[
                                        styles.typeName,
                                        formik.values.type === equipment.id && { 
                                            color: equipment.color,
                                            fontWeight: '700'
                                        }
                                    ]}>
                                        {equipment.name}
                                    </Text>
                                    {formik.values.type === equipment.id && (
                                        <Ionicons name="checkmark-circle" size={20} color={equipment.color} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                        {formik.touched.type && formik.errors.type && (
                            <Text style={styles.errorText}>{formik.errors.type}</Text>
                        )}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Información del Equipo</Text>

                        <Text style={styles.label}>Marca*</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Carini"
                            value={formik.values.brand}
                            onChangeText={(t) => formik.setFieldValue('brand', t)}
                            onBlur={() => formik.setFieldTouched('brand')}
                        />
                        {formik.touched.brand && formik.errors.brand && (
                            <Text style={styles.errorText}>{formik.errors.brand}</Text>
                        )}

                        <Text style={styles.label}>Modelo*</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: WF45K6200AW, DLGX3901W, WTW5000DW"
                            value={formik.values.model}
                            onChangeText={(t) => formik.setFieldValue('model', t)}
                            onBlur={() => formik.setFieldTouched('model')}
                        />
                        {formik.touched.model && formik.errors.model && (
                            <Text style={styles.errorText}>{formik.errors.model}</Text>
                        )}

                        <Text style={styles.label}>Descripción</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Capacidad, características especiales, eficiencia energética..."
                            value={formik.values.description}
                            onChangeText={(t) => formik.setFieldValue('description', t)}
                            onBlur={() => formik.setFieldTouched('description')}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.card}>
                        <ImageUploader
                            title="Imagen del Equipo"
                            onImageUploaded={(imageName) => setUploadedImageName(imageName)}
                            imageName="devices/equipo"
                        />
                    </View>

                    <View style={styles.card}>
                        <DocumentUploader
                            title="Manual del Equipo"
                            onDocumentUploaded={(url) => setUploadedDocumentUrl(url)}
                            customDocumentName="manual_equipo"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && { opacity: 0.8 }]}
                        onPress={formik.handleSubmit as any}
                        disabled={isSubmitting}
                        activeOpacity={0.9}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                                <Text style={styles.submitText}>{submitLabel}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}
        </Formik>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 20,
    },
    backButtonContainer: {
        marginTop: 20,
        marginBottom: 10,
    },
    headerCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 20,
    },
    typeSelector: {
        gap: 16,
    },
    typeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        gap: 16,
    },
    typeOptionSelected: {
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeName: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
    },
    label: {
        fontSize: 16,
        color: '#374151',
        marginTop: 20,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        marginTop: 8,
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: '#059669',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 12,
        marginBottom: 40,
        elevation: 3,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});