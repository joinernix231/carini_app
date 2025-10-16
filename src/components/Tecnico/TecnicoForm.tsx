import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Modal,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import ImageUploader from '../ImageUploader';
import DocumentUploader from '../DocumentUploader';
import { CreateTecnicoPayload } from '../../services/TecnicoService';

type Props = {
    initialValues: CreateTecnicoPayload;
    onSubmit: (values: CreateTecnicoPayload) => Promise<void>;
    submitLabel?: string;
    showDocumentUploaders?: boolean;
    onPhotoUploaded?: (photoUrl: string) => void;
    onEpsUploaded?: (epsUrl: string) => void;
    onArlUploaded?: (arlUrl: string) => void;
    onPensionUploaded?: (pensionUrl: string) => void;
    initialPhoto?: string | null;
    initialEps?: string | null;
    initialArl?: string | null;
    initialPension?: string | null;
};

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const validationSchema = Yup.object().shape({
    name: Yup.string().trim().required('Nombre es requerido'),
    document: Yup.string()
        .trim()
        .required('Documento es requerido')
        .max(20, 'Máximo 20 caracteres'),
    email: Yup.string()
        .trim()
        .email('Correo inválido')
        .nullable(),
    phone: Yup.string()
        .trim()
        .nullable()
        .max(20, 'Máximo 20 caracteres')
        .matches(/^\+?\d{7,20}$/, 'Teléfono inválido (solo números, ej: +573001234567)')
        .notRequired(),
    address: Yup.string()
        .nullable()
        .max(255, 'Máximo 255 caracteres'),
    specialty: Yup.string()
        .trim()
        .required('Especialidad es requerida')
        .max(100, 'Máximo 100 caracteres'),
    blood_type: Yup.string()
        .nullable()
        .oneOf([...BLOOD_TYPES, null, ''], 'Tipo de sangre inválido'),
    hire_date: Yup.date()
        .required('Fecha de contratación es requerida')
        .max(new Date(), 'La fecha no puede ser futura')
        .typeError('Formato de fecha inválido'),
    contract_type: Yup.string()
        .oneOf(['full_time', 'part_time', 'contractor'], 'Tipo de contrato inválido')
        .required('Tipo de contrato es requerido'),
});

