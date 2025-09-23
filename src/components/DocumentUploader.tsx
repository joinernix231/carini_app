// src/components/DocumentUploader.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useDocumentUpload, DocumentUploadOptions } from '../hooks/useDocumentUpload';

interface DocumentUploaderProps {
  title?: string;
  initialDocumentUri?: string | null;
  initialDocumentName?: string | null;
  onDocumentChange?: (uri: string | null, name: string | null) => void;
  onDocumentUploaded?: (url: string | null) => void;
  options?: DocumentUploadOptions;
  disabled?: boolean;
  required?: boolean;
  customDocumentName?: string; // Nombre personalizado para el documento
}

export default function DocumentUploader({
  title = 'Documento PDF',
  initialDocumentUri = null,
  initialDocumentName = null,
  onDocumentChange,
  onDocumentUploaded,
  options = {},
  disabled = false,
  required = false,
  customDocumentName,
}: DocumentUploaderProps) {
  const {
    documentUri,
    documentName,
    uploading,
    error,
    pickDocument,
    uploadDocument,
    clearDocument,
    setDocument,
  } = useDocumentUpload(options);

  // Inicializar solo una vez con el documento inicial
  React.useEffect(() => {
    if (initialDocumentUri) {
      setDocument(initialDocumentUri, initialDocumentName);
    }
  }, []); // Solo se ejecuta una vez al montar

  // Notificar cambios
  React.useEffect(() => {
    onDocumentChange?.(documentUri, documentName);
  }, [documentUri, documentName, onDocumentChange]);

  const handlePickDocument = async () => {
    if (disabled) return;
    const result = await pickDocument();
    if (result && onDocumentUploaded) {
      const url = await uploadDocument(result.uri, result.name, customDocumentName);
      onDocumentUploaded(url);
    }
  };

  const handleRemoveDocument = () => {
    if (disabled) return;
    Alert.alert(
      'Eliminar documento',
      '¿Estás seguro que deseas eliminar este documento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            clearDocument();
            onDocumentChange?.(null, null);
            onDocumentUploaded?.(null);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {title}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      <View style={styles.documentContainer}>
        {documentUri ? (
          <View style={styles.documentPreview}>
            <View style={styles.documentIcon}>
              <MaterialIcons name="picture-as-pdf" size={32} color="#EF4444" />
            </View>
            <View style={styles.documentInfo}>
              <Text style={styles.documentName} numberOfLines={1}>
                {documentName || 'Documento.pdf'}
              </Text>
              <Text style={styles.documentType}>PDF • Vista previa</Text>
            </View>
            <View style={styles.documentStatus}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            {!disabled && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemoveDocument}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons name="picture-as-pdf" size={48} color="#9CA3AF" />
            <Text style={styles.placeholderText}>Sin documento</Text>
          </View>
        )}
      </View>

      {!disabled && (
        <TouchableOpacity
          style={[styles.uploadButton, uploading && { opacity: 0.6 }]}
          onPress={handlePickDocument}
          disabled={uploading}
        >
          <MaterialIcons name="attach-file" size={20} color="#3B82F6" />
          <Text style={styles.uploadButtonText}>Seleccionar PDF</Text>
        </TouchableOpacity>
      )}

      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.uploadingText}>Subiendo documento...</Text>
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  required: {
    color: '#EF4444',
  },
  documentContainer: {
    marginBottom: 16,
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    position: 'relative',
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    color: '#6B7280',
  },
  documentStatus: {
    marginLeft: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  placeholder: {
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
    alignSelf: 'center',
  },
  uploadButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadingText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});
