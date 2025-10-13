import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Modal,
    FlatList,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { ClienteFormValues } from '../../types/cliente/cliente';

type Props = {
    initialValues: ClienteFormValues;
    onSubmit: (values: ClienteFormValues) => Promise<void>;
    submitLabel?: string;
};

const phoneRegex = /^(?=(?:\D*\d){7,10})\+?[0-9\s-]+$/;

const identifierRegex = /^[\d-]+$/;

const validationSchema = Yup.object().shape({
    name: Yup.string().trim().required('Nombre es requerido'),
    identifier: Yup.string()
        .matches(identifierRegex, 'Identificador solo puede contener números y guiones')
        .required('Identificador es requerido'),
    email: Yup.string().trim().email('Correo inválido').notRequired(),
    client_type: Yup.mixed<'Natural' | 'Jurídico'>().oneOf(['Natural', 'Jurídico']).required(),
    document_type: Yup.mixed<'CC' | 'CE' | 'CI' | 'PASS' | 'NIT'>().oneOf(['CC', 'CE', 'CI', 'PASS', 'NIT']).required(),
    city: Yup.string().trim().required('Ciudad es requerida'),
    department: Yup.string().trim().required('Departamento es requerido'),
    address: Yup.string().trim().required('Dirección es requerida'),
    phone: Yup.string()
        .trim()
        .matches(phoneRegex, 'Teléfono debe tener entre 7 y 10 dígitos')
        .required('Teléfono es requerido'),
    legal_representative: Yup.string().trim().notRequired(),
    contacts: Yup.array()
        .of(
            Yup.object({
                nombre_contacto: Yup.string().trim().required('Nombre del contacto es requerido'),
                correo: Yup.string().trim().email('Correo inválido').required('Correo es requerido'),
                telefono: Yup.string().trim().matches(phoneRegex, 'Teléfono debe tener entre 7 y 10 dígitos').required('Teléfono es requerido'),
                direccion: Yup.string().trim().required('Dirección es requerida'),
                cargo: Yup.string().trim().required('Cargo es requerido'),
            })
        )
        .max(10, 'Máximo 10 contactos'),
});

const documentTypes = [
    { 
        key: 'CC', 
        title: 'Cédula de Ciudadanía',
        icon: 'person-outline',
        color: '#4F46E5',
        bgColor: '#EEF2FF'
    },
    { 
        key: 'CE', 
        title: 'Cédula de Extranjería',
        icon: 'globe-outline',
        color: '#059669',
        bgColor: '#ECFDF5'
    },
    { 
        key: 'CI', 
        title: 'Cédula de Identidad',
        icon: 'id-card-outline',
        color: '#DC2626',
        bgColor: '#FEF2F2'
    },
    { 
        key: 'PASS', 
        title: 'Pasaporte',
        icon: 'airplane-outline',
        color: '#7C3AED',
        bgColor: '#F3E8FF'
    },
    { 
        key: 'NIT', 
        title: 'NIT',
        icon: 'business-outline',
        color: '#EA580C',
        bgColor: '#FFF7ED'
    },
];