export default function TecnicoForm({ 
    initialValues, 
    onSubmit, 
    submitLabel = 'Guardar técnico',
    showDocumentUploaders = false,
    onPhotoUploaded,
    onEpsUploaded,
    onArlUploaded,
    onPensionUploaded,
    initialPhoto,
    initialEps,
    initialArl,
    initialPension
}: Props) {
    const [showBloodTypeDropdown, setShowBloodTypeDropdown] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            validateOnChange={true}
            validateOnBlur={true}
        >
            {(formik) => (
                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    {/* Información Personal */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="person-outline" size={20} color="#007AFF" />
                            <Text style={styles.cardTitle}>Información Personal</Text>
                        </View>

                        <Text style={styles.label}>Nombre Completo*</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedField === 'name' && styles.inputFocused,
                                formik.touched.name && formik.errors.name && styles.inputError
                            ]}
                            placeholder="Ej: Juan Pérez García"
                            value={formik.values.name}
                            onChangeText={(t) => formik.setFieldValue('name', t)}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => {
                                setFocusedField(null);
                                formik.setFieldTouched('name');
                            }}
                        />
                        {formik.touched.name && formik.errors.name && (
                            <Text style={styles.errorText}>
                                <Ionicons name="alert-circle" size={12} /> {formik.errors.name}
                            </Text>
                        )}

                        <Text style={styles.label}>Documento de Identidad*</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedField === 'document' && styles.inputFocused,
                                formik.touched.document && formik.errors.document && styles.inputError
                            ]}
                            placeholder="Ej: 1234567890"
                            keyboardType="number-pad"
                            maxLength={20}
                            value={formik.values.document}
                            onChangeText={(t) => formik.setFieldValue('document', t)}
                            onFocus={() => setFocusedField('document')}
                            onBlur={() => {
                                setFocusedField(null);
                                formik.setFieldTouched('document');
                            }}
                        />
                        {formik.touched.document && formik.errors.document && (
                            <Text style={styles.errorText}>
                                <Ionicons name="alert-circle" size={12} /> {formik.errors.document}
                            </Text>
                        )}

                        <Text style={styles.label}>Correo Electrónico</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedField === 'email' && styles.inputFocused,
                                formik.touched.email && formik.errors.email && styles.inputError
                            ]}
                            placeholder="ejemplo@correo.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            value={formik.values.email ?? ''}
                            onChangeText={(t) => formik.setFieldValue('email', t.trim() || null)}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => {
                                setFocusedField(null);
                                formik.setFieldTouched('email');
                            }}
                        />
                        {formik.touched.email && formik.errors.email && (
                            <Text style={styles.errorText}>
                                <Ionicons name="alert-circle" size={12} /> {formik.errors.email}
                            </Text>
                        )}

                        <Text style={styles.label}>Teléfono</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedField === 'phone' && styles.inputFocused,
                                formik.touched.phone && formik.errors.phone && styles.inputError
                            ]}
                            placeholder="Ej: +573001234567"
                            keyboardType="phone-pad"
                            maxLength={20}
                            value={formik.values.phone ?? ''}
                            onChangeText={(t) => formik.setFieldValue('phone', t || null)}
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => {
                                setFocusedField(null);
                                formik.setFieldTouched('phone');
                            }}
                        />
                        {formik.touched.phone && formik.errors.phone && (
                            <Text style={styles.errorText}>
                                <Ionicons name="alert-circle" size={12} /> {formik.errors.phone}
                            </Text>
                        )}

                        <Text style={styles.label}>Dirección</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedField === 'address' && styles.inputFocused,
                                formik.touched.address && formik.errors.address && styles.inputError
                            ]}
                            placeholder="Ej: Calle 123 #45-67"
                            maxLength={255}
                            value={formik.values.address ?? ''}
                            onChangeText={(t) => formik.setFieldValue('address', t || null)}
                            onFocus={() => setFocusedField('address')}
                            onBlur={() => {
                                setFocusedField(null);
                                formik.setFieldTouched('address');
                            }}
                        />
                        {formik.touched.address && formik.errors.address && (
                            <Text style={styles.errorText}>
                                <Ionicons name="alert-circle" size={12} /> {formik.errors.address}
                            </Text>
                        )}

                        <Text style={styles.label}>Tipo de Sangre</Text>
                        <TouchableOpacity
                            style={[
                                styles.input,
                                styles.dropdownButton,
                                focusedField === 'blood_type' && styles.inputFocused,
                                formik.touched.blood_type && formik.errors.blood_type && styles.inputError
                            ]}
                            onPress={() => {
                                setShowBloodTypeDropdown(true);
                                setFocusedField('blood_type');
                            }}
                        >
                            <Text style={formik.values.blood_type ? styles.dropdownText : styles.placeholder}>
                                {formik.values.blood_type || 'Seleccione tipo de sangre'}
                            </Text>
                            <Ionicons 
                                name="chevron-down" 
                                size={20} 
                                color="#666" 
                            />
                        </TouchableOpacity>

                        {/* Modal para el dropdown de tipo de sangre */}
                        <Modal
                            visible={showBloodTypeDropdown}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => {
                                setShowBloodTypeDropdown(false);
                                setFocusedField(null);
                            }}
                        >
                            <TouchableOpacity 
                                style={styles.modalOverlay}
                                activeOpacity={1}
                                onPress={() => {
                                    setShowBloodTypeDropdown(false);
                                    setFocusedField(null);
                                }}
                            >
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Seleccione tipo de sangre</Text>
                                        <TouchableOpacity 
                                            onPress={() => {
                                                setShowBloodTypeDropdown(false);
                                                setFocusedField(null);
                                            }}
                                        >
                                            <Ionicons name="close-circle" size={28} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView style={styles.modalScroll}>
                                        <TouchableOpacity
                                            style={[
                                                styles.modalItem,
                                                !formik.values.blood_type && styles.modalItemSelected
                                            ]}
                                            onPress={() => {
                                                formik.setFieldValue('blood_type', null);
                                                setShowBloodTypeDropdown(false);
                                                setFocusedField(null);
                                            }}
                                        >
                                            <Text style={[
                                                styles.modalItemText,
                                                !formik.values.blood_type && styles.modalItemTextSelected
                                            ]}>
                                                Sin especificar
                                            </Text>
                                            {!formik.values.blood_type && (
                                                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                                            )}
                                        </TouchableOpacity>
                                        {BLOOD_TYPES.map((type) => (
                                            <TouchableOpacity
                                                key={type}
                                                style={[
                                                    styles.modalItem,
                                                    formik.values.blood_type === type && styles.modalItemSelected
                                                ]}
                                                onPress={() => {
                                                    formik.setFieldValue('blood_type', type);
                                                    setShowBloodTypeDropdown(false);
                                                    setFocusedField(null);
                                                }}
                                            >
                                                <Text style={[
                                                    styles.modalItemText,
                                                    formik.values.blood_type === type && styles.modalItemTextSelected
                                                ]}>
                                                    {type}
                                                </Text>
                                                {formik.values.blood_type === type && (
                                                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </TouchableOpacity>
                        </Modal>
                        {formik.touched.blood_type && formik.errors.blood_type && (
                            <Text style={styles.errorText}>
                                <Ionicons name="alert-circle" size={12} /> {formik.errors.blood_type}
                            </Text>
                        )}
                    </View>

                    {/* Información Laboral */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="briefcase-outline" size={20} color="#007AFF" />
                            <Text style={styles.cardTitle}>Información Laboral</Text>
                        </View>

                        <Text style={styles.label}>Especialidad*</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedField === 'specialty' && styles.inputFocused,
                                formik.touched.specialty && formik.errors.specialty && styles.inputError
                            ]}
                            placeholder="Ej: Mantenimiento Industrial"
                            maxLength={100}
                            value={formik.values.specialty ?? ''}
                            onChangeText={(t) => formik.setFieldValue('specialty', t)}
                            onFocus={() => setFocusedField('specialty')}
                            onBlur={() => {
                                setFocusedField(null);
                                formik.setFieldTouched('specialty');
                            }}
                        />
                        {formik.touched.specialty && formik.errors.specialty && (
                            <Text style={styles.errorText}>
                                <Ionicons name="alert-circle" size={12} /> {formik.errors.specialty}
                            </Text>
                        )}

                        <Text style={styles.label}>Fecha de Contratación*</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedField === 'hire_date' && styles.inputFocused,
                                formik.touched.hire_date && formik.errors.hire_date && styles.inputError
                            ]}
                            placeholder="YYYY-MM-DD (Ej: 2024-01-15)"
                            value={formik.values.hire_date ?? ''}
                            onChangeText={(t) => formik.setFieldValue('hire_date', t)}
                            onFocus={() => setFocusedField('hire_date')}
                            onBlur={() => {
                                setFocusedField(null);
                                formik.setFieldTouched('hire_date');
                            }}
                        />
                        {formik.touched.hire_date && formik.errors.hire_date && (
                            <Text style={styles.errorText}>
                                <Ionicons name="alert-circle" size={12} /> {formik.errors.hire_date}
                            </Text>
                        )}

                        <Text style={styles.label}>Tipo de Contrato*</Text>
                        <View style={styles.radioContainer}>
                            <TouchableOpacity 
                                style={[
                                    styles.radioOption, 
                                    formik.values.contract_type === 'full_time' && styles.radioSelected
                                ]}
                                onPress={() => formik.setFieldValue('contract_type', 'full_time')}
                            >
                                <Ionicons 
                                    name={formik.values.contract_type === 'full_time' ? "radio-button-on" : "radio-button-off"} 
                                    size={20} 
                                    color={formik.values.contract_type === 'full_time' ? "#fff" : "#666"} 
                                />
                                <Text style={[
                                    styles.radioText, 
                                    formik.values.contract_type === 'full_time' && styles.radioTextSelected
                                ]}>
                                    Tiempo Completo
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[
                                    styles.radioOption, 
                                    formik.values.contract_type === 'part_time' && styles.radioSelected
                                ]}
                                onPress={() => formik.setFieldValue('contract_type', 'part_time')}
                            >
                                <Ionicons 
                                    name={formik.values.contract_type === 'part_time' ? "radio-button-on" : "radio-button-off"} 
                                    size={20} 
                                    color={formik.values.contract_type === 'part_time' ? "#fff" : "#666"} 
                                />
                                <Text style={[
                                    styles.radioText, 
                                    formik.values.contract_type === 'part_time' && styles.radioTextSelected
                                ]}>
                                    Medio Tiempo
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[
                                    styles.radioOption, 
                                    formik.values.contract_type === 'contractor' && styles.radioSelected
                                ]}
                                onPress={() => formik.setFieldValue('contract_type', 'contractor')}
                            >
                                <Ionicons 
                                    name={formik.values.contract_type === 'contractor' ? "radio-button-on" : "radio-button-off"} 
                                    size={20} 
                                    color={formik.values.contract_type === 'contractor' ? "#fff" : "#666"} 
                                />
                                <Text style={[
                                    styles.radioText, 
                                    formik.values.contract_type === 'contractor' && styles.radioTextSelected
                                ]}>
                                    Contratista
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {formik.touched.contract_type && formik.errors.contract_type && (
                            <Text style={styles.errorText}>
                                <Ionicons name="alert-circle" size={12} /> {formik.errors.contract_type}
                            </Text>
                        )}
                    </View>

                    {/* Foto de Perfil y Documentos */}
                    {showDocumentUploaders && (
                        <>
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Ionicons name="image-outline" size={20} color="#007AFF" />
                                    <Text style={styles.cardTitle}>Foto de Perfil</Text>
                                </View>
                                <ImageUploader
                                    title="Foto del técnico"
                                    initialImageUri={initialPhoto}
                                    onImageUploaded={(url) => {
                                        onPhotoUploaded?.(url || '');
                                        formik.setFieldValue('photo', url || null);
                                    }}
                                    imageName="tecnico_foto"
                                />
                            </View>

                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Ionicons name="document-text-outline" size={20} color="#007AFF" />
                                    <Text style={styles.cardTitle}>Documentos de Seguridad Social</Text>
                                </View>
                                <Text style={styles.helperText}>
                                    <Ionicons name="information-circle-outline" size={12} /> 
                                    {' '}Cargue los documentos de afiliación a seguridad social
                                </Text>
                                
                                <View style={styles.documentItem}>
                                    <Text style={styles.documentLabel}>
                                        <Ionicons name="medkit-outline" size={14} color="#666" /> 
                                        {' '}Documento EPS
                                    </Text>
                                    <DocumentUploader
                                        title="EPS (Entidad Promotora de Salud)"
                                        initialDocumentUri={initialEps}
                                        onDocumentUploaded={(url) => {
                                            onEpsUploaded?.(url || '');
                                            formik.setFieldValue('eps_pdf', url || null);
                                        }}
                                        customDocumentName="tecnico_eps"
                                    />
                                </View>

                                <View style={styles.documentItem}>
                                    <Text style={styles.documentLabel}>
                                        <Ionicons name="shield-checkmark-outline" size={14} color="#666" /> 
                                        {' '}Documento ARL
                                    </Text>
                                    <DocumentUploader
                                        title="ARL (Administradora de Riesgos Laborales)"
                                        initialDocumentUri={initialArl}
                                        onDocumentUploaded={(url) => {
                                            onArlUploaded?.(url || '');
                                            formik.setFieldValue('arl_pdf', url || null);
                                        }}
                                        customDocumentName="tecnico_arl"
                                    />
                                </View>

                                <View style={styles.documentItem}>
                                    <Text style={styles.documentLabel}>
                                        <Ionicons name="wallet-outline" size={14} color="#666" /> 
                                        {' '}Documento Pensión
                                    </Text>
                                    <DocumentUploader
                                        title="Fondo de Pensión"
                                        initialDocumentUri={initialPension}
                                        onDocumentUploaded={(url) => {
                                            onPensionUploaded?.(url || '');
                                            formik.setFieldValue('pension_pdf', url || null);
                                        }}
                                        customDocumentName="tecnico_pension"
                                    />
                                </View>
                            </View>
                        </>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.submitButton, 
                            (formik.isSubmitting || !formik.isValid) && styles.submitButtonDisabled
                        ]}
                        onPress={formik.handleSubmit as any}
                        disabled={formik.isSubmitting}
                        activeOpacity={0.8}
                    >
                        {formik.isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                <Text style={styles.submitText}>{submitLabel}</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.bottomSpacing} />
                </ScrollView>
            )}
        </Formik>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    label: {
        fontSize: 13,
        color: '#333',
        marginTop: 14,
        marginBottom: 6,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#F7F7F7',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#000',
        borderWidth: 2,
        borderColor: '#E6E6E6',
    },
    inputFocused: {
        borderColor: '#007AFF',
        backgroundColor: '#F8FBFF',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    inputError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF5F5',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
    helperText: {
        color: '#999',
        fontSize: 12,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 15,
        color: '#000',
    },
    placeholder: {
        fontSize: 15,
        color: '#999',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    modalScroll: {
        maxHeight: 400,
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    modalItemSelected: {
        backgroundColor: '#F0F7FF',
    },
    modalItemText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    modalItemTextSelected: {
        fontWeight: '700',
        color: '#007AFF',
    },
    submitButton: {
        marginTop: 8,
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    radioContainer: {
        flexDirection: 'column',
        gap: 10,
        marginTop: 8,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E6E6E6',
        backgroundColor: '#F7F7F7',
    },
    radioSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    radioText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
    },
    radioTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    documentItem: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    documentLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    bottomSpacing: {
        height: 20,
    },
});