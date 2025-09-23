import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { CreateCoordinadorPayload } from '../../services/CoordinadorService';

type Props = {
    initialValues: CreateCoordinadorPayload;
    onSubmit: (values: CreateCoordinadorPayload) => Promise<void>;
    submitLabel?: string;
};

const validationSchema = Yup.object().shape({
    name: Yup.string().trim().required('Nombre es requerido'),
    identification: Yup.string().trim().required('Documento es requerido'),
    email: Yup.string().trim().email('Correo inválido').nullable(),
    phone: Yup.string()
        .trim()
        .nullable()
        .matches(/^\+?\d{7,15}$/, 'Teléfono inválido (ej: +573001234567)')
        .notRequired(),
    address: Yup.string().nullable(),
});

export default function CoordinadorForm({ initialValues, onSubmit, submitLabel = 'Guardar Coordinador' }: Props) {
    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
        >
            {(formik) => (
                <>
                    <View style={styles.card}>
                        <Text style={styles.label}>Nombre*</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Juan Pérez"
                            value={formik.values.name}
                            onChangeText={(t) => formik.setFieldValue('name', t)}
                            onBlur={() => formik.setFieldTouched('name')}
                        />
                        {formik.touched.name && formik.errors.name && (
                            <Text style={styles.errorText}>{formik.errors.name}</Text>
                        )}

                        <Text style={styles.label}>Documento*</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: 1234567890"
                            keyboardType="number-pad"
                            value={formik.values.identification}
                            onChangeText={(t) => formik.setFieldValue('identification', t)}
                            onBlur={() => formik.setFieldTouched('identification')}
                        />
                        {formik.touched.identification && formik.errors.identification && (
                            <Text style={styles.errorText}>{formik.errors.identification}</Text>
                        )}

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ejemplo@correo.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={formik.values.email ?? ''}
                            onChangeText={(t) => formik.setFieldValue('email', t || null)}
                            onBlur={() => formik.setFieldTouched('email')}
                        />
                        {formik.touched.email && formik.errors.email && (
                            <Text style={styles.errorText}>{formik.errors.email}</Text>
                        )}

                        <Text style={styles.label}>Teléfono</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: +573001234567"
                            keyboardType="phone-pad"
                            value={formik.values.phone ?? ''}
                            onChangeText={(t) => formik.setFieldValue('phone', t || null)}
                            onBlur={() => formik.setFieldTouched('phone')}
                        />
                        {formik.touched.phone && formik.errors.phone && (
                            <Text style={styles.errorText}>{formik.errors.phone}</Text>
                        )}

                        <Text style={styles.label}>Dirección</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Calle 123 #45-67"
                            value={formik.values.address ?? ''}
                            onChangeText={(t) => formik.setFieldValue('address', t || null)}
                            onBlur={() => formik.setFieldTouched('address')}
                        />
                        {formik.touched.address && formik.errors.address && (
                            <Text style={styles.errorText}>{formik.errors.address}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, formik.isSubmitting && { opacity: 0.8 }]}
                        onPress={formik.handleSubmit as any}
                        disabled={formik.isSubmitting}
                        activeOpacity={0.9}
                    >
                        {formik.isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={20} color="#fff" />
                                <Text style={styles.submitText}>{submitLabel}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </>
            )}
        </Formik>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 14,
    },
    label: { fontSize: 13, color: '#666', marginTop: 12, marginBottom: 6, fontWeight: '700' },
    input: {
        backgroundColor: '#F7F7F7',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#000',
        borderWidth: 1,
        borderColor: '#E6E6E6',
    },
    errorText: { color: '#FF3B30', fontSize: 12, marginTop: 4 },
    submitButton: {
        margin: 40,
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