export default function ClienteForm({ initialValues, onSubmit, submitLabel = 'Guardar cliente' }: Props) {
    const [showDocumentModal, setShowDocumentModal] = useState(false);

    const addContact = (formik: any) => {
        const newContact = {
            nombre_contacto: '',
            correo: '',
            telefono: '',
            direccion: '',
            cargo: '',
        };
        formik.setFieldValue('contacts', [...formik.values.contacts, newContact]);
    };

    const removeContact = (formik: any, index: number) => {
        const newContacts = formik.values.contacts.filter((_: any, i: number) => i !== index);
        formik.setFieldValue('contacts', newContacts);
    };

    const getSelectedDocument = (type: string) => {
        return documentTypes.find(doc => doc.key === type);
    };

    const getAvailableDocumentTypes = (clientType: 'Natural' | 'Jurídico') => {
        if (clientType === 'Jurídico') {
            return documentTypes.filter(doc => doc.key === 'NIT');
        }
        return documentTypes.filter(doc => doc.key !== 'NIT');
    };

    const renderContactCard = ({ item, index, formik }: any) => (
        <View key={index} style={styles.contactCard}>
            <View style={styles.contactHeader}>
                <View style={styles.contactBadge}>
                    <Text style={styles.contactBadgeText}>Contacto {index + 1}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => removeContact(formik, index)}
                    style={styles.deleteButton}
                >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.contactInputs}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre *</Text>
                    <View style={styles.inputWithIcon}>
                        <Ionicons name="person-outline" size={16} color="#6B7280" />
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre completo"
                            value={item.nombre_contacto}
                            onChangeText={(text) => {
                                const newContacts = [...formik.values.contacts];
                                newContacts[index].nombre_contacto = text;
                                formik.setFieldValue('contacts', newContacts);
                            }}
                        />
                    </View>
                    {formik.errors.contacts?.[index]?.nombre_contacto && (
                        <Text style={styles.errorText}>{formik.errors.contacts[index].nombre_contacto}</Text>
                    )}
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Correo *</Text>
                        <View style={styles.inputWithIcon}>
                            <Ionicons name="mail-outline" size={16} color="#6B7280" />
                            <TextInput
                                style={styles.input}
                                placeholder="correo@ejemplo.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={item.correo}
                                onChangeText={(text) => {
                                    const newContacts = [...formik.values.contacts];
                                    newContacts[index].correo = text;
                                    formik.setFieldValue('contacts', newContacts);
                                }}
                            />
                        </View>
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Teléfono *</Text>
                        <View style={styles.inputWithIcon}>
                            <Ionicons name="call-outline" size={16} color="#6B7280" />
                            <TextInput
                                style={styles.input}
                                placeholder="3001234567"
                                keyboardType="phone-pad"
                                value={item.telefono}
                                onChangeText={(text) => {
                                    const newContacts = [...formik.values.contacts];
                                    newContacts[index].telefono = text;
                                    formik.setFieldValue('contacts', newContacts);
                                }}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Dirección *</Text>
                        <View style={styles.inputWithIcon}>
                            <Ionicons name="location-outline" size={16} color="#6B7280" />
                            <TextInput
                                style={styles.input}
                                placeholder="Dirección"
                                value={item.direccion}
                                onChangeText={(text) => {
                                    const newContacts = [...formik.values.contacts];
                                    newContacts[index].direccion = text;
                                    formik.setFieldValue('contacts', newContacts);
                                }}
                            />
                        </View>
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Cargo *</Text>
                        <View style={styles.inputWithIcon}>
                            <Ionicons name="briefcase-outline" size={16} color="#6B7280" />
                            <TextInput
                                style={styles.input}
                                placeholder="Cargo"
                                value={item.cargo}
                                onChangeText={(text) => {
                                    const newContacts = [...formik.values.contacts];
                                    newContacts[index].cargo = text;
                                    formik.setFieldValue('contacts', newContacts);
                                }}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {(formik) => (
                    <>
                        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                            {/* Información Básica */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="person-outline" size={20} color="#667eea" />
                                    <Text style={styles.sectionTitle}>Información Básica</Text>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Nombre completo *</Text>
                                    <View style={styles.inputWithIcon}>
                                        <Ionicons name="person-outline" size={16} color="#6B7280" />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ej: Empresa ABC S.A.S"
                                            value={formik.values.name}
                                            onChangeText={(t) => formik.setFieldValue('name', t)}
                                            onBlur={() => formik.setFieldTouched('name')}
                                        />
                                    </View>
                                    {formik.touched.name && formik.errors.name && (
                                        <Text style={styles.errorText}>{formik.errors.name}</Text>
                                    )}
                                </View>

                                <View style={styles.inputRow}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <Text style={styles.label}>Identificador *</Text>
                                        <View style={styles.inputWithIcon}>
                                            <Ionicons name="finger-print-outline" size={16} color="#6B7280" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="123456789"
                                                value={formik.values.identifier}
                                                onChangeText={(t) => formik.setFieldValue('identifier', t)}
                                                onBlur={() => formik.setFieldTouched('identifier')}
                                            />
                                        </View>
                                        {formik.touched.identifier && formik.errors.identifier && (
                                            <Text style={styles.errorText}>{formik.errors.identifier}</Text>
                                        )}
                                    </View>

                                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                        <Text style={styles.label}>Email</Text>
                                        <View style={styles.inputWithIcon}>
                                            <Ionicons name="mail-outline" size={16} color="#6B7280" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="email@ejemplo.com"
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                value={formik.values.email}
                                                onChangeText={(t) => formik.setFieldValue('email', t)}
                                                onBlur={() => formik.setFieldTouched('email')}
                                            />
                                        </View>
                                        {formik.touched.email && formik.errors.email && (
                                            <Text style={styles.errorText}>{formik.errors.email}</Text>
                                        )}
                                    </View>
                                </View>

                                {/* Tipo de Cliente */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Tipo de Cliente *</Text>
                                    <View style={styles.clientTypeContainer}>
                                        <TouchableOpacity
                                            style={[
                                                styles.clientTypeButton,
                                                formik.values.client_type === 'Natural' && styles.clientTypeButtonActive
                                            ]}
                                            onPress={() => {
                                                formik.setFieldValue('client_type', 'Natural');
                                                // Si el tipo de documento actual es NIT, cambiarlo a CC
                                                if (formik.values.document_type === 'NIT') {
                                                    formik.setFieldValue('document_type', 'CC');
                                                }
                                            }}
                                        >
                                            <Ionicons 
                                                name="person" 
                                                size={18} 
                                                color={formik.values.client_type === 'Natural' ? '#fff' : '#667eea'} 
                                            />
                                            <Text style={[
                                                styles.clientTypeText,
                                                formik.values.client_type === 'Natural' && styles.clientTypeTextActive
                                            ]}>
                                                Natural
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.clientTypeButton,
                                                formik.values.client_type === 'Jurídico' && styles.clientTypeButtonActive
                                            ]}
                                            onPress={() => {
                                                formik.setFieldValue('client_type', 'Jurídico');
                                                // Cambiar automáticamente a NIT cuando se seleccione Jurídico
                                                formik.setFieldValue('document_type', 'NIT');
                                            }}
                                        >
                                            <Ionicons 
                                                name="business" 
                                                size={18} 
                                                color={formik.values.client_type === 'Jurídico' ? '#fff' : '#667eea'} 
                                            />
                                            <Text style={[
                                                styles.clientTypeText,
                                                formik.values.client_type === 'Jurídico' && styles.clientTypeTextActive
                                            ]}>
                                                Jurídico
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Tipo de Documento */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Tipo de Documento *</Text>
                                    {formik.values.client_type === 'Jurídico' && (
                                        <Text style={styles.infoText}>
                                            Para clientes jurídicos solo se permite NIT
                                        </Text>
                                    )}
                                    <TouchableOpacity
                                        style={[
                                            styles.documentSelector,
                                            formik.values.client_type === 'Jurídico' && styles.documentSelectorDisabled
                                        ]}
                                        onPress={() => setShowDocumentModal(true)}
                                        disabled={formik.values.client_type === 'Jurídico'}
                                    >
                                        {formik.values.document_type ? (
                                            <View style={styles.selectedDocument}>
                                                <View style={[
                                                    styles.selectedDocumentIcon,
                                                    { backgroundColor: getSelectedDocument(formik.values.document_type)?.bgColor }
                                                ]}>
                                                    <Ionicons 
                                                        name={getSelectedDocument(formik.values.document_type)?.icon as any} 
                                                        size={18} 
                                                        color={getSelectedDocument(formik.values.document_type)?.color}
                                                    />
                                                </View>
                                                <View style={styles.selectedDocumentText}>
                                                    <Text style={styles.selectedDocumentTitle}>
                                                        {getSelectedDocument(formik.values.document_type)?.key}
                                                    </Text>
                                                    <Text style={styles.selectedDocumentSubtitle}>
                                                        {getSelectedDocument(formik.values.document_type)?.title}
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : (
                                            <Text style={styles.placeholderText}>Seleccionar tipo de documento</Text>
                                        )}
                                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                {formik.values.client_type === 'Jurídico' && (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Representante Legal</Text>
                                        <View style={styles.inputWithIcon}>
                                            <Ionicons name="person-circle-outline" size={16} color="#6B7280" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Ej: Juan Pérez"
                                                value={formik.values.legal_representative || ''}
                                                onChangeText={(t) => formik.setFieldValue('legal_representative', t)}
                                                onBlur={() => formik.setFieldTouched('legal_representative')}
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Ubicación */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="location-outline" size={20} color="#667eea" />
                                    <Text style={styles.sectionTitle}>Ubicación</Text>
                                </View>

                                <View style={styles.inputRow}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <Text style={styles.label}>Ciudad *</Text>
                                        <View style={styles.inputWithIcon}>
                                            <Ionicons name="location-outline" size={16} color="#6B7280" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Ej: Bogotá"
                                                value={formik.values.city}
                                                onChangeText={(t) => formik.setFieldValue('city', t)}
                                                onBlur={() => formik.setFieldTouched('city')}
                                            />
                                        </View>
                                        {formik.touched.city && formik.errors.city && (
                                            <Text style={styles.errorText}>{formik.errors.city}</Text>
                                        )}
                                    </View>

                                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                        <Text style={styles.label}>Departamento *</Text>
                                        <View style={styles.inputWithIcon}>
                                            <Ionicons name="map-outline" size={16} color="#6B7280" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Ej: Cundinamarca"
                                                value={formik.values.department}
                                                onChangeText={(t) => formik.setFieldValue('department', t)}
                                                onBlur={() => formik.setFieldTouched('department')}
                                            />
                                        </View>
                                        {formik.touched.department && formik.errors.department && (
                                            <Text style={styles.errorText}>{formik.errors.department}</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.inputRow}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <Text style={styles.label}>Dirección *</Text>
                                        <View style={styles.inputWithIcon}>
                                            <Ionicons name="home-outline" size={16} color="#6B7280" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Calle 123 #45-67"
                                                value={formik.values.address}
                                                onChangeText={(t) => formik.setFieldValue('address', t)}
                                                onBlur={() => formik.setFieldTouched('address')}
                                            />
                                        </View>
                                        {formik.touched.address && formik.errors.address && (
                                            <Text style={styles.errorText}>{formik.errors.address}</Text>
                                        )}
                                    </View>

                                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                        <Text style={styles.label}>Teléfono *</Text>
                                        <View style={styles.inputWithIcon}>
                                            <Ionicons name="call-outline" size={16} color="#6B7280" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="3001234567"
                                                keyboardType="phone-pad"
                                                value={formik.values.phone}
                                                onChangeText={(t) => formik.setFieldValue('phone', t)}
                                                onBlur={() => formik.setFieldTouched('phone')}
                                            />
                                        </View>
                                        {formik.touched.phone && formik.errors.phone && (
                                            <Text style={styles.errorText}>{formik.errors.phone}</Text>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Contactos */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="people-outline" size={20} color="#667eea" />
                                    <Text style={styles.sectionTitle}>Contactos</Text>
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={() => addContact(formik)}
                                    >
                                        <Ionicons name="add" size={18} color="#fff" />
                                    </TouchableOpacity>
                                </View>

                                {formik.values.contacts.map((contact, index) =>
                                    renderContactCard({ item: contact, index, formik })
                                )}

                                {formik.values.contacts.length === 0 && (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="people-outline" size={40} color="#9CA3AF" />
                                        <Text style={styles.emptyText}>No hay contactos</Text>
                                        <Text style={styles.emptySubtext}>Toca + para agregar</Text>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[styles.submitButton, formik.isSubmitting && { opacity: 0.7 }]}
                                onPress={() => {
                                    console.log('🔍 ClienteForm - Submit button pressed');
                                    console.log('🔍 ClienteForm - formik.isSubmitting:', formik.isSubmitting);
                                    console.log('🔍 ClienteForm - formik.isValid:', formik.isValid);
                                    console.log('🔍 ClienteForm - formik.errors:', formik.errors);
                                    formik.handleSubmit();
                                }}
                                disabled={formik.isSubmitting}
                                activeOpacity={0.8}
                            >
                                {formik.isSubmitting ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                        <Text style={styles.submitText}>{submitLabel}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>

                        {/* Modal para selección de documento */}
                        <Modal
                            visible={showDocumentModal}
                            transparent={true}
                            animationType="slide"
                            onRequestClose={() => setShowDocumentModal(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Tipo de Documento</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowDocumentModal(false)}
                                            style={styles.closeButton}
                                        >
                                            <Ionicons name="close" size={22} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>
                                    
                                    <FlatList
                                        data={getAvailableDocumentTypes(formik.values.client_type)}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={styles.documentOption}
                                                onPress={() => {
                                                    formik.setFieldValue('document_type', item.key);
                                                    setShowDocumentModal(false);
                                                }}
                                            >
                                                <View style={[styles.documentIconContainer, { backgroundColor: item.bgColor }]}>
                                                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                                                </View>
                                                <View style={styles.documentTextContainer}>
                                                    <Text style={styles.documentTitle}>{item.key}</Text>
                                                    <Text style={styles.documentSubtitle}>{item.title}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        )}
                                        keyExtractor={(item) => item.key}
                                        showsVerticalScrollIndicator={false}
                                    />
                                </View>
                            </View>
                        </Modal>
                    </>
                )}
            </Formik>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 10,
        flex: 1,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#667eea',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputGroup: {
        marginBottom: 14,
    },
    inputRow: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        marginLeft: 8,
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
    },
    clientTypeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    clientTypeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        gap: 6,
    },
    clientTypeButtonActive: {
        borderColor: '#667eea',
        backgroundColor: '#667eea',
    },
    clientTypeText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#667eea',
    },
    clientTypeTextActive: {
        color: '#fff',
    },
    documentSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    selectedDocument: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    selectedDocumentIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedDocumentText: {
        flex: 1,
    },
    selectedDocumentTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    selectedDocumentSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 1,
    },
    placeholderText: {
        fontSize: 15,
        color: '#9CA3AF',
    },
    contactCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    contactHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactBadge: {
        backgroundColor: '#667eea',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    contactBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#FEF2F2',
    },
    contactInputs: {
        gap: 10,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 8,
    },
    emptySubtext: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
    },
    submitButton: {
        backgroundColor: '#667eea',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
        marginBottom: 24,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '65%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    closeButton: {
        padding: 4,
    },
    documentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 14,
    },
    documentIconContainer: {
        width: 42,
        height: 42,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    documentTextContainer: {
        flex: 1,
    },
    documentTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    documentSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    infoText: {
        fontSize: 12,
        color: '#059669',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    documentSelectorDisabled: {
        backgroundColor: '#F3F4F6',
        borderColor: '#D1D5DB',
        opacity: 0.7,
    },
});